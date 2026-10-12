# Stage 1: build the static Next.js frontend (reads ../templates at build time)
FROM node:24-slim AS frontend
WORKDIR /app
COPY templates templates
COPY documents.json documents.json
COPY frontend/package.json frontend/package-lock.json frontend/
RUN cd frontend && npm ci
COPY frontend frontend
RUN cd frontend && npm run build

# Stage 2: FastAPI backend serving the API and the static frontend
FROM ghcr.io/astral-sh/uv:python3.14-bookworm-slim
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
WORKDIR /app/backend
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --locked --no-dev --no-install-project
COPY backend ./
RUN uv sync --locked --no-dev
COPY --from=frontend /app/frontend/out /app/frontend/out
COPY documents.json /app/documents.json
ENV PRELEGAL_STATIC_DIR=/app/frontend/out \
    PRELEGAL_DB_PATH=/app/data/prelegal.db
EXPOSE 8000
CMD ["uv", "run", "--no-sync", "uvicorn", "prelegal_backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
