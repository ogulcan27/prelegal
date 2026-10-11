import json
from types import SimpleNamespace

import pytest

from prelegal_backend import chat


@pytest.fixture
def updated(nda_fields):
    return {**nda_fields, "governingLaw": "Delaware"}


@pytest.fixture
def fake_ai(monkeypatch, updated):
    """Replace the LLM call; record what was sent and return a fixed reply."""
    calls = []

    def completion(**kwargs):
        calls.append(kwargs)
        content = json.dumps({"reply": "Which courts?", "fields": updated})
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    monkeypatch.setattr(chat, "completion", completion)
    return calls


def test_returns_reply_and_updated_fields(client, fake_ai, nda_fields, updated):
    response = client.post("/api/chat", json={"messages": [{"role": "user", "content": "Delaware law"}], "fields": nda_fields})
    assert response.status_code == 200
    assert response.json() == {"reply": "Which courts?", "fields": updated}


def test_sends_instructions_then_conversation(client, fake_ai, nda_fields):
    conversation = [
        {"role": "assistant", "content": "Hi!"},
        {"role": "user", "content": "Delaware law"},
    ]
    client.post("/api/chat", json={"messages": conversation, "fields": nda_fields})
    call = fake_ai[0]
    assert call["model"] == chat.MODEL
    assert call["response_format"] is chat.ChatReply
    assert call["timeout"] == 60
    assert call["messages"][0]["role"] == "system"
    assert call["messages"][1:] == conversation


def test_instructions_include_current_fields_and_today(client, fake_ai, nda_fields):
    client.post("/api/chat", json={"messages": [{"role": "user", "content": "hi"}], "fields": nda_fields})
    system = fake_ai[0]["messages"][0]["content"]
    assert '"purpose": "Evaluating a partnership."' in system
    assert chat.date.today().isoformat() in system


def test_rejects_invalid_fields(client, fake_ai, nda_fields):
    response = client.post("/api/chat", json={"messages": [], "fields": {**nda_fields, "mndaTermType": "forever"}})
    assert response.status_code == 422
    assert fake_ai == []
