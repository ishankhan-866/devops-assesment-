# ---- Stage 1: dependencies ----
FROM python:3.12-slim AS builder
ENV PIP_NO_CACHE_DIR=1
WORKDIR /app
COPY requirements.txt .
RUN pip install --prefix=/install -r requirements.txt

# ---- Stage 2: runtime (non-root) ----
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
RUN useradd --create-home --uid 1000 appuser \
    && mkdir /app && chown appuser:appuser /app
WORKDIR /app
COPY --from=builder /install /usr/local
COPY --chown=appuser:appuser . .
USER appuser
EXPOSE 8000
