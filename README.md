# Aplicación Web de Análisis de Genes

Aplicación fullstack para análisis de genes con diferentes condiciones de temperatura, construida con Next.js y FastAPI.

## Arquitectura

- **Frontend**: Next.js con TypeScript (rama `frontend`)
- **Backend**: FastAPI con Python (rama `backend`)
- **Base de datos**: SQLite
- **Despliegue**: 
  - Frontend en Netlify
  - Backend en Railway

## URLs de Producción

- **API Backend**: https://estadia-production.up.railway.app
- **Documentación API**: https://estadia-production.up.railway.app/docs
- **Frontend**: Se configurará en Netlify

## Configuración para Despliegue

### Backend (Railway)
- Rama: `backend`
- Configuración automática con `Dockerfile` y `railway.toml`
- Base de datos SQLite incluida

### Frontend (Netlify)
- Rama: `frontend`
- **Variable de entorno requerida**:
  ```
  NEXT_PUBLIC_API_URL=https://estadia-production.up.railway.app/api
  ```

## Desarrollo Local

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend
```bash
cd intento
npm install
npm run dev
```

## Estructura del Proyecto

```
├── backend/           # API FastAPI
├── intento/           # Frontend Next.js
├── db/               # Base de datos y scripts
├── netlify.toml      # Configuración Netlify
├── railway.toml      # Configuración Railway
└── Dockerfile        # Container para Railway
```

## Funcionalidades

- Diagrama de Venn interactivo
- Análisis de genes por temperatura
- Filtrado por pathways
- Visualización de datos
- Export de datos