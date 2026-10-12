"""Calls the real model through OpenRouter. Run with: uv run pytest -m live"""

import pytest

from prelegal_backend.chat import ChatRequest, next_turn

pytestmark = pytest.mark.live


def test_chooses_document_and_extracts_fields():
    request = ChatRequest(
        messages=[{"role": "user", "content": "I need a pilot agreement between Acme Inc (provider) and Globex LLC, Delaware law."}]
    )
    result = next_turn(request)
    assert result.documentType == "pilot-agreement"
    assert "Delaware" in result.fields.terms["governingLaw"]
    assert {p.company for p in result.fields.parties} == {"Acme Inc", "Globex LLC"}


def test_offers_closest_document_for_unsupported_request():
    result = next_turn(ChatRequest(messages=[{"role": "user", "content": "I need a residential lease for my apartment."}]))
    assert result.documentType is None
    assert result.reply


def test_keeps_nda_values(nda_fields):
    request = ChatRequest(
        messages=[{"role": "user", "content": "The NDA is between Acme Inc and Globex LLC, governed by Delaware law."}],
        documentType="mutual-nda",
        fields=nda_fields,
    )
    result = next_turn(request)
    assert "Delaware" in result.fields.governingLaw
    assert {p.company for p in result.fields.parties} == {"Acme Inc", "Globex LLC"}
    assert result.fields.purpose == nda_fields["purpose"]
