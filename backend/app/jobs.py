"""
Trabajos desde lecturas crudas: el usuario pega links (FASTQ, zip/tar, carpetas, Drive/Dropbox) o accesiones
de NCBI y el genoma de referencia. El servicio `procesador` (procesador/worker.py) descarga, cuenta con Salmon
y devuelve la tabla de conteos; recién ahí el usuario asigna la condición de cada muestra (contar no la
necesita, y en un zip no se sabe qué muestras hay hasta descargarlo). Con eso se crea un Dataset normal y
corre el mismo DESeq2 + anotación que un upload de conteos (routes.create_dataset).

queued -> running -> needs_conditions -> done, o error.
"""
import csv
import datetime
import hmac
import io
import json
import os
import re
import secrets
import urllib.request

from fastapi import APIRouter, BackgroundTasks, Body, Depends, Form, Header, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app import annotation
from app.database import UPLOADS_DIR, get_db
from app.models import Dataset, Job
from app.routes import create_dataset

router = APIRouter()

# Límites del servicio abierto (se cambian con variables de entorno en Railway, sin tocar código)
MAX_SAMPLES = int(os.getenv("JOB_MAX_SAMPLES", "30"))
MAX_GB = float(os.getenv("JOB_MAX_GB", "80"))
MAX_QUEUE = int(os.getenv("JOB_MAX_QUEUE", "5"))  # trabajos en cola + corriendo
MAX_LINKS = 500
MAX_ATTEMPTS = 2  # si el procesador se cae dos veces con el mismo trabajo, se marca error
STALE_MIN = 15  # sin noticias del procesador por este tiempo = se cayó; el trabajo se vuelve a tomar

ACC_RE = re.compile(r"^(?:[SED]RR\d+|[SED]RP\d+|[SED]RX\d+|PRJ(?:NA|EB|DB)\d+)$", re.I)
URL_RE = re.compile(r"^(?:https?|ftp)://\S+$", re.I)


def _now():
    return datetime.datetime.utcnow()


def _job_or_404(db: Session, token: str) -> Job:
    job = db.query(Job).filter(Job.token == token).first()
    if job is None:
        raise HTTPException(404, "Job not found")
    return job


def _parse_links(text: str) -> list[str]:
    lines = [l.strip() for l in text.splitlines() if l.strip() and not l.strip().startswith("#")]
    if not lines:
        raise HTTPException(400, "Paste at least one link or NCBI accession")
    if len(lines) > MAX_LINKS:
        raise HTTPException(400, f"At most {MAX_LINKS} lines")
    bad = [l for l in lines if not (URL_RE.match(l) or ACC_RE.match(l))]
    if bad:
        raise HTTPException(400, f"Not a link or an NCBI accession: \"{bad[0][:120]}\". "
                                 "Use an http(s)/ftp link or an accession such as SRR… or PRJNA…, one per line.")
    return [l.upper() if ACC_RE.match(l) else l for l in lines]


def _ncbi_json(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read())


def _check_genome(accession: str) -> str:
    """Comprueba que el ensamblaje existe en NCBI y es de una bacteria; devuelve el nombre del organismo."""
    try:
        rep = _ncbi_json(f"https://api.ncbi.nlm.nih.gov/datasets/v2/genome/accession/{accession}/dataset_report")
        reports = rep.get("reports") or []
        if not reports:
            raise HTTPException(400, f"Genome assembly {accession} was not found on NCBI")
        org = reports[0]["organism"]
        tax = _ncbi_json(f"https://api.ncbi.nlm.nih.gov/datasets/v2/taxonomy/taxon/{org['tax_id']}/dataset_report")
        cls = tax["reports"][0]["taxonomy"].get("classification", {})
        domain = (cls.get("domain") or cls.get("superkingdom") or {}).get("name", "")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Could not reach NCBI to check the genome; please try again in a moment")
    if domain != "Bacteria":
        raise HTTPException(400, f"{org['organism_name']} is not a bacterium; for now the platform processes bacteria only")
    strain = (org.get("infraspecific_names") or {}).get("strain")
    return f"{org['organism_name']} {strain}" if strain and strain not in org["organism_name"] else org["organism_name"]


def _job_view(db: Session, job: Job) -> dict:
    out = {
        "token": job.token, "name": job.name, "organism": job.organism, "genome_accession": job.genome_accession,
        "links": job.links.splitlines(), "status": job.status, "error": job.error,
        "progress": json.loads(job.progress) if job.progress else None,
        "created_at": job.created_at.isoformat() + "Z" if job.created_at else None,
        "dataset_id": job.dataset_id, "dataset_status": None, "queue_position": None,
    }
    if job.status == "queued":
        out["queue_position"] = db.query(Job).filter(Job.status.in_(("queued", "running")), Job.id < job.id).count()
    if job.dataset_id:
        ds = db.get(Dataset, job.dataset_id)
        out["dataset_status"] = ds.status if ds else None
    return out


# ── Usuario ────────────────────────────────────────────────────────────────────

@router.get("/jobs/config")
def jobs_config():
    return {"max_samples": MAX_SAMPLES, "max_gb": MAX_GB}


@router.post("/jobs")
def create_job(name: str = Form(...), genome_accession: str = Form(...), links: str = Form(...),
               db: Session = Depends(get_db)):
    name = name.strip()
    if not name:
        raise HTTPException(400, "Give the dataset a name")
    acc = genome_accession.strip()
    if not annotation.ACCESSION_RE.match(acc):
        raise HTTPException(400, f"\"{acc}\" does not look like an NCBI assembly accession (e.g. GCF_000013465.1)")
    lines = _parse_links(links)
    active = db.query(Job).filter(Job.status.in_(("queued", "running"))).count()
    if active >= MAX_QUEUE:
        raise HTTPException(429, f"{active} jobs are already in the queue; please try again later")
    organism = _check_genome(acc)
    job = Job(token=secrets.token_urlsafe(12), name=name[:256], organism=organism, genome_accession=acc,
              links="\n".join(lines), status="queued")
    db.add(job)
    db.commit()
    return {"token": job.token, "status": job.status, "organism": organism}


@router.get("/jobs/{token}")
def get_job(token: str, db: Session = Depends(get_db)):
    return _job_view(db, _job_or_404(db, token))


@router.get("/jobs/{token}/counts.csv")
def get_job_counts(token: str, db: Session = Depends(get_db)):
    """Tabla de conteos que devolvió el procesador (genes × muestras), para quien quiera analizarla por su cuenta."""
    job = _job_or_404(db, token)
    path = os.path.join(UPLOADS_DIR, "jobs", str(job.id), "counts.csv")
    if not os.path.exists(path):
        raise HTTPException(404, "The counts table is not ready yet")
    safe = re.sub(r"[^\w.-]+", "_", job.name).strip("_") or "counts"
    return Response(open(path, "rb").read(), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="{safe}_counts.csv"'})


@router.post("/jobs/{token}/conditions")
def set_conditions(token: str, background_tasks: BackgroundTasks,
                   baseline: str = Body(...), conditions: dict[str, str] = Body(...),
                   db: Session = Depends(get_db)):
    """conditions: muestra -> condición; las muestras con condición vacía quedan fuera del análisis."""
    job = _job_or_404(db, token)
    if job.status != "needs_conditions":
        raise HTTPException(409, "This job is not waiting for conditions")
    path = os.path.join(UPLOADS_DIR, "jobs", str(job.id), "counts.csv")
    rows = list(csv.reader(open(path, newline="")))
    header = rows[0]
    unknown = set(conditions) - set(header[1:])
    if unknown:
        raise HTTPException(400, f"Unknown sample: {sorted(unknown)[0]}")
    keep = [i for i, s in enumerate(header) if i == 0 or conditions.get(s, "").strip()]
    if len(keep) < 2:
        raise HTTPException(400, "Assign a condition to the samples you want to analyze")
    counts = io.StringIO()
    csv.writer(counts, lineterminator="\n").writerows([[r[i] for i in keep] for r in rows])
    meta = io.StringIO()
    w = csv.writer(meta, lineterminator="\n")
    w.writerow(["sample", "condition"])
    for i in keep[1:]:
        w.writerow([header[i], conditions[header[i]].strip()])
    # create_dataset valida (≥ 2 réplicas por condición, control presente) con los mismos mensajes del upload
    dataset = create_dataset(db, background_tasks, job.name, job.organism or "", baseline.strip(), job.genome_accession,
                             counts.getvalue().encode(), meta.getvalue().encode())
    job.dataset_id, job.status, job.updated_at = dataset.id, "done", _now()
    db.commit()
    return {"dataset_id": dataset.id, "status": dataset.status}


# ── Procesador (servicio interno, autenticado con WORKER_TOKEN) ───────────────

def _worker_auth(x_worker_token: str = Header("")):
    expected = os.getenv("WORKER_TOKEN", "")
    if not expected:
        raise HTTPException(503, "WORKER_TOKEN is not configured")
    if not hmac.compare_digest(x_worker_token, expected):
        raise HTTPException(401, "invalid worker token")


def _worker_job(db: Session, job_id: int) -> Job:
    job = db.get(Job, job_id)
    if job is None:
        raise HTTPException(404, "job not found")
    if job.status != "running":
        raise HTTPException(409, f"job is {job.status}")
    return job


@router.post("/worker/claim", dependencies=[Depends(_worker_auth)])
def worker_claim(fresh: bool = Body(False, embed=True), db: Session = Depends(get_db)):
    """Entrega el trabajo más antiguo en cola, o uno 'running' sin noticias hace rato. Con fresh=True (el
    procesador recién arrancó, p. ej. tras un redeploy) los 'running' quedaron huérfanos y se retoman ya."""
    stale = _now() if fresh else _now() - datetime.timedelta(minutes=STALE_MIN)
    for job in db.query(Job).filter(Job.status == "running", Job.updated_at < stale).all():
        if (job.attempts or 0) >= MAX_ATTEMPTS:
            job.status, job.error = "error", "Processing was interrupted twice; check the links and try again"
    db.commit()
    job = (db.query(Job).filter((Job.status == "queued") | ((Job.status == "running") & (Job.updated_at < stale)))
           .order_by(Job.id).first())
    if job is None:
        return Response(status_code=204)
    job.status, job.attempts, job.updated_at, job.error = "running", (job.attempts or 0) + 1, _now(), None
    db.commit()
    return {"id": job.id, "name": job.name, "genome_accession": job.genome_accession, "links": job.links.splitlines(),
            "max_samples": MAX_SAMPLES, "max_gb": MAX_GB}


@router.post("/worker/jobs/{job_id}/progress", dependencies=[Depends(_worker_auth)])
def worker_progress(job_id: int, progress: dict = Body(...), db: Session = Depends(get_db)):
    job = _worker_job(db, job_id)
    job.progress, job.updated_at = json.dumps(progress), _now()
    db.commit()
    return {"ok": True}


@router.post("/worker/jobs/{job_id}/result", dependencies=[Depends(_worker_auth)])
async def worker_result(job_id: int, counts: UploadFile, progress: str = Form(...), db: Session = Depends(get_db)):
    job = _worker_job(db, job_id)
    data = await counts.read()
    header = next(csv.reader(io.StringIO(data.decode())))
    if len(header) < 2:
        raise HTTPException(400, "counts.csv has no samples")
    d = os.path.join(UPLOADS_DIR, "jobs", str(job.id))
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "counts.csv"), "wb") as f:
        f.write(data)
    job.progress, job.status, job.updated_at = progress, "needs_conditions", _now()
    db.commit()
    return {"ok": True}


@router.post("/worker/jobs/{job_id}/fail", dependencies=[Depends(_worker_auth)])
def worker_fail(job_id: int, error: str = Body(..., embed=True), progress: dict | None = Body(None, embed=True),
                db: Session = Depends(get_db)):
    job = _worker_job(db, job_id)
    job.status, job.error, job.updated_at = "error", error[:2000], _now()
    if progress is not None:
        job.progress = json.dumps(progress)
    db.commit()
    return {"ok": True}
