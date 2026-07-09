import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuración de base de datos para Railway (producción) y local
# Producción: Railway con base de datos configurada
#DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///../db/data.db")
# Local: Base de datos local SQLite (comentar/descomentar según necesidad)
DATABASE_URL = "sqlite:///../db/data_v2.db"

if DATABASE_URL.startswith("sqlite://") and os.getenv("RAILWAY_ENVIRONMENT"):
    DATABASE_URL = "sqlite:///./db/data_v2.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()











    
    try:
        yield db
    finally:
        db.close()
