from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routes import router
import uvicorn

# Crear las tablas
Base.metadata.create_all(bind=engine)

# Inicializar la aplicación
app = FastAPI(title="Genes API",
              description="API para consultar genes en diferentes condiciones de temperatura",
              version="1.0.0")

# Configurar CORS para permitir solicitudes desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # URL del frontend (ajustar según sea necesario)
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],  # Permitir todas las cabeceras
)

# Incluir los routers
app.include_router(router, prefix="/api")

# Redirigir la ruta raíz a /docs
@app.get("/")
def root():
    return {"message": "Bienvenido a la API de genes. Visita /docs para la documentación."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)