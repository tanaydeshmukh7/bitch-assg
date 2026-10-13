import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.core.config import settings
from app.core import supabase_client


@pytest.fixture
def client(monkeypatch):
    # Keep unit tests deterministic and independent of production Supabase credentials.
    monkeypatch.setattr(settings, "SUPABASE_URL", "")
    monkeypatch.setattr(settings, "SUPABASE_PUBLISHABLE_KEY", "")
    monkeypatch.setattr(settings, "SUPABASE_SECRET_KEY", "")
    monkeypatch.setattr(supabase_client, "_anon_client", None)
    monkeypatch.setattr(supabase_client, "_admin_client", None)
    return TestClient(app)


@pytest.fixture
def user_a_headers():
    return {"Authorization": "Bearer test_token_user_alpha"}


@pytest.fixture
def user_b_headers():
    return {"Authorization": "Bearer test_token_user_beta"}
