"""FastAPI application: JSON API under /api, static frontend everywhere else."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from prelegal_backend import config
from prelegal_backend.db import reset_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    reset_database(config.DB_PATH)
    yield


app = FastAPI(title="prelegal", lifespan=lifespan)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.mount("/", StaticFiles(directory=config.STATIC_DIR, html=True), name="frontend")
