# /backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from buffering stdout and stderr
ENV PYTHONUNBUFFERED=1

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose the internal port (FastAPI default)
EXPOSE 8000

# Run FastAPI using Uvicorn in production mode (2 workers for 2 vCPU)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]