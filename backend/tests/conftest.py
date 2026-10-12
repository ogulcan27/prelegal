"""Point the app at a temporary database and a fake static frontend.

The environment is set when pytest loads this file, before any test module imports
`prelegal_backend.config`, which reads it once.
"""

import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(tempfile.mkdtemp(prefix="prelegal-tests-"))
STATIC_DIR = ROOT / "out"
(STATIC_DIR / "documents").mkdir(parents=True)
(STATIC_DIR / "index.html").write_text("<h1>login</h1>")
(STATIC_DIR / "documents" / "index.html").write_text("<h1>documents</h1>")
(STATIC_DIR / "404.html").write_text("<h1>not found</h1>")
os.environ["PRELEGAL_STATIC_DIR"] = str(STATIC_DIR)
os.environ["PRELEGAL_DB_PATH"] = str(ROOT / "prelegal.db")


@pytest.fixture
def db_path():
    return Path(os.environ["PRELEGAL_DB_PATH"])


@pytest.fixture
def client():
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
