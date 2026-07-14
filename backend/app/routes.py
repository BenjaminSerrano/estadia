import csv
import io
import os
import subprocess
import json
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, SessionLocal, UPLOADS_DIR
from app.models import Dataset, Condition, Gene, ExpressionResult

# estadia-back/run_deseq2.R — three levels up from backend/app/routes.py
R_SCRIPT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "run_deseq2.R",
)

router = APIRouter()

MAX_LIMIT = 1000
MIN_REPLICATES = 2
DESEQ2_TIMEOUT_SEC = 600


def _parse_ids(s: str) -> list:
    if not s:
        return []
    try:
        return [int(x.strip()) for x in s.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(400, "condition IDs must be integers")


def _filter_clause(include_ids: list, exclude_ids: list, params: dict) -> str:
    """
    Builds the SQL WHERE fragment that restricts genes to those with expression
    in ALL include_ids and in NONE of exclude_ids. Populates params in place.
    ponytail: named params prevent injection; string-interpolated placeholders are safe
              because they're derived from the param dict keys, not user strings.
    """
    n = len(include_ids)
    if n == 0:
        raise HTTPException(400, "include_conditions is required")

    inc_ph = ",".join(f":inc{i}" for i in range(n))
    for i, cid in enumerate(include_ids):
        params[f"inc{i}"] = cid
    params["n"] = n

    excl = ""
    if exclude_ids:
        exc_ph = ",".join(f":exc{i}" for i in range(len(exclude_ids)))
        for i, cid in enumerate(exclude_ids):
            params[f"exc{i}"] = cid
        excl = f"AND g.id NOT IN (SELECT gene_id FROM expression_results WHERE condition_id IN ({exc_ph}))"

    return (
        f"AND g.id IN ("
        f"  SELECT gene_id FROM expression_results"
        f"  WHERE condition_id IN ({inc_ph})"
        f"  GROUP BY gene_id HAVING COUNT(DISTINCT condition_id) = :n"
        f") {excl}"
    )


# ── Dataset / Condition listing ────────────────────────────────────────────────

@router.get("/datasets")
def list_datasets(db: Session = Depends(get_db)):
    rows = db.query(Dataset).all()
    return [{"id": r.id, "name": r.name, "organism": r.organism, "status": r.status} for r in rows]


@router.get("/datasets/{dataset_id}/conditions")
def list_conditions(dataset_id: int, db: Session = Depends(get_db)):
    rows = db.query(Condition).filter(Condition.dataset_id == dataset_id).order_by(Condition.id).all()
    if not rows:
        raise HTTPException(404, f"Dataset {dataset_id} not found")
    return [{"id": r.id, "label": r.label, "is_baseline": bool(r.is_baseline)} for r in rows]


# ── Gene queries ───────────────────────────────────────────────────────────────

@router.get("/datasets/{dataset_id}/genes")
def get_genes(
    dataset_id: int,
    include_conditions: str = Query(..., description="Comma-separated condition IDs (gene must appear in ALL)"),
    exclude_conditions: str = Query("", description="Comma-separated condition IDs (gene must appear in NONE)"),
    pathway: str = Query(""),
    skip: int = 0,
    limit: int = MAX_LIMIT,
    db: Session = Depends(get_db),
):
    if limit < 1 or limit > MAX_LIMIT:
        raise HTTPException(400, f"limit must be 1–{MAX_LIMIT}")

    include_ids = _parse_ids(include_conditions)
    exclude_ids = _parse_ids(exclude_conditions)

    params: dict = {"dataset_id": dataset_id, "skip": skip, "limit": limit}
    filt = _filter_clause(include_ids, exclude_ids, params)

    pathway_clause = ""
    if pathway:
        pathway_clause = "AND (g.Pathway LIKE :pathway)"
        params["pathway"] = f"%{pathway}%"

    genes = db.execute(text(f"""
        SELECT g.id, g.locustag, g.KO_code, g.Protein_accession, g.Name,
               g.Accession, g.Begin, g.End, g.Protein_length, g.Orientation, g.Pathway,
               g.Brite_specific_family_1, g.Brite_specific_family_2, g.Brite_specific_family_3,
               g.Brite_protein_families_1, g.Brite_protein_families_2, g.Brite_protein_families_3
        FROM genes g
        WHERE g.dataset_id = :dataset_id {filt} {pathway_clause}
        LIMIT :limit OFFSET :skip
    """), params).mappings().all()

    # Count total without pagination
    count_params = {k: v for k, v in params.items() if k not in ("skip", "limit")}
    total = db.execute(text(f"""
        SELECT COUNT(DISTINCT g.id) FROM genes g
        WHERE g.dataset_id = :dataset_id {filt} {pathway_clause}
    """), count_params).scalar()

    # Fetch expression data for the returned genes (one extra query, avoids N+1)
    gene_ids = [g["id"] for g in genes]
    expr_map: dict = {}
    if gene_ids:
        ph = ",".join(str(x) for x in gene_ids)  # safe: integers from DB
        for e in db.execute(text(
            f"SELECT er.gene_id, c.label, er.log2FoldChange, er.pvalue, er.padj "
            f"FROM expression_results er JOIN conditions c ON c.id = er.condition_id "
            f"WHERE er.gene_id IN ({ph})"
        )).mappings():
            expr_map.setdefault(e["gene_id"], {})[e["label"]] = {
                "log2FoldChange": e["log2FoldChange"],
                "pvalue": e["pvalue"],
                "padj": e["padj"],
            }

    result = [dict(g) | {"expression": expr_map.get(g["id"], {})} for g in genes]
    return {"genes": result, "total": total}


@router.get("/datasets/{dataset_id}/pathways")
def get_pathways(
    dataset_id: int,
    include_conditions: str = Query(...),
    exclude_conditions: str = Query(""),
    db: Session = Depends(get_db),
):
    include_ids = _parse_ids(include_conditions)
    exclude_ids = _parse_ids(exclude_conditions)

    params: dict = {"dataset_id": dataset_id}
    filt = _filter_clause(include_ids, exclude_ids, params)

    rows = db.execute(text(f"""
        SELECT g.Pathway FROM genes g
        WHERE g.dataset_id = :dataset_id AND g.Pathway IS NOT NULL AND g.Pathway != ''
        {filt}
    """), params).scalars().all()

    # Pathways are comma-separated within each row
    pathways: set = set()
    for raw in rows:
        for p in raw.split(","):
            p = p.strip()
            if p:
                pathways.add(p)

    return {"pathways": sorted(pathways)}


@router.get("/datasets/{dataset_id}/stats")
def get_stats(
    dataset_id: int,
    include_conditions: str = Query(...),
    exclude_conditions: str = Query(""),
    db: Session = Depends(get_db),
):
    include_ids = _parse_ids(include_conditions)
    exclude_ids = _parse_ids(exclude_conditions)

    params: dict = {"dataset_id": dataset_id}
    filt = _filter_clause(include_ids, exclude_ids, params)

    total = db.execute(text(f"""
        SELECT COUNT(DISTINCT g.id) FROM genes g
        WHERE g.dataset_id = :dataset_id {filt}
    """), params).scalar()

    pathway_data = get_pathways(dataset_id, include_conditions, exclude_conditions, db)

    return {
        "total_genes": total,
        "unique_pathways": len(pathway_data["pathways"]),
        "pathways_list": pathway_data["pathways"],
    }


# ── Upload de datos crudos + pipeline DESeq2 (Milestone 2) ─────────────────────

def _validate_upload(counts_bytes: bytes, metadata_bytes: bytes, baseline: str) -> dict:
    """
    Valida counts.csv (filas=genes, columnas=muestras) contra metadata.csv
    (filas=muestras, con columna 'condition'). Lanza HTTPException(400) con el
    primer problema encontrado. Sin pandas: csv stdlib alcanza para esto.
    """
    try:
        counts_rows = list(csv.reader(io.StringIO(counts_bytes.decode("utf-8"))))
    except UnicodeDecodeError:
        raise HTTPException(400, "counts.csv must be UTF-8 encoded")
    if len(counts_rows) < 2:
        raise HTTPException(400, "counts.csv has no data rows")

    header, data_rows = counts_rows[0], counts_rows[1:]
    sample_names = header[1:]
    if not sample_names:
        raise HTTPException(400, "counts.csv must have at least one sample column")

    gene_ids = []
    for row in data_rows:
        if not row:
            continue
        if len(row) != len(header):
            raise HTTPException(400, f"counts.csv row for gene '{row[0]}' has the wrong number of columns")
        gene_ids.append(row[0])
        for sample, value in zip(sample_names, row[1:]):
            try:
                n = int(value)
            except ValueError:
                raise HTTPException(400, f"counts.csv: non-integer count '{value}' (gene {row[0]}, sample {sample})")
            if n < 0:
                raise HTTPException(400, f"counts.csv: negative count for gene {row[0]}, sample {sample}")

    try:
        meta_reader = csv.DictReader(io.StringIO(metadata_bytes.decode("utf-8")))
    except UnicodeDecodeError:
        raise HTTPException(400, "metadata.csv must be UTF-8 encoded")
    fieldnames = meta_reader.fieldnames or []
    if "condition" not in fieldnames:
        raise HTTPException(400, "metadata.csv must have a 'condition' column")
    sample_id_col = fieldnames[0]

    sample_condition = {}
    for row in meta_reader:
        sample_condition[row[sample_id_col]] = row["condition"]

    if set(sample_names) != set(sample_condition.keys()):
        raise HTTPException(
            400,
            "counts.csv sample columns must exactly match metadata.csv sample rows "
            f"(counts: {sorted(sample_names)}, metadata: {sorted(sample_condition.keys())})",
        )

    conditions = list(dict.fromkeys(sample_condition.values()))
    if baseline not in conditions:
        raise HTTPException(400, f"baseline '{baseline}' not found among conditions {conditions}")
    if len(conditions) < 2:
        raise HTTPException(400, "at least one non-baseline condition is required")

    for cond in conditions:
        n = sum(1 for c in sample_condition.values() if c == cond)
        if n < MIN_REPLICATES:
            # ponytail: umbral mínimo; DESeq2 sin réplicas no produce estadística confiable
            raise HTTPException(400, f"condition '{cond}' has {n} sample(s), needs at least {MIN_REPLICATES}")

    return {
        "gene_ids": gene_ids,
        "sample_names": sample_names,
        "conditions": conditions,
    }


def run_analysis(dataset_id: int):
    """Background task: corre DESeq2 (subprocess Rscript) por cada condición
    no-baseline y persiste expression_results. Abre su propia sesión porque
    corre después de que la sesión de la request ya fue cerrada."""
    db = SessionLocal()
    try:
        dataset = db.get(Dataset, dataset_id)
        if dataset is None:
            return
        dataset.status = "running"
        db.commit()

        conditions = db.query(Condition).filter(Condition.dataset_id == dataset_id).all()
        baseline_cond = next((c for c in conditions if c.is_baseline), None)
        targets = [c for c in conditions if not c.is_baseline]
        if baseline_cond is None or not targets:
            raise RuntimeError("dataset has no baseline/target conditions")

        gene_map = {
            g.locustag: g.id
            for g in db.query(Gene).filter(Gene.dataset_id == dataset_id).all()
        }
        upload_dir = os.path.join(UPLOADS_DIR, str(dataset_id))
        counts_path = os.path.join(upload_dir, "counts.csv")
        metadata_path = os.path.join(upload_dir, "metadata.csv")

        for target in targets:
            result = subprocess.run(
                ["Rscript", R_SCRIPT_PATH, counts_path, metadata_path, baseline_cond.label, target.label],
                capture_output=True, text=True, timeout=DESEQ2_TIMEOUT_SEC,
            )
            if result.returncode != 0:
                raise RuntimeError(f"DESeq2 failed for {target.label}: {result.stderr[-2000:]}")
            try:
                rows = json.loads(result.stdout)
            except json.JSONDecodeError:
                raise RuntimeError(f"DESeq2 produced invalid JSON for {target.label}")

            for row in rows:
                gene_id = gene_map.get(row.get("locustag"))
                if gene_id is None:
                    continue  # ponytail: gen desconocido, se ignora en vez de fallar todo el batch
                db.add(ExpressionResult(
                    gene_id=gene_id,
                    condition_id=target.id,
                    log2FoldChange=row.get("log2FoldChange"),
                    pvalue=row.get("pvalue"),
                    padj=row.get("padj"),
                ))
            db.commit()

        dataset.status = "done"
        db.commit()
    except Exception as e:
        db.rollback()
        dataset = db.get(Dataset, dataset_id)
        if dataset is not None:
            dataset.status = "error"
            dataset.error = str(e)[:2000]
            db.commit()
    finally:
        db.close()


@router.post("/datasets")
async def upload_dataset(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    organism: str = Form(""),
    baseline: str = Form(...),
    counts: UploadFile = None,
    metadata: UploadFile = None,
    db: Session = Depends(get_db),
):
    if counts is None or metadata is None:
        raise HTTPException(400, "both 'counts' and 'metadata' files are required")

    counts_bytes = await counts.read()
    metadata_bytes = await metadata.read()
    parsed = _validate_upload(counts_bytes, metadata_bytes, baseline)

    dataset = Dataset(name=name, organism=organism, status="pending")
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    for label in parsed["conditions"]:
        db.add(Condition(dataset_id=dataset.id, label=label, is_baseline=(label == baseline)))
    db.commit()

    # Solo locustag: la anotación KEGG (Pathway/Brite/etc.) es un paso separado
    # (ver db/kegg_enrich.py), no parte del upload de counts crudos.
    db.bulk_save_objects([
        Gene(dataset_id=dataset.id, locustag=gene_id) for gene_id in parsed["gene_ids"]
    ])
    db.commit()

    upload_dir = os.path.join(UPLOADS_DIR, str(dataset.id))
    os.makedirs(upload_dir, exist_ok=True)
    with open(os.path.join(upload_dir, "counts.csv"), "wb") as f:
        f.write(counts_bytes)
    with open(os.path.join(upload_dir, "metadata.csv"), "wb") as f:
        f.write(metadata_bytes)

    background_tasks.add_task(run_analysis, dataset.id)
    return {"dataset_id": dataset.id, "status": dataset.status}


@router.get("/datasets/{dataset_id}/status")
def get_dataset_status(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(404, f"Dataset {dataset_id} not found")
    return {"status": dataset.status, "error": dataset.error}
