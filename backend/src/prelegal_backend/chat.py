"""AI chat that gathers Mutual NDA details and fills in the document fields."""

import json
from datetime import date
from typing import Literal

from litellm import completion
from pydantic import BaseModel

MODEL = "openrouter/nvidia/nemotron-3-super-120b-a12b:free"


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


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    fields: NdaData


class ChatReply(BaseModel):
    """What the AI returns each turn: its next message and the complete, updated fields."""

    reply: str
    fields: NdaData


INSTRUCTIONS = """You help a user complete a Common Paper Mutual Non-Disclosure Agreement (MNDA) through a friendly chat.

Fields to fill in:
- purpose: how Confidential Information may be used
- effectiveDate: date the MNDA starts, as YYYY-MM-DD (today is {today})
- mndaTermType: "expires" (lasts mndaTermYears years) or "continuous" (until terminated)
- confidentialityType: "years" (protected for confidentialityYears years) or "perpetual"
- governingLaw: the US state whose laws govern the MNDA, e.g. "Delaware"
- jurisdiction: city or county and state of the courts, e.g. "New Castle, DE"
- modifications: optional changes to the standard terms (empty if none)
- parties: exactly two parties, each with company, name (signatory), title and noticeAddress (email or postal address)

Current field values:
{fields}

Rules:
- Return ALL fields every time. Copy every current value unchanged unless the user gave new information for it.
- Put information into fields only when the user stated it. Never invent names, companies or addresses.
- The MNDA term and the term of confidentiality are separate. Change each one only when the user talks about it, and confirm both with the user.
- "reply" is shown to the user as plain text: short, friendly sentences only. No JSON, no field names, no markdown.
- Ask about one or two missing fields at a time.
- When every field is filled in, say so and tell the user they can download the PDF.
"""


def next_turn(request: ChatRequest) -> ChatReply:
    """Send the conversation to the AI and return its reply with the updated fields."""
    system = INSTRUCTIONS.format(
        today=date.today().isoformat(),
        fields=json.dumps(request.fields.model_dump(), indent=2),
    )
    messages = [{"role": "system", "content": system}] + [m.model_dump() for m in request.messages]
    response = completion(model=MODEL, messages=messages, response_format=ChatReply, timeout=60)
    return ChatReply.model_validate_json(response.choices[0].message.content)
