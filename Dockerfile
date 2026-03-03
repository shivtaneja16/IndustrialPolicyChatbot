# ── Backend ──────────────────────────────────────────────────────────────────
FROM python:3.13-slim

WORKDIR /app

# System deps needed by some ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-cache friendly)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the runtime files
COPY main.py generation.py retriever.py ./
COPY bm25_retriever.pkl .
COPY krnatkadb/ ./krnatkadb/

EXPOSE 8000

CMD ["python", "main.py"]
