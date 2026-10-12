import json
from pathlib import Path
from types import SimpleNamespace

import pytest

from prelegal_backend import chat
from prelegal_backend.config import REPO_ROOT

CSA = "cloud-service-agreement"
USER = [{"role": "user", "content": "A cloud service agreement with Globex please"}]


@pytest.fixture
def fake_ai(monkeypatch):
    """Replace the LLM call with queued answers; `calls` records what was sent."""
    answers, calls = [], []

    def completion(**kwargs):
        calls.append(kwargs)
        content = json.dumps(answers.pop(0))
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])

    monkeypatch.setattr(chat, "completion", completion)
    return SimpleNamespace(answers=answers, calls=calls)


def csa_fields(**terms):
    fields = chat.default_fields(CSA).model_dump(mode="json")
    fields["terms"].update(terms)
    return fields


def post(client, **body):
    return client.post("/api/chat", json={"messages": USER, **body})


def test_asks_what_document_is_needed(client, fake_ai):
    fake_ai.answers.append({"reply": "Which document do you need?", "documentType": None})
    response = post(client)
    assert response.json() == {"reply": "Which document do you need?", "documentType": None, "fields": None, "focus": []}
    assert fake_ai.calls[0]["response_format"] is chat.SelectReply
    assert "cloud-service-agreement: Cloud Service Agreement" in fake_ai.calls[0]["messages"][0]["content"]


def test_choosing_a_document_fills_its_fields_in_the_same_turn(client, fake_ai):
    filled = csa_fields(governingLaw="Delaware")
    fake_ai.answers += [
        {"reply": "A CSA it is.", "documentType": CSA},
        {"reply": "Who is the provider?", "documentType": CSA, "fields": filled, "focus": ["party1"]},
    ]
    response = post(client)
    assert response.json() == {"reply": "Who is the provider?", "documentType": CSA, "fields": filled, "focus": ["party1"]}
    second = fake_ai.calls[1]
    assert "complete a Cloud Service Agreement" in second["messages"][0]["content"]
    assert second["messages"][1:] == USER


def test_continues_the_chosen_document_with_current_values(client, fake_ai):
    current = csa_fields(governingLaw="Delaware")
    fake_ai.answers.append({"reply": "Which courts?", "documentType": CSA, "fields": current, "focus": ["chosenCourts"]})
    response = post(client, documentType=CSA, fields=current)
    assert response.json()["focus"] == ["chosenCourts"]
    assert len(fake_ai.calls) == 1
    call = fake_ai.calls[0]
    assert '"governingLaw": "Delaware"' in call["messages"][0]["content"]
    assert call["timeout"] == 60
    assert call["model"] == chat.MODEL


def test_switching_document_starts_the_new_one_with_empty_fields(client, fake_ai, nda_fields):
    nda = {**nda_fields, "effectiveDate": chat.date.today().isoformat()}
    fake_ai.answers += [
        {"reply": "Switching.", "documentType": CSA, "fields": nda, "focus": []},
        {"reply": "Who is the provider?", "documentType": CSA, "fields": csa_fields(), "focus": ["party1"]},
    ]
    response = post(client, documentType=chat.NDA, fields=nda)
    assert response.json()["documentType"] == CSA
    assert '"subscriptionPeriod": ""' in fake_ai.calls[1]["messages"][0]["content"]


def test_rejects_unknown_document_type(client, fake_ai):
    assert post(client, documentType="employment-contract").status_code == 422
    assert fake_ai.calls == []


def test_generic_schema_lists_each_key_term():
    schema = chat.reply_model(CSA).model_json_schema()
    terms = next(d for name, d in schema["$defs"].items() if name.endswith("Terms"))
    keys = [t["key"] for t in chat.DOCUMENTS[CSA]["terms"]]
    assert list(terms["properties"]) == keys
    assert terms["required"] == keys


def test_every_document_has_a_template_and_two_parties():
    for doc in chat.DOCUMENTS.values():
        assert Path(REPO_ROOT, "templates", doc["template"]).is_file()
        assert len(doc["parties"]) == 2
