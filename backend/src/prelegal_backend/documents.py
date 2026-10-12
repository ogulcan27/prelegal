"""Each user's saved documents: the chat, the document type and its fields."""

import json

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from prelegal_backend.auth import CurrentUser
from prelegal_backend.chat import DOCUMENTS, ChatMessage, ChatResponse
from prelegal_backend.db import connect

router = APIRouter(prefix="/api/documents")


class DocumentSummary(BaseModel):
    id: int
    title: str
    documentType: str
    updatedAt: str


class SavedDocument(DocumentSummary):
    fields: dict
    messages: list[ChatMessage]


def title(document_type: str, fields: dict) -> str:
    """Document name plus the party companies once known, e.g. "Pilot Agreement - Acme / Globex"."""
    companies = [p["company"].strip() for p in fields["parties"] if p["company"].strip()]
    name = DOCUMENTS[document_type]["name"]
    return f"{name} - {' / '.join(companies)}" if companies else name


def save_document(user_id: int, document_id: int | None, messages: list[ChatMessage], response: ChatResponse) -> int:
    """Insert or update the document after a chat turn; returns its id."""
    fields = response.model_dump(mode="json")["fields"]
    conversation = [m.model_dump() for m in messages] + [{"role": "assistant", "content": response.reply}]
    values = (response.documentType, title(response.documentType, fields), json.dumps(fields), json.dumps(conversation))
    with connect() as conn, conn:
        if document_id is None:
            return conn.execute(
                "INSERT INTO documents (document_type, title, fields, messages, user_id) VALUES (?, ?, ?, ?, ?)",
                (*values, user_id),
            ).lastrowid
        conn.execute(
            "UPDATE documents SET document_type = ?, title = ?, fields = ?, messages = ?,"
            " updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ? AND user_id = ?",
            (*values, document_id, user_id),
        )
    return document_id


SUMMARY_COLUMNS = "id, title, document_type AS documentType, updated_at AS updatedAt"


def get_document(user_id: int, document_id: int) -> SavedDocument:
    """One of the user's documents; 404 if it does not exist or belongs to someone else."""
    with connect() as conn:
        row = conn.execute(
            f"SELECT {SUMMARY_COLUMNS}, fields, messages FROM documents WHERE id = ? AND user_id = ?",
            (document_id, user_id),
        ).fetchone()
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Document not found.")
    return SavedDocument(**{**row, "fields": json.loads(row["fields"]), "messages": json.loads(row["messages"])})


@router.get("")
def list_documents(user: CurrentUser) -> list[DocumentSummary]:
    """The user's documents, most recently changed first."""
    with connect() as conn:
        rows = conn.execute(
            f"SELECT {SUMMARY_COLUMNS} FROM documents WHERE user_id = ? ORDER BY updatedAt DESC, id DESC", (user.id,)
        ).fetchall()
    return [DocumentSummary(**row) for row in rows]


@router.get("/{document_id}")
def read_document(document_id: int, user: CurrentUser) -> SavedDocument:
    return get_document(user.id, document_id)
