"""FastAPI application: JSON API under /api, static frontend everywhere else."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from prelegal_backend import auth, config, documents
from prelegal_backend.auth import CurrentUser
from prelegal_backend.chat import ChatRequest, ChatResponse, next_turn
from prelegal_backend.db import reset_database
from prelegal_backend.documents import get_document, save_document


@asynccontextmanager
async def lifespan(app: FastAPI):
    reset_database(config.DB_PATH)
    yield


app = FastAPI(title="prelegal", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(documents.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/chat")
def chat(request: ChatRequest, user: CurrentUser) -> ChatResponse:
    """One AI turn; the document is saved for the user as soon as the AI knows its type."""
    if request.documentId is not None:
        get_document(user.id, request.documentId)
    response = next_turn(request)
    if response.documentType:
        response.documentId = save_document(user.id, request.documentId, request.messages, response)
    return response


app.mount("/", StaticFiles(directory=config.STATIC_DIR, html=True), name="frontend")
