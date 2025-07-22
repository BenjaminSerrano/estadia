import os
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

# Configurar CORS dinámico para desarrollo y producción
allowed_origins = [
    "http://localhost:3000",  # Desarrollo local
    "https://localhost:3000",  # Desarrollo local HTTPS
    "https://687fb35af2799d00080d8f7d--lovely-jelly-fe7bb8.netlify.app",  # Netlify deployment
]

# En producción, permitir dominios específicos
if os.getenv("RAILWAY_ENVIRONMENT"):
    # Agregar dominios de producción cuando se despliegue
    allowed_origins.extend([
        "https://687fb35af2799d00080d8f7d--lovely-jelly-fe7bb8.netlify.app",
        "https://lovely-jelly-fe7bb8.netlify.app",
        "https://*.netlify.app",
        "https://*.railway.app",
        "https://*.vercel.app"
    ])
else:
    # En desarrollo local también permitir el dominio de Netlify para pruebas
    allowed_origins.append("https://687fb35af2799d00080d8f7d--lovely-jelly-fe7bb8.netlify.app")

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
    # Configurar puerto dinámico para Railway
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)