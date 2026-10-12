"""AI chat that finds out which legal document the user needs and fills in its fields."""

import json
from datetime import date
from typing import Literal

from litellm import completion
from pydantic import BaseModel, Field, create_model

from prelegal_backend.config import REPO_ROOT

MODEL = "openrouter/nvidia/nemotron-3-super-120b-a12b:free"
NDA = "mutual-nda"

DOCUMENTS = {d["id"]: d for d in json.loads((REPO_ROOT / "documents.json").read_text(encoding="utf-8"))["documents"]}
DocumentId = Literal[tuple(DOCUMENTS)]


class Party(BaseModel):
    name: str
    title: str
    company: str
    noticeAddress: str


class NdaData(BaseModel):
    """Mirrors the frontend NdaData type (frontend/src/lib/nda.ts)."""

    purpose: str
    effectiveDate: str
    mndaTermType: Literal["expires", "continuous"]
    mndaTermYears: int
    confidentialityType: Literal["years", "perpetual"]
    confidentialityYears: int
    governingLaw: str
    jurisdiction: str
    modifications: str
    parties: tuple[Party, Party]


class GenericData(BaseModel):
    """Fields of every document except the NDA: two parties plus the document's key terms."""

    parties: tuple[Party, Party]
    terms: dict[str, str]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    documentType: DocumentId | None = None
    fields: NdaData | GenericData | None = None


class ChatResponse(BaseModel):
    reply: str
    documentType: DocumentId | None
    fields: NdaData | GenericData | None
    focus: list[str]


class SelectReply(BaseModel):
    """AI answer while no document is chosen yet."""

    reply: str
    documentType: DocumentId | None


def fields_model(doc_id: str) -> type[BaseModel]:
    """Structured-output model for one document's fields, with its key terms as explicit properties."""
    if doc_id == NDA:
        return NdaData
    name = doc_id.title().replace("-", "")
    terms = {t["key"]: (str, Field(description=t["hint"])) for t in DOCUMENTS[doc_id]["terms"]}
    terms_model = create_model(f"{name}Terms", **terms)
    return create_model(f"{name}Fields", parties=(tuple[Party, Party], ...), terms=(terms_model, ...))


NDA_FOCUS_KEYS = ["purpose", "effectiveDate", "mndaTerm", "confidentiality", "governingLaw", "jurisdiction", "modifications"]


def focus_keys(doc_id: str) -> list[str]:
    """Names the preview uses to highlight the part of the document the AI is asking about."""
    keys = NDA_FOCUS_KEYS if doc_id == NDA else [t["key"] for t in DOCUMENTS[doc_id]["terms"]]
    return keys + ["party1", "party2"]


def reply_model(doc_id: str) -> type[BaseModel]:
    """Structured-output model while filling in `doc_id`."""
    return create_model(
        "DocumentReply",
        reply=(str, ...),
        documentType=(DocumentId, ...),
        fields=(fields_model(doc_id), ...),
        focus=(list[Literal[tuple(focus_keys(doc_id))]], ...),
    )


def default_fields(doc_id: str) -> NdaData | GenericData:
    """Empty fields for a newly chosen document."""
    party = Party(name="", title="", company="", noticeAddress="")
    if doc_id == NDA:
        return NdaData(
            purpose="Evaluating whether to enter into a business relationship with the other party.",
            effectiveDate=date.today().isoformat(),
            mndaTermType="expires",
            mndaTermYears=1,
            confidentialityType="years",
            confidentialityYears=1,
            governingLaw="",
            jurisdiction="",
            modifications="",
            parties=(party, party),
        )
    return GenericData(parties=(party, party), terms={t["key"]: "" for t in DOCUMENTS[doc_id]["terms"]})


def document_list() -> str:
    """Supported documents, one per line, for the AI instructions."""
    return "\n".join(f'- {d["id"]}: {d["name"]} - {d["description"]}' for d in DOCUMENTS.values())


COMMON_RULES = """Supported documents (id: name - description):
{documents}

Rules:
- "reply" is shown to the user as plain text: short, friendly sentences only. No JSON, no field names, no markdown.
- If the user asks for a document that is not supported, say we cannot generate it and suggest the closest supported document.
"""

SELECT_INSTRUCTIONS = """You help users draft legal agreements from Common Paper templates. First find out which document they need.

""" + COMMON_RULES + """- Set documentType only when the user clearly wants one supported document; otherwise null and ask what they need.
"""

NDA_FIELDS = """- purpose: how Confidential Information may be used
- effectiveDate: date the MNDA starts, as YYYY-MM-DD
- mndaTermType: "expires" (lasts mndaTermYears years) or "continuous" (until terminated)
- confidentialityType: "years" (protected for confidentialityYears years) or "perpetual"
- governingLaw: the US state whose laws govern the MNDA, e.g. "Delaware"
- jurisdiction: city or county and state of the courts, e.g. "New Castle, DE"
- modifications: optional changes to the standard terms (empty if none)
- parties: exactly two parties, each with company, name (signatory), title and noticeAddress (email or postal address)
- The MNDA term and the term of confidentiality are separate. Change each one only when the user talks about it, and confirm both with the user."""

DOCUMENT_INSTRUCTIONS = """You help the user complete a {name} (documentType "{doc_id}") through a friendly chat. Today is {today}.

Fields to fill in:
{fields}

Current field values:
{values}

""" + COMMON_RULES + """- Return ALL fields every time. Copy every current value unchanged unless the user gave new information for it.
- Put information into fields only when the user stated it. Never invent names, companies or addresses.
- Ask about one or two missing fields at a time. Optional fields may stay empty if the user has nothing to add.
- "focus" lists the fields your reply asks about, using these keys: {focus_keys}. Use party1 / party2 for anything about the first / second party. Empty when you ask about nothing.
- Keep documentType "{doc_id}" unless the user wants a different supported document; then set documentType to that id.
- When every field is filled in, say so and tell the user they can download the PDF.
"""


def generic_fields_text(doc: dict) -> str:
    """Field descriptions of a non-NDA document for the AI instructions."""
    roles = doc["parties"]
    lines = [
        f"- parties: exactly two parties: first the {roles[0]}, then the {roles[1]}; "
        "each with company, name (signatory), title and noticeAddress (email or postal address)"
    ]
    lines += [f'- terms.{t["key"]}: {t["label"]} - {t["hint"]}' for t in doc["terms"]]
    return "\n".join(lines)


def ask(system: str, messages: list[ChatMessage], response_model: type[BaseModel]) -> BaseModel:
    """One structured-output LLM call."""
    history = [{"role": "system", "content": system}] + [m.model_dump() for m in messages]
    response = completion(model=MODEL, messages=history, response_format=response_model, timeout=60)
    return response_model.model_validate_json(response.choices[0].message.content)


def fill_document(doc_id: str, fields: NdaData | GenericData, messages: list[ChatMessage]) -> BaseModel:
    """Ask the AI for the next reply and the updated fields of `doc_id`."""
    doc = DOCUMENTS[doc_id]
    system = DOCUMENT_INSTRUCTIONS.format(
        name=doc["name"],
        doc_id=doc_id,
        today=date.today().isoformat(),
        fields=NDA_FIELDS if doc_id == NDA else generic_fields_text(doc),
        values=json.dumps(fields.model_dump(), indent=2),
        documents=document_list(),
        focus_keys=", ".join(focus_keys(doc_id)),
    )
    return ask(system, messages, reply_model(doc_id))


def next_turn(request: ChatRequest) -> ChatResponse:
    """Choose the document if needed, then fill in its fields from the conversation.

    Choosing a document or switching to another one costs a second LLM call in the same turn.
    """
    doc_id, fields = request.documentType, request.fields
    if doc_id is None:
        choice = ask(SELECT_INSTRUCTIONS.format(documents=document_list()), request.messages, SelectReply)
        if choice.documentType is None:
            return ChatResponse(reply=choice.reply, documentType=None, fields=None, focus=[])
        doc_id, fields = choice.documentType, default_fields(choice.documentType)

    result = fill_document(doc_id, fields, request.messages)
    if result.documentType != doc_id:
        doc_id = result.documentType
        result = fill_document(doc_id, default_fields(doc_id), request.messages)
    return ChatResponse(reply=result.reply, documentType=doc_id, fields=result.fields.model_dump(), focus=result.focus)
