from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import alone_16, alone_38, alone_41, Comparison_16_38, Comparison_16_41, Comparison_38_41, Comparison_16_38_41
from app.schemas import TableStatsResponse, PathwaysResponse, GeneFilterResponse
from sqlalchemy import func

router = APIRouter()


def _get_model(table_name: str):
    models = {
        "16": alone_16,
        "38": alone_38,
        "41": alone_41,
        "16_38": Comparison_16_38,
        "16_41": Comparison_16_41,
        "38_41": Comparison_38_41,
        "16_38_41": Comparison_16_38_41,
    }
    model = models.get(table_name)
    if model is None:
        raise HTTPException(status_code=404, detail=f"Table {table_name} not found")
    return model


def _gene_to_dict(gene, table_name: str) -> dict:
    gene_dict = {}

    for column in gene.__table__.columns:
        column_name = column.name
        if column_name == "BEGIN":
            attr_name = "Begin"
        elif column_name == "END":
            attr_name = "End"
        else:
            attr_name = column_name

        value = getattr(gene, attr_name, None)

        try:
            python_type = column.type.python_type
        except (AttributeError, NotImplementedError):
            python_type = str

        if value is None:
            if python_type == int:
                gene_dict[column_name] = 0
            elif python_type == float:
                gene_dict[column_name] = 0.0
            else:
                gene_dict[column_name] = ""
        else:
            if python_type == int:
                try:
                    gene_dict[column_name] = int(value) if value != "" else 0
                except (ValueError, TypeError):
                    gene_dict[column_name] = 0
            elif python_type == float:
                try:
                    gene_dict[column_name] = float(value) if value != "" else 0.0
                except (ValueError, TypeError):
                    gene_dict[column_name] = 0.0
            else:
                gene_dict[column_name] = str(value)

    # Alias de compatibilidad con el frontend
    if 'id' not in gene_dict and 'ID' in gene_dict:
        gene_dict['id'] = gene_dict['ID']
    elif 'ID' not in gene_dict and 'id' in gene_dict:
        gene_dict['ID'] = gene_dict['id']

    if table_name not in ["16", "38", "41"]:
        if 'locustag' not in gene_dict and 'Locustag' in gene_dict:
            gene_dict['locustag'] = gene_dict['Locustag']

        for temp in ['16', '38', '41']:
            if gene_dict.get(f'KO_code_{temp}') and not gene_dict.get('KO_code'):
                gene_dict['KO_code'] = gene_dict[f'KO_code_{temp}']
                break

        for temp in ['16', '38', '41']:
            if gene_dict.get(f'Name_{temp}') and not gene_dict.get('Name'):
                gene_dict['Name'] = gene_dict[f'Name_{temp}']
                break

        for temp in ['16', '38', '41']:
            if gene_dict.get(f'Protein_accession_{temp}') and not gene_dict.get('Protein_accession'):
                gene_dict['Protein_accession'] = gene_dict[f'Protein_accession_{temp}']
                break

        if table_name == "16_38_41" and gene_dict.get('Name_x') and not gene_dict.get('Name'):
            gene_dict['Name'] = gene_dict['Name_x']

    return gene_dict


def _pathway_field(table_name: str):
    return "Pathways" if table_name == "16_38_41" else "Pathway"


def _collect_pathways(pathways_data: list) -> list:
    all_pathways = []
    for (pathway_value,) in pathways_data:
        if pathway_value and isinstance(pathway_value, str) and pathway_value.strip():
            for pathway in pathway_value.split(","):
                pathway = pathway.strip()
                if pathway:
                    all_pathways.append(pathway)
    return all_pathways


# Estadísticas de una tabla
@router.get("/stats/{table_name}", response_model=TableStatsResponse)
def get_table_stats(table_name: str, db: Session = Depends(get_db)):
    model = _get_model(table_name)
    id_field = model.id if table_name in ["16", "38", "41"] else model.ID
    total_rows = db.query(func.count(id_field)).scalar()

    pathway_col = getattr(model, _pathway_field(table_name))
    pathways_data = db.query(pathway_col).all()
    unique_pathways = set(_collect_pathways(pathways_data))

    return TableStatsResponse(
        total_rows=total_rows,
        unique_pathways=len(unique_pathways),
        pathways_list=list(unique_pathways)
    )


# Pathways únicos de una tabla
@router.get("/pathways/{table_name}", response_model=PathwaysResponse)
def get_pathways(table_name: str, db: Session = Depends(get_db)):
    model = _get_model(table_name)
    pathway_col = getattr(model, _pathway_field(table_name))
    pathways_data = db.query(pathway_col).all()
    unique_pathways = sorted(set(_collect_pathways(pathways_data)))
    return PathwaysResponse(pathways=unique_pathways)


# Genes filtrados por pathway
@router.get("/genes/filter/{table_name}/{pathway}", response_model=GeneFilterResponse)
def get_genes_by_pathway(table_name: str, pathway: str, db: Session = Depends(get_db)):
    model = _get_model(table_name)
    pathway_col = getattr(model, _pathway_field(table_name))

    # Búsqueda directa
    genes = db.query(model).filter(pathway_col.ilike(f"%{pathway}%")).all()

    # Los pathways llegan como slugs URL (guiones en lugar de espacios), intentar decodificar
    if not genes and "-" in pathway:
        unslug = pathway.replace("-", " ")
        genes = db.query(model).filter(pathway_col.ilike(f"%{unslug}%")).all()

    return GeneFilterResponse(genes=[_gene_to_dict(g, table_name) for g in genes])


# Todos los genes de una tabla
MAX_LIMIT = 1000

@router.get("/genes/all/{table_name}", response_model=GeneFilterResponse)
def get_all_genes(table_name: str, skip: int = 0, limit: int = MAX_LIMIT, db: Session = Depends(get_db)):
    if limit < 1 or limit > MAX_LIMIT:
        raise HTTPException(status_code=400, detail=f"limit must be between 1 and {MAX_LIMIT}")
    if skip < 0:
        raise HTTPException(status_code=400, detail="skip must be >= 0")
    model = _get_model(table_name)
    genes = db.query(model).offset(skip).limit(limit).all()
    return GeneFilterResponse(genes=[_gene_to_dict(g, table_name) for g in genes])
