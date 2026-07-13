import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from app.database import engine, Base
from app.routes import router
import uvicorn

# Crear las tablas
Base.metadata.create_all(bind=engine)

# M2: create_all no altera tablas ya existentes (data_v2.db horneado en la
# imagen no tiene status/error). ALTER idempotente vía try/except.
# ponytail: migrador de verdad si el esquema sigue creciendo.
for ddl in (
    "ALTER TABLE datasets ADD COLUMN status VARCHAR(16) DEFAULT 'ready'",
    "ALTER TABLE datasets ADD COLUMN error VARCHAR",
):
    try:
        with engine.begin() as conn:
            conn.execute(text(ddl))
    except OperationalError:
        pass  # columna ya existe

# Inicializar la aplicación
app = FastAPI(title="Genes API",
              description="API para consultar genes en diferentes condiciones de temperatura",
              version="1.0.0")

allowed_origins = [
    "http://localhost:3000",
    "https://687fb35af2799d00080d8f7d--lovely-jelly-fe7bb8.netlify.app",
    "https://lovely-jelly-fe7bb8.netlify.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir los routers - Sin prefijo para que coincida con el frontend
app.include_router(router)

# Redirigir la ruta raíz a /docs
@app.get("/")
def root():
    return {"message": "Bienvenido a la API de genes. Visita /docs para la documentación."}

if __name__ == "__main__":
    # Configurar puerto dinámico para Railway (producción) y local
    # Producción: Puerto dinámico de Railway
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
    # Local: Puerto fijo 8000 con reload activado (comentar/descomentar según necesidad)
    #uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)