#!/usr/bin/env python3
"""
Procesador de DPDDS (servicio aparte en Railway). Toma trabajos del backend (backend/app/jobs.py), descarga
las lecturas crudas, las cuenta contra las CDS del genoma de referencia y devuelve la tabla de conteos.

Mismo pipeline validado el 2026-10-08 con Cobetia, Shewanella y S. aureus (bench_railway/): fasterq-dump ->
fastp (solo reporte de calidad) -> Salmon 1.11.4. El conteo por gen es la suma de NumReads de Salmon por
locus tag, que es lo que entrega tximport con countsFromAbundance = "no" (lo que se subió como datasets 3 y 4).

Entradas (una por línea): links directos a FASTQ (.fastq/.fq, opcionalmente .gz o .bz2), archivos .zip o
.tar(.gz), carpetas HTTP/FTP con FASTQ, links compartidos de Google Drive y Dropbox, y accesiones de
NCBI/ENA (SRR…, PRJNA…). Las muestras se detectan por el nombre de archivo (R1/R2 y lanes de Illumina).

Un trabajo a la vez. Las lecturas crudas se borran apenas se cuenta cada muestra; nunca se guardan.
Variables: BACKEND_URL, WORKER_TOKEN, WORK_DIR (/tmp/work), THREADS (mín(8, CPUs)).
"""
import bz2
import csv
import gzip
import io
import ipaddress
import json
import os
import re
import shutil
import socket
import subprocess
import tarfile
import tempfile
import threading
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from concurrent.futures import ThreadPoolExecutor

BACKEND = os.environ["BACKEND_URL"].rstrip("/")
TOKEN = os.environ["WORKER_TOKEN"]
WORK = os.getenv("WORK_DIR", "/tmp/work")
THREADS = int(os.getenv("THREADS") or min(8, os.cpu_count() or 4))
POLL_S = 15
HEARTBEAT_S = 20
MAX_FOLDER_FILES = 1000
MAX_REDIRECTS = 10
# Base de todas las llamadas a curl hacia afuera: sin -L (las redirecciones se siguen a mano, revisando cada
# salto) y solo http/https/ftp
# --globoff: "[1-100]" o "{a,b}" en un link son texto, no rangos de archivos para curl
CURL = ["curl", "-sS", "--globoff", "--proto", "=http,https,ftp", "--connect-timeout", "20", "-A", "DPDDS-procesador"]
HOST_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.?$")
MAX_ARCHIVE_MEMBERS = 10000
# Solo para pruebas locales (servidor de archivos en 127.0.0.1); en Railway queda sin definir
ALLOW_PRIVATE_URLS = os.getenv("ALLOW_PRIVATE_URLS") == "1"
LIMIT_BYTES = 80e9  # límite de descarga del trabajo en curso; lo fija _run con el valor del backend

FQ_RE = re.compile(r"\.(?:fastq|fq)(?:\.gz|\.bz2)?$", re.I)
ARCHIVE_RE = re.compile(r"\.(?:zip|tar|tar\.gz|tgz|tar\.bz2)$", re.I)
# Muestra_S1_L001_R1_001 · muestra_R2 · muestra_1 · muestra.read2  ->  (muestra, 1|2)
PAIR_RE = re.compile(r"^(.+?)(?:_S\d+)?(?:_L\d{3})?[._-](?:R|read)?([12])(?:_\d{3})?$", re.I)
ACC_RE = re.compile(r"^(?:[SED]RR\d+|[SED]RP\d+|[SED]RX\d+|PRJ(?:NA|EB|DB)\d+)$", re.I)


class UserError(Exception):
    """Error que se le muestra tal cual al usuario (link malo, límite superado, etc.)."""


class Cancelled(Exception):
    pass


class SampleFailed(Exception):
    """Una muestra no se pudo contar; el trabajo sigue con las demás."""


def log(msg):
    print(f"[procesador] {time.strftime('%H:%M:%S')} {msg}", flush=True)


def gb(n_bytes):
    return round(n_bytes / 1e9, 2)


# ── Backend ────────────────────────────────────────────────────────────────────

def api(path, payload=None, body=None, content_type="application/json"):
    data = body if body is not None else json.dumps(payload if payload is not None else {}).encode()
    req = urllib.request.Request(f"{BACKEND}{path}", data=data, method="POST",
                                 headers={"X-Worker-Token": TOKEN, "Content-Type": content_type})
    with urllib.request.urlopen(req, timeout=120) as r:
        raw = r.read()
        return json.loads(raw) if r.status != 204 and raw else None


def send_result(job_id, counts_csv: str, progress: dict):
    boundary = uuid.uuid4().hex
    parts = [
        f'--{boundary}\r\nContent-Disposition: form-data; name="progress"\r\n\r\n{json.dumps(progress)}\r\n'.encode(),
        f'--{boundary}\r\nContent-Disposition: form-data; name="counts"; filename="counts.csv"\r\n'
        f'Content-Type: text/csv\r\n\r\n'.encode() + counts_csv.encode() + b"\r\n",
        f"--{boundary}--\r\n".encode(),
    ]
    api(f"/worker/jobs/{job_id}/result", body=b"".join(parts), content_type=f"multipart/form-data; boundary={boundary}")


class Progress:
    """Estado que ve el usuario. Se manda al backend en cada cambio y cada HEARTBEAT_S (el backend da por
    caído al procesador si no sabe de él en 15 min y le pasa el trabajo de nuevo)."""

    def __init__(self, job_id):
        self.job_id, self.lock, self.cancelled = job_id, threading.Lock(), False
        self.d = {"stage": "preparing", "message": "", "samples": [], "downloaded_gb": 0.0, "warnings": []}
        self.watch_path, self.watch_base = None, 0
        self.stop = threading.Event()
        threading.Thread(target=self._beat, daemon=True).start()

    def _beat(self):
        while not self.stop.wait(HEARTBEAT_S):
            self.send()

    def send(self):
        with self.lock:
            if self.watch_path and os.path.exists(self.watch_path):  # avance de la descarga en curso
                self.d["downloaded_gb"] = gb(self.watch_base + os.path.getsize(self.watch_path))
            snapshot = json.loads(json.dumps(self.d))
        try:
            api(f"/worker/jobs/{self.job_id}/progress", snapshot)
        except urllib.error.HTTPError as e:
            if e.code == 409:  # el backend ya no lo considera corriendo
                self.cancelled = True
        except Exception as e:
            log(f"no pude mandar el avance: {e}")

    def set(self, **kw):
        with self.lock:
            self.d.update(kw)
        self.send()

    def warn(self, msg):
        with self.lock:
            self.d["warnings"].append(msg)

    def sample(self, name, **kw):
        with self.lock:
            s = next((x for x in self.d["samples"] if x["name"] == name), None)
            if s is None:
                s = {"name": name}
                self.d["samples"].append(s)
            s.update(kw)
        self.send()

    def check(self):
        if self.cancelled:
            raise Cancelled()

    def close(self):
        self.stop.set()


# ── Utilidades ─────────────────────────────────────────────────────────────────

def sh(cmd, cwd=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if r.returncode != 0:
        msg = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", r.stderr or r.stdout)  # sin colores de la barra de avance
        raise RuntimeError(f"{os.path.basename(cmd[0])} failed: {msg[-800:].strip()}")
    return r.stdout


def fetch(url, timeout=60) -> tuple[bytes, str]:
    """GET con curl (urllib se queda colgado si la conexión se congela): tiempo máximo por intento, reintentos
    y redirecciones seguidas a mano con target() en cada salto. Devuelve (contenido, URL final)."""
    with tempfile.NamedTemporaryFile() as f:
        for _ in range(MAX_REDIRECTS):
            url, args = target(url)
            r = subprocess.run(CURL + ["-f", "--retry", "3", "--retry-delay", "3", "--retry-all-errors",
                                       "--max-time", str(timeout), "-o", f.name, "-w", "%{http_code} %{redirect_url}",
                                       *args, url], capture_output=True, text=True)
            if r.returncode != 0:
                raise RuntimeError(f"could not read {url} (curl exit code {r.returncode})")
            code, _, redirect = r.stdout.strip().partition(" ")
            if code.startswith("3") and redirect:
                url = redirect
                continue
            with open(f.name, "rb") as fh:
                return fh.read(), url
    raise UserError(f"Too many redirects for {url}")


def http_get(url, timeout=60) -> bytes:
    return fetch(url, timeout)[0]


def check_public(url) -> list[str]:
    """Los links los pega cualquiera: no dejar que apunten a la red interna de Railway, a localhost ni a
    direcciones de metadatos de la nube (SSRF). Devuelve las IPs revisadas ([] si ALLOW_PRIVATE_URLS)."""
    if ALLOW_PRIVATE_URLS:
        return []
    host = urllib.parse.urlparse(url).hostname or ""
    bad, addrs = not host or host == "localhost" or host.endswith((".internal", ".local", ".localhost")), []
    if not bad:
        try:
            addrs = sorted({a[4][0].split("%")[0] for a in socket.getaddrinfo(host, None)})
        except socket.gaierror:
            raise UserError(f"Could not resolve the host of {url}")
        bad = not addrs or any(not ipaddress.ip_address(a).is_global for a in addrs)
    if bad:
        raise UserError(f"The link {url} points to a private network address; use a public download link")
    return addrs


def canonical(url) -> tuple[str, list[str]]:
    """Valida el link y lo rearma desde sus partes, para que Python (que revisa el host) y curl (que se conecta)
    vean exactamente la misma URL: sin "\\", espacios ni caracteres de control, sin "#", y el usuario/clave
    (p. ej. FTP de un centro de secuenciación) aparte, con -u. Devuelve (URL rearmada, argumentos de curl)."""
    if re.search(r"[\x00-\x20\x7f\\]", url):
        raise UserError(f"The link {url[:200]!r} has spaces or invalid characters")
    u = urllib.parse.urlsplit(url)
    scheme = u.scheme.lower()
    if scheme not in ("http", "https", "ftp"):
        raise UserError(f"Only http, https and ftp links are supported: {url[:200]}")
    try:
        host, port = u.hostname or "", u.port
        if ":" in host:  # IPv6 literal
            hostpart = f"[{ipaddress.IPv6Address(host).compressed}]"
        else:
            host = host.encode("idna").decode("ascii").lower().rstrip(".")
            if not HOST_RE.match(host):
                raise ValueError(host)
            hostpart = host
    except (ValueError, UnicodeError):
        raise UserError(f"The link {url[:200]} has an invalid host or port")
    canon = urllib.parse.urlunsplit((scheme, hostpart + (f":{port}" if port else ""), u.path or "/", u.query, ""))
    args = ["-u", f"{urllib.parse.unquote(u.username)}:{urllib.parse.unquote(u.password or '')}"] if u.username else []
    return canon, args


def target(url) -> tuple[str, list[str]]:
    """canonical + check_public + --resolve: curl se conecta exactamente a la IP revisada del mismo host que
    revisó Python, así ni otra lectura de la URL ni otra respuesta DNS (rebinding) lo llevan a una IP interna."""
    canon, args = canonical(url)
    ips = check_public(canon)
    if ips:
        u = urllib.parse.urlsplit(canon)
        port = u.port or {"http": 80, "https": 443, "ftp": 21}[u.scheme]
        ip = next((a for a in ips if ":" not in a), ips[0])
        args = args + ["--resolve", f"{u.hostname}:{port}:{'[' + ip + ']' if ':' in ip else ip}"]
    return canon, args


def downloaded_bytes(p: Progress) -> int:
    with p.lock:
        return int(p.d["downloaded_gb"] * 1e9)


def curl(url, out_dir, p: Progress, label) -> str:
    """Descarga con el nombre que da el servidor; devuelve la ruta. Reintenta, sigue redirecciones (a mano,
    revisando cada salto) y corta apenas el trabajo supera su límite de GB, sin esperar a que termine."""
    budget = int(LIMIT_BYTES - downloaded_bytes(p))
    if budget <= 0:
        raise UserError(f"The files exceed the limit of {LIMIT_BYTES / 1e9:g} GB per job")
    os.makedirs(out_dir, exist_ok=True)
    tmp = os.path.join(out_dir, f".part-{uuid.uuid4().hex}")
    with p.lock:
        p.watch_base = int(p.d["downloaded_gb"] * 1e9)
        p.watch_path = None
    p.set(message=f"Downloading {label}")
    for _ in range(MAX_REDIRECTS):
        shutil.rmtree(tmp, ignore_errors=True)
        os.makedirs(tmp)
        url, args = target(url)
        # -J -O dentro de una carpeta vacía: así sabemos qué archivo quedó aunque el nombre venga del servidor.
        # --speed-limit/--speed-time: si pasan 2 min a < 10 KB/s la conexión se dio por muerta y se reintenta.
        proc = subprocess.Popen(CURL + ["-f", "--retry", "5", "--retry-delay", "10", "--retry-all-errors",
                                        "--speed-limit", "10000", "--speed-time", "120", "--max-filesize", str(budget),
                                        "-w", "%{http_code} %{redirect_url}", *args, "-J", "-O", url],
                                cwd=tmp, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        over = False
        while proc.poll() is None:  # avance en vivo y tope de tamaño aunque el servidor no diga cuánto pesa
            files = os.listdir(tmp)
            if files:
                path = os.path.join(tmp, files[0])
                with p.lock:
                    p.watch_path = path
                if os.path.exists(path) and os.path.getsize(path) > budget:
                    proc.kill()
                    over = True
            time.sleep(2)
        out, err = proc.communicate()
        with p.lock:
            p.watch_path = None
        code, _, redirect = out.strip().partition(" ")
        if proc.returncode == 0 and code.startswith("3") and redirect:
            url = redirect  # el próximo target() revisa el destino antes de pedirlo
            continue
        break
    else:
        shutil.rmtree(tmp, ignore_errors=True)
        raise UserError(f"Too many redirects for {url}")
    files = os.listdir(tmp)
    if over or proc.returncode == 63:  # 63 = --max-filesize superado
        shutil.rmtree(tmp, ignore_errors=True)
        raise UserError(f"The files exceed the limit of {LIMIT_BYTES / 1e9:g} GB per job")
    if proc.returncode != 0 or not files:
        shutil.rmtree(tmp, ignore_errors=True)
        raise UserError(f"Could not download {url} ({err.strip()[-200:] or f'curl exit code {proc.returncode}'})")
    # El nombre lo elige el servidor: solo el nombre base, nunca una ruta (p. ej. "..%2F..%2Fapp%2Fworker.py")
    name = os.path.basename(urllib.parse.unquote(files[0]).replace("\\", "/")).lstrip(".") or "download"
    dest = os.path.join(out_dir, name)
    if os.path.exists(dest):
        dest = os.path.join(out_dir, f"{uuid.uuid4().hex[:6]}_{name}")
    os.rename(os.path.join(tmp, files[0]), dest)
    os.rmdir(tmp)
    with p.lock:
        p.d["downloaded_gb"] = gb(p.watch_base + os.path.getsize(dest))
    p.send()
    return dest


def normalize_url(url: str) -> str:
    """Links compartidos -> descarga directa."""
    u = urllib.parse.urlparse(url)
    host = u.netloc.lower()
    if "drive.google.com" in host or "docs.google.com" in host:
        if "/folders/" in u.path:
            raise UserError("Google Drive folders cannot be downloaded automatically: share each file "
                            "separately, or upload a single .zip with everything and share that link")
        m = re.search(r"/d/([\w-]+)", u.path) or re.search(r"[?&]id=([\w-]+)", url)
        if m:
            return f"https://drive.usercontent.google.com/download?id={m.group(1)}&export=download&confirm=t"
    if "dropbox.com" in host:
        q = urllib.parse.parse_qs(u.query)
        q["dl"] = ["1"]
        return urllib.parse.urlunparse(u._replace(query=urllib.parse.urlencode(q, doseq=True)))
    return url


def probe(url) -> tuple[str, str]:
    """(content-type, URL final tras redirecciones) sin descargar; ('', url) si el servidor no responde a HEAD."""
    if url.lower().startswith("ftp://"):
        return ("text/html" if url.endswith("/") else "", url)
    for _ in range(MAX_REDIRECTS):
        url, args = target(url)
        r = subprocess.run(CURL + ["-I", "--max-time", "60", "-o", "/dev/null",
                                   "-w", "%{http_code}\t%{redirect_url}\t%{content_type}", *args, url],
                           capture_output=True, text=True)
        if r.returncode != 0:
            return ("", url)
        code, redirect, ctype = (r.stdout.split("\t") + ["", ""])[:3]
        if code.startswith("3") and redirect:
            url = redirect
            continue
        return (ctype.lower(), url)
    return ("", url)


def list_folder(url: str) -> list[str]:
    """Archivos FASTQ o comprimidos dentro de una carpeta HTTP (índice HTML) o FTP."""
    if url.lower().startswith("ftp://"):
        canon, args = target(url)  # url (con usuario/clave si los trae) sigue siendo la base de los archivos
        names = sh(CURL + ["-f", "--max-time", "120", "--list-only", *args, canon]).split()
    else:
        body, url = fetch(url)
        names = [urllib.parse.unquote(h) for h in re.findall(r'href="([^"?#]+)"', body.decode("utf-8", "replace"), re.I)]
    out = set()
    for n in names:
        full = urllib.parse.urljoin(url if url.endswith("/") else url + "/", n)
        if (FQ_RE.search(n) or ARCHIVE_RE.search(n)) and full.lower().startswith(("http://", "https://", "ftp://")):
            out.add(full)
    if len(out) > MAX_FOLDER_FILES:
        raise UserError(f"The folder {url} has more than {MAX_FOLDER_FILES} files; split it into smaller folders")
    return sorted(out)


def sniff(path) -> str:
    with open(path, "rb") as f:
        head = f.read(512)
    if head.startswith(b"PK\x03\x04"):
        return "zip"
    if head.startswith(b"\x1f\x8b"):
        return "tar" if tarfile.is_tarfile(path) else "fastq.gz"
    if head.startswith(b"BZh"):
        return "tar" if tarfile.is_tarfile(path) else "fastq.bz2"
    if len(head) > 262 and head[257:262] == b"ustar":
        return "tar"
    if head.startswith(b"@"):
        return "fastq"
    if head.lstrip()[:15].lower().startswith((b"<!doctype", b"<html")):
        return "html"
    return "other"


def unpack(path, p: Progress, depth=0) -> list[str]:
    """Deja solo FASTQ: descomprime zip/tar (también anidados) y borra el comprimido."""
    kind = sniff(path)
    if kind == "html":
        os.remove(path)
        raise UserError(f"A link returned a web page instead of a file ({os.path.basename(path)}). "
                        "This usually means the link requires signing in: create a direct download link instead")
    if kind in ("zip", "tar") and depth < 3:
        p.set(message=f"Extracting {os.path.basename(path)}")
        dest = path + ".d"
        if kind == "zip":
            with zipfile.ZipFile(path) as z:
                infos = z.infolist()
                size, n = sum(i.file_size for i in infos), len(infos)
        else:
            with tarfile.open(path) as t:
                members = t.getmembers()
                size, n = sum(m.size for m in members), len(members)
        free = shutil.disk_usage(os.path.dirname(path)).free
        if n > MAX_ARCHIVE_MEMBERS or size > LIMIT_BYTES or size > 0.9 * free:
            os.remove(path)
            raise UserError(f"{os.path.basename(path)} is too large to extract on the server "
                            f"({gb(size)} GB, {n} files): share the FASTQ files separately or in smaller archives")
        try:
            if kind == "zip":
                with zipfile.ZipFile(path) as z:
                    z.extractall(dest)
            else:
                with tarfile.open(path) as t:
                    t.extractall(dest, filter="data")
        except OSError as e:
            if e.errno == 28:  # ENOSPC
                raise UserError(f"{os.path.basename(path)} is too large to extract on the server: "
                                "share the FASTQ files separately or in several smaller archives")
            raise
        os.remove(path)
        out = []
        for root, _, files in os.walk(dest):
            for f in files:
                if not f.startswith(("._", ".")):  # basura de macOS dentro de los zip
                    out += unpack(os.path.join(root, f), p, depth + 1)
        return out
    if kind.startswith("fastq") or (FQ_RE.search(path) and kind != "other"):
        return [path]
    os.remove(path)  # md5, reportes, etc.
    return []


# ── Genoma de referencia ───────────────────────────────────────────────────────

def build_index(accession, p: Progress) -> dict:
    """Descarga las CDS del ensamblaje de NCBI, arma el índice de Salmon y devuelve transcrito -> locus tag."""
    p.set(stage="preparing", message=f"Downloading the reference genome {accession}")
    digits = accession[4:13]
    base = f"https://ftp.ncbi.nlm.nih.gov/genomes/all/{accession[:3]}/{digits[:3]}/{digits[3:6]}/{digits[6:]}/"
    folders = re.findall(rf'href="({re.escape(accession)}_[^"/]+)/"', http_get(base).decode())
    if not folders:
        raise UserError(f"Genome assembly {accession} was not found on NCBI")
    cds = os.path.join(WORK, "ref_cds.fna.gz")
    with open(cds, "wb") as f:
        f.write(http_get(f"{base}{folders[0]}/{folders[0]}_cds_from_genomic.fna.gz", timeout=120))
    tx2gene = {}
    with gzip.open(cds, "rt") as f:
        for line in f:
            if line.startswith(">"):
                tx = line[1:].split()[0]
                m = re.search(r"\[locus_tag=([^\]]+)\]", line) or re.search(r"\[protein_id=([^\]]+)\]", line)
                tx2gene[tx] = m.group(1) if m else tx
    if not tx2gene:
        raise UserError(f"Genome assembly {accession} has no annotated genes (CDS) on NCBI")
    p.set(message=f"Building the Salmon index ({len(set(tx2gene.values()))} genes)")
    sh(["salmon", "index", "-t", cds, "-i", os.path.join(WORK, "idx"), "-p", str(THREADS)])
    return tx2gene


# ── Entradas ───────────────────────────────────────────────────────────────────

def ena_runs(acc) -> list[dict]:
    """Corridas de una accesión (SRR, SRP, PRJNA…) con su nombre de muestra; ENA y, si no, NCBI."""
    fields = "run_accession,sample_title,sample_alias,library_layout,fastq_bytes,fastq_ftp"
    try:
        url = (f"https://www.ebi.ac.uk/ena/portal/api/filereport?accession={acc}&result=read_run"
               f"&fields={fields}&format=json")
        rows = json.loads(http_get(url) or b"[]")
    except Exception:
        rows = []
    if rows:
        return [{"run": r["run_accession"], "title": r.get("sample_title") or r.get("sample_alias") or r["run_accession"],
                 "bytes": sum(int(x) for x in (r.get("fastq_bytes") or "0").split(";") if x),
                 "ena": ["https://" + u for u in (r.get("fastq_ftp") or "").split(";") if u]} for r in rows]
    text = http_get(f"https://trace.ncbi.nlm.nih.gov/Traces/sra-db-be/runinfo?acc={acc}").decode()
    rows = [r for r in csv.DictReader(io.StringIO(text)) if r.get("Run", "").startswith(("SRR", "ERR", "DRR"))]
    if not rows:
        raise UserError(f"No sequencing runs found for {acc} on NCBI or ENA")
    return [{"run": r["Run"], "title": r.get("SampleName") or r["Run"],
             "bytes": int(float(r.get("size_MB") or 0) * 1e6), "ena": []} for r in rows]


def group_samples(files: list[str]) -> list[dict]:
    """Agrupa FASTQ por muestra a partir del nombre: pares R1/R2 y lanes de Illumina."""
    groups = {}
    for path in sorted(files):
        base = FQ_RE.sub("", os.path.basename(path))
        m = PAIR_RE.match(base)
        key, read = (m.group(1), int(m.group(2))) if m else (base, 0)
        groups.setdefault(key, {0: [], 1: [], 2: []})[read].append(path)
    samples = []
    for key, g in groups.items():
        if g[1] and g[2]:
            if len(g[1]) != len(g[2]):
                raise UserError(f"Sample {key} has {len(g[1])} R1 files but {len(g[2])} R2 files")
            samples.append({"name": key, "r1": g[1], "r2": g[2]})
            g[1] = g[2] = []
        single = [r for r in (0, 1, 2) if g[r]]  # sin pareja: single-end
        for read in single:
            samples.append({"name": key if len(single) == 1 else f"{key}_{read}", "r1": g[read], "r2": []})
    return samples


def unique_name(name, used):
    name = re.sub(r"[,\"\n\r;]", "_", name).strip() or "muestra"
    out, i = name, 2
    while out in used:
        out, i = f"{name}_{i}", i + 1
    used.add(out)
    return out


# ── Muestras ───────────────────────────────────────────────────────────────────

def merge(files, dest_stem) -> str:
    """Un archivo por lectura: junta lanes (gzip concatenado es gzip válido) y descomprime .bz2."""
    if any(f.lower().endswith(".bz2") for f in files):
        out = dest_stem + ".fastq"
        with open(out, "wb") as o:
            for f in files:
                with bz2.open(f, "rb") as i:
                    shutil.copyfileobj(i, o, 1 << 20)
                os.remove(f)
        return out
    if len(files) == 1:
        return files[0]
    out = dest_stem + (".fastq.gz" if files[0].lower().endswith(".gz") else ".fastq")
    with open(out, "wb") as o:
        for f in files:
            with open(f, "rb") as i:
                shutil.copyfileobj(i, o, 1 << 20)
            os.remove(f)
    return out


def quantify(s, idx, p: Progress) -> dict:
    """fastp (solo reporte) + Salmon de una muestra; borra sus lecturas al terminar."""
    name, d = s["name"], os.path.join(WORK, "q", s["id"])
    os.makedirs(d, exist_ok=True)
    try:
        r1 = merge(s["r1"], os.path.join(d, "R1"))
        r2 = merge(s["r2"], os.path.join(d, "R2")) if s["r2"] else None
        p.sample(name, state="qc")
        qc = os.path.join(d, "fastp.json")
        try:
            sh(["fastp", "-i", r1] + (["-I", r2] if r2 else []) + ["-w", str(THREADS), "-j", qc, "-h", "/dev/null"])
        except RuntimeError as e:
            raise SampleFailed("Failed quality control: are R1 and R2 from different samples, or is a FASTQ "
                               f"file damaged? ({str(e)[-200:]})")
        p.check()
        p.sample(name, state="counting")
        reads = ["-1", r1, "-2", r2] if r2 else ["-r", r1]
        try:
            sh(["salmon", "quant", "-i", idx, "-l", "A"] + reads +
               ["-p", str(THREADS), "--validateMappings", "-o", os.path.join(d, "quant")])
        except RuntimeError as e:
            if "minAssignedFrags" in str(e):
                raise SampleFailed("Almost no reads match the genes of the reference genome: "
                                   "is it another species, ribosomal RNA, or a contaminated sample?")
            raise
    finally:
        for f in s["r1"] + s["r2"]:
            if os.path.exists(f):
                os.remove(f)
        for f in os.listdir(d):
            if f.startswith(("R1", "R2")):
                os.remove(os.path.join(d, f))
    q = json.load(open(qc))
    before, after = q["summary"]["before_filtering"], q["summary"]["after_filtering"]
    meta = json.load(open(os.path.join(d, "quant", "aux_info", "meta_info.json")))
    stats = {"state": "done", "layout": "paired" if r2 else "single",
             "reads": before["total_reads"] // (2 if r2 else 1), "q30": round(100 * before["q30_rate"], 1),
             "passed": round(100 * after["total_reads"] / max(1, before["total_reads"]), 1),
             "mapped": round(meta.get("percent_mapped", 0), 1)}
    if stats["mapped"] < 10:
        stats["warning"] = "Very few reads assigned to genes: is the reference genome right?"
    p.sample(name, **stats)
    return stats


def sra_fetch(run, ena_urls, out_dir, p: Progress) -> dict:
    """Descarga una corrida de NCBI (espejo en AWS, el más rápido) y la pasa a FASTQ; ENA como respaldo."""
    os.makedirs(out_dir, exist_ok=True)
    try:
        sra = curl(f"https://sra-pub-run-odp.s3.amazonaws.com/sra/{run}/{run}", out_dir, p, run)
        dest = os.path.join(out_dir, f"{run}.sra")
        os.rename(sra, dest)
        sh(["fasterq-dump", "--split-files", "-e", str(THREADS), "-t", os.path.join(out_dir, "tmp"), "-O", out_dir, dest])
        os.remove(dest)
        shutil.rmtree(os.path.join(out_dir, "tmp"), ignore_errors=True)
        fq = sorted(f for f in os.listdir(out_dir) if f.startswith(run) and f.endswith(".fastq"))
    except (UserError, RuntimeError) as e:
        if not ena_urls:
            raise UserError(f"Could not download {run}: {e}")
        log(f"{run}: NCBI falló ({e}); uso ENA")
        fq = [os.path.basename(curl(u, out_dir, p, f"{run} desde ENA")) for u in ena_urls]
    paths = [os.path.join(out_dir, f) for f in fq]
    pair = [f for f in paths if re.search(r"_[12]\.f(ast)?q(\.gz)?$", f)]
    if len(pair) == 2:
        return {"r1": [pair[0]], "r2": [pair[1]]}
    return {"r1": paths[:1], "r2": []}


# ── Trabajo ────────────────────────────────────────────────────────────────────

def run_job(job):
    shutil.rmtree(WORK, ignore_errors=True)
    os.makedirs(WORK)
    p = Progress(job["id"])
    try:
        _run(job, p)
    finally:
        p.close()
        shutil.rmtree(WORK, ignore_errors=True)


def _run(job, p: Progress):
    global LIMIT_BYTES
    max_samples, max_bytes = job["max_samples"], job["max_gb"] * 1e9
    LIMIT_BYTES = max_bytes
    tx2gene = build_index(job["genome_accession"], p)
    idx = os.path.join(WORK, "idx")
    p.check()

    # 1. Qué hay detrás de cada línea
    p.set(stage="checking links", message="Checking the links")
    accs = [l for l in job["links"] if ACC_RE.match(l)]
    urls = [normalize_url(l) for l in job["links"] if not ACC_RE.match(l)]
    runs, seen = [], set()
    for acc in accs:
        for r in ena_runs(acc):
            if r["run"] not in seen:
                seen.add(r["run"])
                runs.append(r)
    expanded = []
    for u in urls:
        target(u)
        if not (FQ_RE.search(urllib.parse.urlparse(u).path) or ARCHIVE_RE.search(urllib.parse.urlparse(u).path)):
            ctype, final = probe(u)  # sin extensión conocida: ¿archivo o página/carpeta?
            if ctype.startswith("text/html"):
                found = list_folder(final if final.endswith("/") else final + "/")
                if not found:
                    raise UserError(f"The link {u} leads to a web page, not to a file or a folder with FASTQ files. "
                                    "If it requires signing in, create a direct download link instead")
                expanded += found
                continue
        expanded.append(u)
    est = sum(r["bytes"] for r in runs)
    if est > max_bytes:
        raise UserError(f"The NCBI runs add up to {gb(est)} GB; the limit per job is {job['max_gb']:g} GB")
    if len(runs) > max_samples:
        raise UserError(f"There are {len(runs)} NCBI runs; the limit per job is {max_samples} samples")

    # 2. Links: se descargan todos primero (en un zip no se sabe qué muestras hay hasta abrirlo)
    p.set(stage="downloading")
    raw = os.path.join(WORK, "raw")
    fastqs, i = [], 0
    while i < len(expanded):
        p.check()
        u = expanded[i]
        i += 1
        path = curl(u, raw, p, f"file {i} of {len(expanded)}")
        if p.d["downloaded_gb"] * 1e9 > max_bytes:
            raise UserError(f"The files exceed the limit of {job['max_gb']:g} GB per job")
        if sniff(path) == "html" and len(expanded) < MAX_FOLDER_FILES:
            # una carpeta pegada sin "/" final devuelve su índice: se trata como carpeta
            try:
                found = [f for f in list_folder(u if u.endswith("/") else u + "/") if f not in expanded]
            except Exception:
                found = []
            if found:
                os.remove(path)
                expanded += found
                continue
        fastqs += unpack(path, p)
    if expanded and not fastqs:
        raise UserError("The links contained no FASTQ files (.fastq, .fq, .fastq.gz or .fq.gz)")

    used, samples = set(), []
    for s in group_samples(fastqs):
        s["name"] = unique_name(s["name"], used)
        samples.append(dict(s, kind="file", source="file"))
    for r in runs:
        samples.append({"name": unique_name(r["title"], used), "kind": "sra", "run": r["run"], "ena": r["ena"],
                        "source": r["run"], "r1": [], "r2": []})
    if not samples:
        raise UserError("No samples found in the links")
    if len(samples) > max_samples:
        raise UserError(f"Found {len(samples)} samples; the limit per job is {max_samples}")
    for i, s in enumerate(samples):
        s["id"] = f"s{i}"
        files = [os.path.basename(f) for f in s["r1"] + s["r2"]] if s["kind"] == "file" else [s["run"]]
        p.sample(s["name"], source=s["source"], files=files, state="queued")
    log(f"trabajo {job['id']}: {len(samples)} muestras")

    # 3. Contar: los archivos ya están; las corridas de NCBI se bajan de a una, adelantando la siguiente
    p.set(stage="counting", message="Counting reads per gene")
    sra = [s for s in samples if s["kind"] == "sra"]
    with ThreadPoolExecutor(1) as pool:
        nxt = pool.submit(sra_fetch, sra[0]["run"], sra[0]["ena"], os.path.join(WORK, "sra", sra[0]["id"]), p) if sra else None
        for s in samples:
            p.check()
            try:
                if s["kind"] == "sra":
                    p.sample(s["name"], state="downloading")
                    try:
                        s.update(nxt.result())
                    except (UserError, RuntimeError) as e:
                        raise SampleFailed(f"Download failed: {str(e)[-300:]}")
                    finally:
                        k = sra.index(s)
                        if k + 1 < len(sra):
                            n = sra[k + 1]
                            nxt = pool.submit(sra_fetch, n["run"], n["ena"], os.path.join(WORK, "sra", n["id"]), p)
                quantify(s, idx, p)
            except SampleFailed as e:
                s["failed"] = True
                p.sample(s["name"], state="error", error=str(e))
                log(f"{s['name']}: {e}")
            if s["kind"] == "sra":
                shutil.rmtree(os.path.join(WORK, "sra", s["id"]), ignore_errors=True)

    # 4. Tabla de conteos: suma de NumReads por locus tag (solo las muestras que se pudieron contar)
    samples = [s for s in samples if not s.get("failed")]
    if not samples:
        raise UserError("No sample could be counted; see the details of each sample")
    genes = list(dict.fromkeys(tx2gene.values()))
    counts = {g: [0.0] * len(samples) for g in genes}
    for j, s in enumerate(samples):
        with open(os.path.join(WORK, "q", s["id"], "quant", "quant.sf")) as f:
            for row in csv.DictReader(f, delimiter="\t"):
                counts[tx2gene.get(row["Name"], row["Name"])][j] += float(row["NumReads"])
    out = io.StringIO()
    w = csv.writer(out, lineterminator="\n")
    w.writerow(["locustag"] + [s["name"] for s in samples])
    for g in genes:
        w.writerow([g] + [int(round(c)) for c in counts[g]])
    p.set(stage="ready", message="Done: assign a condition to each sample")
    with p.lock:
        final = json.loads(json.dumps(p.d))
    send_result(job["id"], out.getvalue(), final)
    log(f"trabajo {job['id']} listo")


def main():
    log(f"listo; backend {BACKEND}, {THREADS} hilos, trabajo en {WORK}")
    fresh = True  # recién arrancado: el trabajo que quedara a medias se retoma ya, sin esperar 15 min
    while True:
        try:
            job = api("/worker/claim", {"fresh": fresh})
            fresh = False
        except Exception as e:
            log(f"no pude consultar la cola: {e}")
            job = None
        if not job:
            time.sleep(POLL_S)
            continue
        log(f"trabajo {job['id']} ({job['name']}): {len(job['links'])} líneas")
        try:
            run_job(job)
        except Cancelled:
            log(f"trabajo {job['id']} cancelado por el backend")
        except UserError as e:
            log(f"trabajo {job['id']}: {e}")
            _fail(job, str(e))
        except Exception as e:
            traceback.print_exc()
            _fail(job, f"Internal processing error ({type(e).__name__}: {str(e)[-500:]})")


def _fail(job, msg):
    try:
        api(f"/worker/jobs/{job['id']}/fail", {"error": msg})
    except Exception as e:
        log(f"no pude reportar el error: {e}")


if __name__ == "__main__":
    main()
