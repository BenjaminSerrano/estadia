# Análisis de Expresión Génica Diferencial

Aplicación web para explorar y visualizar genes diferencialmente expresados en la bacteria *Burkholderia oklahomensis* H68 bajo distintas condiciones de temperatura (16°C, 38°C y 41°C).

## Descripción

El proyecto surge como parte de una estadía de investigación y permite consultar los resultados de un análisis de RNA-seq comparando el transcriptoma bacteriano a temperatura ambiente (16°C) versus temperaturas elevadas (38°C y 41°C).

Los datos incluyen genes únicos por condición y genes en común entre distintas condiciones (intersecciones), clasificados según las rutas metabólicas del sistema KEGG.

## Funcionalidades

- Visualización de genes diferencialmente expresados por condición de temperatura
- Filtrado por ruta metabólica (pathway KEGG)
- Consulta de intersecciones entre condiciones (genes compartidos)
- Estadísticas por tabla: total de genes y pathways únicos
- Exportación de datos

## Datos

| Tabla | Condición | Genes |
|-------|-----------|-------|
| 16 | Únicos a 16°C | 530 |
| 38 | Únicos a 38°C | 249 |
| 41 | Únicos a 41°C | 673 |
| 16_38 | Comunes 16°C y 38°C | 60 |
| 16_41 | Comunes 16°C y 41°C | 130 |
| 38_41 | Comunes 38°C y 41°C | 79 |
| 16_38_41 | Comunes a las tres condiciones | 66 |

Cada gen incluye: Locustag, KO code, nombre de proteína, log2FoldChange, p-value, p-value ajustado, posición genómica, orientación, pathway y familias de proteínas (Brite).

## Estructura del repositorio

```
estadia-back/
├── backend/
│   ├── app/
│   │   ├── database.py   # Conexión SQLite
│   │   ├── models.py     # Modelos SQLAlchemy
│   │   ├── routes.py     # Endpoints de la API
│   │   └── schemas.py    # Schemas Pydantic
│   └── main.py           # Entrada de la aplicación
├── db/
│   └── data.db           # Base de datos SQLite
├── Dockerfile
├── railway.toml
└── requirements.txt
```

## Despliegue

- **Backend:** Railway (Docker)
- **Frontend:** Netlify (Next.js estático)

## Tecnologías

### Backend
- [Python 3.11](https://www.python.org/)
- [FastAPI](https://fastapi.tiangolo.com/) — framework REST API
- [SQLAlchemy](https://www.sqlalchemy.org/) — ORM y queries parametrizadas
- [SQLite](https://www.sqlite.org/) — base de datos embebida
- [Uvicorn](https://www.uvicorn.org/) — servidor ASGI
- [Pydantic](https://docs.pydantic.dev/) — validación de datos
- [Docker](https://www.docker.com/) — contenedor de despliegue
- [Railway](https://railway.app/) — plataforma de hosting

### Frontend
- [Next.js 15](https://nextjs.org/) — framework React con SSG
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) — estilos
- [Radix UI](https://www.radix-ui.com/) — componentes accesibles
- [Framer Motion](https://www.framer.com/motion/) — animaciones
- [Lucide React](https://lucide.dev/) — iconos
- [Netlify](https://www.netlify.com/) — plataforma de hosting
