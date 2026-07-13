# M2: base Bioconductor en vez de python:3.11-slim — trae R + BiocManager con
# las dependencias de Bioconductor preinstaladas, así compilar DESeq2 tarda
# ~7 min en vez de ~40 min sobre una imagen slim que parte de cero.
# ponytail: imagen más pesada que python:slim; aceptable porque solo hay un servicio.
# Verificado: build local completo (incl. DESeq2) en ~7 min, sin errores.
FROM bioconductor/bioconductor_docker:RELEASE_3_18

WORKDIR /app

# La imagen base trae R pero no Python.
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Paquetes R para el pipeline DESeq2 (run_deseq2.R)
RUN R -e 'BiocManager::install("DESeq2", update=FALSE, ask=FALSE)' \
    && R -e 'install.packages("jsonlite", repos="https://cloud.r-project.org")'

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias (--break-system-packages: Debian bookworm bloquea pip
# global por PEP 668; no hace falta un venv para un solo servicio de un contenedor)
RUN pip3 install --upgrade pip setuptools wheel \
    && pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Copiar código del backend
COPY backend/ ./backend/
COPY db/ ./db/
COPY run_deseq2.R ./run_deseq2.R

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["python3", "backend/main.py"]
