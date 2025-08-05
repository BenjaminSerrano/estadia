from pydantic import BaseModel
from typing import List, Dict, Any

class geneResponse(BaseModel):
    id: int
    locustag: str
    KO_code: str
    Protein_accession: str
    Name: str
    log2FoldChange: str
    pvalue: float
    padj: float
    Accession: str
    Begin: int
    End: int
    Protein_length: int
    Orientation: str
    Pathway: str
    Brite_specific_family_1: str
    Brite_specific_family_2: str
    Brite_specific_family_3: str
    Brite_protein_families_1: str
    Brite_protein_families_2: str
    Brite_protein_families_3: str

    class Config:
        from_attributes = True  # En Pydantic v2, 'orm_mode' cambió a 'from_attributes'

class TableStatsResponse(BaseModel):
    total_rows: int
    unique_pathways: int
    pathways_list: List[str]

class PathwaysResponse(BaseModel):
    pathways: List[str]

class GeneFilterResponse(BaseModel):
    genes: List[Dict[str, Any]]
    
class IntersectionStatsResponse(BaseModel):
    total_rows: int
    unique_pathways: int
    pathways_list: List[str]
    common_genes: List[str]

class Comparison_16_38_Response(BaseModel):
    ID: int
    Locustag: str
    KO_code_16: str
    KO_code_38: str
    Protein_accession_16: str
    Name_16: str
    log2FoldChange_16: float
    pvalue_16: float
    padj_16: float
    Accession_16: str
    Begin_16: int
    End_16: int
    Protein_length_16: int
    Orientation_16: str
    Protein_accession_38: str
    Name_38: str
    log2FoldChange_38: float
    pvalue_38: float
    padj_38: float
    Accession_38: str
    Begin_38: int
    End_38: int
    Protein_length_38: int
    Orientation_38: str
    Pathway: str
    Brite_specific_family_1: str
    Brite_specific_family_2: str
    Brite_specific_family_3: str
    Brite_protein_families_1: str
    Brite_protein_families_2: str
    Brite_protein_families_3: str

    class Config:
        from_attributes = True

class Comparison_16_38_ListResponse(BaseModel):
    comparisons: List[Comparison_16_38_Response]

class Comparison_16_41_Response(BaseModel):
    ID: int
    Locustag: str
    KO_code_16: str
    KO_code_41: str
    Protein_accession_16: str
    Name_16: str
    log2FoldChange_16: float
    pvalue_16: float
    padj_16: float
    Accession_16: str
    Begin_16: int
    End_16: int
    Protein_length_16: int
    Orientation_16: str
    Protein_accession_41: str
    Name_41: str
    log2FoldChange_41: float
    pvalue_41: float
    padj_41: float
    Accession_41: str
    Begin_41: int
    End_41: int
    Protein_length_41: int
    Orientation_41: str
    Pathway: str
    Brite_specific_family_1: str
    Brite_specific_family_2: str
    Brite_specific_family_3: str
    Brite_protein_families_1: str
    Brite_protein_families_2: str
    Brite_protein_families_3: str

    class Config:
        from_attributes = True

class Comparison_16_41_ListResponse(BaseModel):
    comparisons: List[Comparison_16_41_Response]

class Comparison_38_41_Response(BaseModel):
    ID: int
    Locustag: str
    KO_code_38: str
    KO_code_41: str
    Protein_accession_38: str
    Name_38: str
    log2FoldChange_38: float
    pvalue_38: float
    padj_38: float
    Accession_38: str
    Begin_38: int
    End_38: int
    Protein_length_38: int
    Orientation_38: str
    Protein_accession_41: str
    Name_41: str
    log2FoldChange_41: float
    pvalue_41: float
    padj_41: float
    Accession_41: str
    Begin_41: int
    End_41: int
    Protein_length_41: int
    Orientation_41: str
    Pathway: str
    Brite_specific_family_1: str
    Brite_specific_family_2: str
    Brite_specific_family_3: str
    Brite_protein_families_1: str
    Brite_protein_families_2: str
    Brite_protein_families_3: str

    class Config:
        from_attributes = True

class Comparison_38_41_ListResponse(BaseModel):
    comparisons: List[Comparison_38_41_Response]

class Comparison_16_38_41_Response(BaseModel):
    ID: int
    Locustag: str
    KO_code_16: str
    KO_code_41: str
    Protein_accession_16: str
    Name_16: str
    log2FoldChange_16: float
    pvalue_16: float
    padj_16: float
    Accession_16: str
    Begin_16: int
    End_16: int
    Protein_length_16: int
    Orientation_16: str
    Protein_accession_38: str
    Name_38: str
    log2FoldChange_38: float
    pvalue_38: float
    padj_38: float
    Accession_38: str
    Begin_38: int
    End_38: int
    Protein_length_38: int
    Orientation_38: str
    KO_code_38: str
    Protein_accession_41: str
    Name_41: str
    log2FoldChange_41: float
    pvalue_41: float
    padj_41: float
    Accession_41: str
    Begin_41: int
    End_41: int
    Protein_length_41: int
    Orientation_41: str
    Pathways: str
    Brite_protein_families_1: str
    Brite_specific_family_1: str
    Brite_protein_families_2: str
    Brite_specific_family_2: str
    Brite_protein_families_3: str
    Brite_specific_family_3: str

    class Config:
        from_attributes = True

class Comparison_16_38_41_ListResponse(BaseModel):
    comparisons: List[Comparison_16_38_41_Response]
