from pydantic import BaseModel
from typing import List, Dict, Any

class TableStatsResponse(BaseModel):
    total_rows: int
    unique_pathways: int
    pathways_list: List[str]

class PathwaysResponse(BaseModel):
    pathways: List[str]

class GeneFilterResponse(BaseModel):
    genes: List[Dict[str, Any]]
    total: int
