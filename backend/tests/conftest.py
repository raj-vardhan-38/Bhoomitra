import pytest

from app import config, grounding, llm


def pytest_configure(config):
    config.addinivalue_line("markers", "real_verifier: run the real grounding audit instead of approving everything")


@pytest.fixture(autouse=True)
def isolated_cache(monkeypatch, tmp_path):
    monkeypatch.setattr(config, "CACHE_DIR", tmp_path)


@pytest.fixture(autouse=True)
def no_real_gemini(monkeypatch):
    """Tests must never spend real quota. A test that stubs Gemini turns this back on."""
    monkeypatch.setattr(llm, "is_enabled", lambda: False)


@pytest.fixture(autouse=True)
def audit_approves_by_default(request, monkeypatch):
    """Most tests stub one Gemini reply, which the audit would also receive. Audit behaviour has its own tests."""
    if "real_verifier" not in request.keywords:
        monkeypatch.setattr(grounding, "is_supported", lambda claims, evidence, question="": True)
