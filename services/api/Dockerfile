FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    DATABASE_URL=sqlite:////data/lexora.db \
    LEXORA_STORAGE_DIR=/data/documents_storage \
    LEXORA_LEGAL_INDEX=/data/legal_index.db
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN useradd --create-home lexora && mkdir -p /data && chown lexora /data
USER lexora
VOLUME /data

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
