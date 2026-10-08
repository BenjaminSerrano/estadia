"""
Anotación de los genes de un dataset subido a partir del ensamblaje de NCBI (GCF_/GCA_).

1. NCBI feature table -> producto (Name), proteína (WP_), contig, coordenadas, largo y hebra.
2. KO: si KEGG tiene el mismo ensamblaje (p. ej. S. aureus USA300_FPR3757 = saa), sus KO directo
   por locus tag. Para el resto: proteína RefSeq -> UniProtKB (ID mapping) -> genes KEGG -> KO más
   frecuente; las WP_ son compartidas por proteínas idénticas entre cepas, así que cubre parte de
   los genomas que KEGG no tiene (p. ej. Shewanella WS13), con menos cobertura.
3. KO -> categorías KEGG (Pathway) y familias BRITE, con el mismo criterio que db/kegg_enrich.py
   (script histórico con el que se anotó Cobetia), leído desde las jerarquías BRITE de KEGG.

Solo stdlib: corre dentro del contenedor del backend sin dependencias nuevas.
"""
import csv
import gzip
import io
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter

ACCESSION_RE = re.compile(r"^GC[AF]_\d{9}\.\d+$")
KEGG_DELAY = 0.35  # KEGG pide no pasar de ~3 req/s

# Bloques BR: fuera de ko00001 que se muestran como familia (igual que db/kegg_enrich.py)
BR_CATEGORY = {
    "ko01000": "Metabolism", "ko01001": "Signaling and Cellular Processes", "ko01009": "Metabolism",
    "ko01002": "Metabolism", "ko02000": "Environmental Information Processing",
    "ko02048": "Environmental Information Processing", "ko02044": "Cellular Processes",
    "ko03000": "Genetic Information Processing", "ko03036": "Genetic Information Processing",
    "ko03400": "Genetic Information Processing", "ko03029": "Genetic Information Processing",
    "ko04812": "Cellular Processes", "ko04147": "Signaling and Cellular Processes",
    "ko04131": "Genetic Information Processing",
}


def _get(url: str, data: bytes | None = None, timeout: int = 120) -> bytes:
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=timeout) as r:
                return r.read()
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))


# ── 1. NCBI ────────────────────────────────────────────────────────────────────

def ncbi_features(accession: str) -> tuple[dict, dict, str]:
    """(locus_tag/old_locus_tag -> campos de la tabla genes, locus_tag -> old_locus_tags, organismo)."""
    if not ACCESSION_RE.match(accession):
        raise ValueError(f"invalid NCBI assembly accession '{accession}' (expected e.g. GCF_000013465.1)")
    digits = accession[4:13]
    base = f"https://ftp.ncbi.nlm.nih.gov/genomes/all/{accession[:3]}/{digits[:3]}/{digits[3:6]}/{digits[6:]}/"
    folders = re.findall(rf'href="({re.escape(accession)}_[^"/]+)/"', _get(base).decode())
    if not folders:
        raise ValueError(f"assembly {accession} not found on NCBI")
    folder = folders[0]
    report = _get(f"{base}{folder}/{folder}_assembly_report.txt").decode()
    m = re.search(r"^# Organism name:\s*(.+?)(?: \(|$)", report, re.M)
    organism = m.group(1).strip() if m else ""
    text = gzip.decompress(_get(f"{base}{folder}/{folder}_feature_table.txt.gz")).decode()

    features, old_tags = {}, {}
    for row in csv.reader(io.StringIO(text), delimiter="\t"):
        if not row or row[0].startswith("#"):
            continue
        feature, _, _, _, _, _, contig, start, end, strand, protein, _, _, name, symbol, _, locus, _, plen, attrs = row[:20]
        if feature == "gene":
            m = re.search(r"old_locus_tag=([^;]+)", attrs)
            if m:
                old_tags[locus] = m.group(1).split(",")
        elif feature == "CDS" and locus and locus not in features:
            features[locus] = {
                "Name": name or symbol or None,
                "Protein_accession": protein or None,
                "Accession": contig,
                "Begin": int(start), "End": int(end),
                "Protein_length": int(plen) if plen else None,
                "Orientation": "plus" if strand == "+" else "minus",
            }
    # Los conteos pueden venir con los locus tags antiguos (p. ej. SAUSA300_0001): mismo registro
    for locus, olds in old_tags.items():
        for old in olds:
            if locus in features:
                features.setdefault(old, features[locus])
    return features, old_tags, organism


# ── 2. KO ──────────────────────────────────────────────────────────────────────

def kegg_org(accession: str, organism: str) -> str | None:
    """Código KEGG (p. ej. 'saa') del mismo ensamblaje (GCA_/GCF_ con igual número), o None."""
    species = " ".join(organism.split()[:2])
    if not species:
        return None
    genomes = [line.split("\t")[0] for line in _get("https://rest.kegg.jp/list/genome").decode().splitlines()
               if species.lower() in line.lower()]
    digits = accession[4:13]
    for i in range(0, len(genomes), 10):
        text = _get("https://rest.kegg.jp/get/" + "+".join(f"gn:{t}" for t in genomes[i:i + 10])).decode()
        for entry in text.split("\n///"):
            if re.search(rf"Assembly: GC[AF]_{digits}\.", entry):
                m = re.search(r"^ORG_CODE\s+(\S+)", entry, re.M)
                if m:
                    return m.group(1)
        time.sleep(KEGG_DELAY)
    return None


def kegg_org_ko(org: str) -> dict[str, str]:
    """locus tag (sin prefijo de organismo) -> KO, para todo el genoma KEGG."""
    out = {}
    for line in _get(f"https://rest.kegg.jp/link/ko/{org}").decode().splitlines():
        if "\t" in line:
            g, ko = line.split("\t")
            out.setdefault(g.split(":", 1)[1], ko.removeprefix("ko:"))
    return out


def _uniprot_kegg_genes(proteins: list[str]) -> dict[str, list[str]]:
    """WP_ -> genes KEGG (hasta 3 por proteína) de las entradas UniProtKB que la referencian."""
    job = json.loads(_get("https://rest.uniprot.org/idmapping/run", urllib.parse.urlencode(
        {"from": "RefSeq_Protein", "to": "UniProtKB", "ids": ",".join(proteins)}).encode()))["jobId"]
    for _ in range(120):
        status = json.loads(_get(f"https://rest.uniprot.org/idmapping/status/{job}"))
        if status.get("jobStatus") not in ("NEW", "RUNNING"):
            break
        time.sleep(3)
    if status.get("jobStatus") == "ERROR":
        raise RuntimeError(f"UniProt ID mapping failed: {status}")
    tsv = _get(f"https://rest.uniprot.org/idmapping/uniprotkb/results/stream/{job}?fields=accession,xref_kegg&format=tsv",
               timeout=600).decode()
    out: dict[str, list[str]] = {}
    for row in list(csv.reader(io.StringIO(tsv), delimiter="\t"))[1:]:
        if len(row) < 3:
            continue
        genes = out.setdefault(row[0], [])
        for g in row[2].split(";"):
            if g.strip() and g.strip() not in genes and len(genes) < 3:
                genes.append(g.strip())
    return out


def _kegg_gene_ko(genes: set[str]) -> dict[str, str]:
    out = {}
    genes = sorted(genes)
    for i in range(0, len(genes), 100):
        for line in _get("https://rest.kegg.jp/link/ko/" + "+".join(genes[i:i + 100])).decode().splitlines():
            if "\t" in line:  # KEGG puede devolver líneas vacías
                g, ko = line.split("\t")
                out[g] = ko.removeprefix("ko:")
        time.sleep(KEGG_DELAY)
    return out


def protein_ko(proteins: list[str]) -> dict[str, str]:
    """WP_ -> KO más frecuente entre los genes KEGG asociados."""
    p2g = _uniprot_kegg_genes(proteins)
    g2ko = _kegg_gene_ko({g for gs in p2g.values() for g in gs})
    out = {}
    for prot, genes in p2g.items():
        kos = Counter(g2ko[g] for g in genes if g in g2ko)
        if kos:
            out[prot] = kos.most_common(1)[0][0]
    return out


# ── 3. KO -> Pathway / BRITE ───────────────────────────────────────────────────

def _smart_title(text: str) -> str:
    lower = {"and", "of", "the", "in", "a", "an", "for", "to", "by"}
    return " ".join(w.capitalize() if i == 0 or w.lower() not in lower else w.lower()
                    for i, w in enumerate(text.split()))


_BRITE: dict[str, str] = {}  # código -> jerarquía KEGG; caché por proceso (cambian poco)


def _brite(code: str) -> str:
    if code not in _BRITE:
        _BRITE[code] = _get(f"https://rest.kegg.jp/get/br:{code}", timeout=300).decode()
        time.sleep(KEGG_DELAY)
    return _BRITE[code]


def ko_details(kos: set[str]) -> dict[str, tuple]:
    """KO -> (categorías top-level de ko00001 separadas por coma, hasta 3 pares BRITE (familia, específica)).

    Mismo resultado que leer la sección BRITE de cada entrada KO (db/kegg_enrich.py), pero desde las
    jerarquías completas: cada entrada KO trae todos los genes de todos los organismos (~300 KB c/u)."""
    cats = {k: [] for k in kos}
    pairs = {k: [] for k in kos}
    br_names = {}  # 'ko01000' -> 'Enzymes'
    a_code = a_name = family = c_name = None
    for line in _brite("ko00001").splitlines():
        level, rest = line[:1], line[1:].strip()
        if level == "A":
            a_code, a_name = rest[:5], rest[5:].strip()
        elif level == "B":
            name = rest[5:].strip()
            family = (_smart_title(name.split(":", 1)[1].strip())
                      if a_code == "09180" and name.lower().startswith("protein families:") else None)
        elif level == "C":
            m = re.match(r"\d{5}\s+(.*?)(?:\s+\[(BR|PATH):(ko\d{5})\])?$", rest)
            c_name = m.group(1) if m else rest
            if m and m.group(2) == "BR":
                br_names[m.group(3)] = c_name
        elif level == "D" and rest.split()[0] in kos:
            ko = rest.split()[0]
            if a_code != "09180":
                if a_name not in cats[ko]:
                    cats[ko].append(a_name)
            elif family and (family, c_name) not in pairs[ko]:
                pairs[ko].append((family, c_name))
    for code in sorted(BR_CATEGORY):
        for ko in set(re.findall(r"\bK\d{5}\b", _brite(code))) & kos:
            pair = (BR_CATEGORY[code], br_names.get(code, code))
            if pair not in pairs[ko]:
                pairs[ko].append(pair)

    out = {}
    for ko in kos:
        seen, unique = set(), []
        for fam, spec in pairs[ko]:
            if spec not in seen:
                seen.add(spec)
                unique.append((fam, spec))
        out[ko] = ((", ".join(cats[ko]) or None), unique[:3])
    return out


# ── Orquestación ───────────────────────────────────────────────────────────────

def annotate(locustags: list[str], accession: str, log=print) -> dict[str, dict]:
    """locustag -> dict con las columnas de la tabla genes que se pudieron llenar."""
    t0 = time.time()
    feats, old_tags, organism = ncbi_features(accession)
    rows = {lt: dict(feats[lt]) for lt in locustags if lt in feats}
    log(f"NCBI ({organism}): {len(rows)}/{len(locustags)} genes del dataset encontrados en {accession}")

    org = kegg_org(accession, organism)
    by_locus = kegg_org_ko(org) if org else {}
    for lt, r in rows.items():
        r["KO_code"] = next((by_locus[t] for t in [lt, *old_tags.get(lt, [])] if t in by_locus), None)
    log(f"KO desde KEGG ({org or 'ensamblaje no está en KEGG'}): {sum(1 for r in rows.values() if r['KO_code'])} genes")

    missing = sorted({r["Protein_accession"] for r in rows.values() if not r["KO_code"] and r["Protein_accession"]})
    p2ko = protein_ko(missing) if missing else {}
    for r in rows.values():
        r["KO_code"] = r["KO_code"] or p2ko.get(r["Protein_accession"])
    log(f"KO total (con UniProt): {sum(1 for r in rows.values() if r['KO_code'])}/{len(rows)} genes")

    details = ko_details({r["KO_code"] for r in rows.values() if r["KO_code"]})
    for r in rows.values():
        pathway, brites = details.get(r["KO_code"], (None, []))
        b = brites + [(None, None)] * (3 - len(brites))
        r.update({"Pathway": pathway,
                  "Brite_protein_families_1": b[0][0], "Brite_specific_family_1": b[0][1],
                  "Brite_protein_families_2": b[1][0], "Brite_specific_family_2": b[1][1],
                  "Brite_protein_families_3": b[2][0], "Brite_specific_family_3": b[2][1]})
    log(f"KEGG: {sum(1 for r in rows.values() if r['Pathway'])}/{len(rows)} genes con categoría ({time.time() - t0:.0f} s)")
    return rows
