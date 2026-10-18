from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from app.database import Base
import datetime


class Dataset(Base):
    __tablename__ = "datasets"
    id = Column(Integer, primary_key=True)
    name = Column(String(256), nullable=False)
    organism = Column(String(256))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # M2: uploads crudos pasan por pending -> running -> done/error. Datasets
    # sembrados desde el schema original quedan "ready" (ver ALTER en main.py).
    status = Column(String(16), default="ready")
    error = Column(String, nullable=True)
    # Ensamblaje NCBI (GCF_/GCA_) para anotar los genes subidos; ver app/annotation.py
    genome_accession = Column(String(64), nullable=True)


class Job(Base):
    """Procesamiento desde lecturas crudas (links o accesiones de NCBI) que hace el servicio `procesador`.
    queued -> running -> needs_conditions -> done, o error. Al asignar condiciones se crea un Dataset normal."""
    __tablename__ = "jobs"
    id = Column(Integer, primary_key=True)
    # La API no tiene auth: el token (inadivinable) es lo único que da acceso al trabajo desde la página
    token = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(256), nullable=False)
    organism = Column(String(256))
    genome_accession = Column(String(64), nullable=False)
    links = Column(String, nullable=False)  # uno por línea, tal como los pegó el usuario
    status = Column(String(24), default="queued")
    progress = Column(String)  # JSON que manda el procesador: etapa, mensaje y estado de cada muestra
    error = Column(String)
    attempts = Column(Integer, default=0)
    dataset_id = Column(Integer, ForeignKey("datasets.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)


class Condition(Base):
    __tablename__ = "conditions"
    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    label = Column(String(64), nullable=False)
    is_baseline = Column(Boolean, default=False)


class Gene(Base):
    __tablename__ = "genes"
    id = Column(Integer, primary_key=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    locustag = Column(String(512), index=True)
    KO_code = Column(String(512))
    Protein_accession = Column(String(512))
    Name = Column(String(512))
    Accession = Column(String(512))
    Begin = Column(Integer)
    End = Column(Integer)
    Protein_length = Column(Integer)
    Orientation = Column(String(16))
    Pathway = Column(String(512))
    Brite_specific_family_1 = Column(String(512))
    Brite_specific_family_2 = Column(String(512))
    Brite_specific_family_3 = Column(String(512))
    Brite_protein_families_1 = Column(String(512))
    Brite_protein_families_2 = Column(String(512))
    Brite_protein_families_3 = Column(String(512))


class ExpressionResult(Base):
    __tablename__ = "expression_results"
    id = Column(Integer, primary_key=True)
    gene_id = Column(Integer, ForeignKey("genes.id"), nullable=False)
    condition_id = Column(Integer, ForeignKey("conditions.id"), nullable=False)
    log2FoldChange = Column(Float)
    pvalue = Column(Float)
    padj = Column(Float)
