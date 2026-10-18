# Procesador de DPDDS: lecturas crudas -> tabla de conteos (ver worker.py). Misma base y versiones que la
# prueba de carga del 2026-10-08 (bench_railway/), para que los resultados sean comparables.
FROM mambaorg/micromamba:1.5.10
USER root
# Salmon aborta con "_S_create_c_locale name not valid" si en_US.UTF-8 no existe en el sistema.
RUN apt-get update && apt-get install -y --no-install-recommends locales \
    && sed -i "s/^# *en_US.UTF-8/en_US.UTF-8/" /etc/locale.gen && locale-gen && rm -rf /var/lib/apt/lists/*
ENV LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 PYTHONUNBUFFERED=1
USER $MAMBA_USER
RUN micromamba install -y -n base -c conda-forge -c bioconda salmon=1.11.4 fastp sra-tools curl python=3.12 \
    && micromamba clean -a -y
COPY --chown=$MAMBA_USER:$MAMBA_USER worker.py /app/worker.py
WORKDIR /tmp
CMD ["python", "/app/worker.py"]
