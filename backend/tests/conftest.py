"""Point the app at a temporary database and a fake static frontend before it is imported."""

import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def static_dir(tmp_path_factory):
    path = tmp_path_factory.mktemp("out")
    (path / "index.html").write_text("<h1>login</h1>")
    (path / "nda").mkdir()
    (path / "nda" / "index.html").write_text("<h1>nda</h1>")
    (path / "404.html").write_text("<h1>not found</h1>")
    return path


@pytest.fixture(scope="session")
def db_path(tmp_path_factory):
    return tmp_path_factory.mktemp("data") / "prelegal.db"


@pytest.fixture
def client(static_dir, db_path):
    os.environ["PRELEGAL_STATIC_DIR"] = str(static_dir)
    os.environ["PRELEGAL_DB_PATH"] = str(db_path)
    from prelegal_backend.main import app

    with TestClient(app) as client:
        yield client


@pytest.fixture
def nda_fields():
    """Default Mutual NDA fields as the frontend sends them before any chat."""
    party = {"name": "", "title": "", "company": "", "noticeAddress": ""}
    return {
        "purpose": "Evaluating a partnership.",
        "effectiveDate": "",
        "mndaTermType": "expires",
        "mndaTermYears": 1,
        "confidentialityType": "years",
        "confidentialityYears": 1,
        "governingLaw": "",
        "jurisdiction": "",
        "modifications": "",
        "parties": [party, party],
    }
