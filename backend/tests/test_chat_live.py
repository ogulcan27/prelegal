"""Calls the real model through OpenRouter. Run with: uv run pytest -m live"""

import pytest

from prelegal_backend.chat import ChatRequest, next_turn

pytestmark = pytest.mark.live


def test_extracts_fields_from_conversation(nda_fields):
    request = ChatRequest(
        messages=[{"role": "user", "content": "NDA between Acme Inc and Globex LLC, governed by Delaware law."}],
        fields=nda_fields,
    )
    result = next_turn(request)
    assert result.reply
    assert "Delaware" in result.fields.governingLaw
    assert {p.company for p in result.fields.parties} == {"Acme Inc", "Globex LLC"}
    assert result.fields.purpose == nda_fields["purpose"]
