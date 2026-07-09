from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import Dataset, Condition

router = APIRouter()

MAX_LIMIT = 1000


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
    return [{"id": r.id, "name": r.name, "organism": r.organism} for r in rows]


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
