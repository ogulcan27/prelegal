import json
from types import SimpleNamespace

import pytest

from prelegal_backend import chat

PILOT = "pilot-agreement"
GREETING = {"role": "assistant", "content": "Hi! What do you need?"}
ASK = {"role": "user", "content": "A pilot agreement with Globex"}


@pytest.fixture
def fake_ai(monkeypatch):
    """Every LLM call returns the next queued answer."""
    answers = []

    def completion(**kwargs):
        content = json.dumps(answers.pop(0))
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    monkeypatch.setattr(chat, "completion", completion)
    return answers


def pilot_fields(company=""):
    fields = chat.default_fields(PILOT).model_dump(mode="json")
    fields["parties"][1]["company"] = company
    return fields


def fill_turn(fake_ai, reply, fields):
    fake_ai.append({"reply": reply, "documentType": PILOT, "fields": fields, "focus": []})


def start_pilot(client, fake_ai):
    """First turn: the AI picks the Pilot Agreement and fills in the customer."""
    fake_ai.append({"reply": "A pilot it is.", "documentType": PILOT})
    fill_turn(fake_ai, "Who is the provider?", pilot_fields("Globex"))
    return client.post("/api/chat", json={"messages": [GREETING, ASK]}).json()


def test_no_document_is_saved_before_the_ai_knows_the_type(client, fake_ai):
    fake_ai.append({"reply": "What do you need?", "documentType": None})
    response = client.post("/api/chat", json={"messages": [GREETING, ASK]})
    assert response.json()["documentId"] is None
    assert client.get("/api/documents").json() == []


def test_first_turn_saves_the_chat_and_fields(client, fake_ai):
    turn = start_pilot(client, fake_ai)
    saved = client.get(f"/api/documents/{turn['documentId']}").json()
    assert saved["title"] == "Pilot Agreement - Globex"
    assert saved["documentType"] == PILOT
    assert saved["fields"] == pilot_fields("Globex")
    assert saved["messages"] == [GREETING, ASK, {"role": "assistant", "content": "Who is the provider?"}]
    assert saved["updatedAt"].endswith("Z")


def test_later_turns_update_the_same_document(client, fake_ai):
    turn = start_pilot(client, fake_ai)
    fill_turn(fake_ai, "Thanks.", pilot_fields("Globex Inc"))
    answer = {"role": "user", "content": "Globex Inc, sorry"}
    messages = [GREETING, ASK, {"role": "assistant", "content": turn["reply"]}, answer]
    body = {"messages": messages, "documentType": PILOT, "fields": turn["fields"], "documentId": turn["documentId"]}
    second = client.post("/api/chat", json=body).json()
    assert second["documentId"] == turn["documentId"]
    listed = client.get("/api/documents").json()
    assert [(d["id"], d["title"]) for d in listed] == [(turn["documentId"], "Pilot Agreement - Globex Inc")]
    assert len(client.get(f"/api/documents/{turn['documentId']}").json()["messages"]) == 5


def test_lists_newest_first(client, fake_ai):
    first = start_pilot(client, fake_ai)["documentId"]
    second = start_pilot(client, fake_ai)["documentId"]
    assert [d["id"] for d in client.get("/api/documents").json()] == [second, first]


def test_users_only_see_their_own_documents(client, fake_ai):
    document_id = start_pilot(client, fake_ai)["documentId"]
    client.post("/api/auth/signout")
    client.post("/api/auth/signup", json={"email": "other@example.com", "password": "password123"})
    assert client.get("/api/documents").json() == []
    assert client.get(f"/api/documents/{document_id}").status_code == 404
    fill_turn(fake_ai, "Never sent.", pilot_fields())
    body = {"messages": [ASK], "documentType": PILOT, "fields": pilot_fields(), "documentId": document_id}
    assert client.post("/api/chat", json=body).status_code == 404
    assert len(fake_ai) == 1, "the AI is not called for someone else's document"


def test_documents_require_sign_in(anon_client):
    assert anon_client.get("/api/documents").status_code == 401
    assert anon_client.get("/api/documents/1").status_code == 401
