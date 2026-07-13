import os
import shutil
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

# M2: si DATA_DIR está seteado (volumen persistente de Railway), la DB y los
# uploads crudos viven ahí en vez de en la imagen (que se pisa en cada redeploy).
# La primera vez, sembramos el volumen copiando la DB horneada en la imagen.
# La ruta horneada se ancla a la ubicación de este archivo (no al CWD, que
# varía según cómo se lance el proceso — ver Dockerfile CMD vs RAILWAY_ENVIRONMENT).
DATA_DIR = os.getenv("DATA_DIR")
UPLOADS_DIR = None
if DATA_DIR:
    os.makedirs(DATA_DIR, exist_ok=True)
    volume_db_path = os.path.join(DATA_DIR, "data_v2.db")
    if not os.path.exists(volume_db_path):
        baked_db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "db", "data_v2.db")
        if os.path.exists(baked_db_path):
            shutil.copy(baked_db_path, volume_db_path)
    DATABASE_URL = f"sqlite:///{volume_db_path}"
    UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")
else:
    # Sin volumen (dev local): uploads junto a la DB actual, misma carpeta relativa.
    UPLOADS_DIR = os.path.join(os.path.dirname(DATABASE_URL.replace("sqlite:///", "", 1)), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()




    
    try:
        yield db
    finally:
        db.close()
