# Usar imagen oficial de Python
FROM python:3.11-slim

# Establecer directorio de trabajo
WORKDIR /app

# Copiar requirements
COPY requirements.txt .

# Instalar dependencias
RUN pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY backend/ ./backend/
COPY db/ ./db/

# Exponer puerto
EXPOSE 8000

# Comando de inicio
CMD ["python", "backend/main.py"]