import io
import wave
from array import array
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import grounding, knowledge, llm
from app.main import app

client = TestClient(app)
LETTERS = {letter["id"]: letter["text"] for letter in knowledge.sample_letters()}


def ask(question):
    return client.post("/api/ask", json={"question": question}).json()


def use_gemini(monkeypatch, reply):
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", lambda system, prompt, **kwargs: reply)


# Citations
@pytest.mark.parametrize("text,sources,expected", [
    ("आपत्ति दें (S4)।", ["S4"], True),
    ("प्रपत्र-S2 में आपत्ति दें (S4)।", ["S4"], True),
    ("प्रपत्र S2 में आपत्ति दें (S4)।", ["S4"], True),
    ("Use Prapatra-S1 (S1).", ["S1"], True),
    ("कोई शुल्क नहीं (S5)।", ["S6"], False),
    ("(S3, S6)", ["S3"], False),
])
def test_citations_must_match_the_sources_shown(text, sources, expected):
    assert grounding.citations_match(text, sources) is expected


def test_answer_naming_an_uncited_rule_is_rejected(monkeypatch):
    use_gemini(monkeypatch, {"answer": "कोई शुल्क नहीं है (S5)।", "sources": ["S6"], "confidence": "supported"})
    assert ask("Kitna paisa lagega?")["engine"] == "offline"


def test_rule_that_does_not_exist_is_dropped(monkeypatch):
    use_gemini(monkeypatch, {"answer": "कोई शुल्क नहीं है (S9)।", "sources": ["S9"], "confidence": "supported"})
    assert ask("Kitna paisa lagega?")["engine"] == "offline"


# Numbers must come from the cited rule, not from anywhere in the notes
def test_number_from_another_rule_is_rejected(monkeypatch):
    use_gemini(monkeypatch, {"answer": "30 दिन के भीतर आपत्ति दें (S4)।", "sources": ["S4"], "confidence": "supported"})
    body = ask("Naksha galat hai to?")
    assert body["engine"] == "offline"
    assert "15 दिन" in body["answer"]


def test_number_from_the_cited_rule_is_accepted(monkeypatch):
    use_gemini(monkeypatch, {"answer": "15 दिन के भीतर आपत्ति दें (S4)।", "sources": ["S4"], "confidence": "supported"})
    assert ask("Naksha galat hai to?")["engine"] == "gemini"


def test_evidence_holds_only_cited_rules():
    evidence = grounding.evidence_for(["S4"])
    assert "15 days" in evidence
    assert "30 days" not in evidence
    assert "biharbhumi" not in grounding.evidence_for(["GLOSSARY"])


# The audit
@pytest.mark.real_verifier
def test_answer_failing_the_audit_is_not_shown(monkeypatch):
    def generate(system, prompt, **kwargs):
        if system == grounding.VERIFIER_SYSTEM:
            return {"supported": False, "reason": "S5 is about mutation"}
        return {"answer": "LPC के लिए पोर्टल पर आवेदन करें (S5)।", "sources": ["S5"], "confidence": "supported"}

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)
    body = ask("LPC kaise banega?")
    assert body["confidence"] == "unsupported"
    assert body["answer"] == knowledge.UNKNOWN_ANSWER["hi"]


@pytest.mark.real_verifier
def test_audit_sees_only_cited_evidence(monkeypatch):
    prompts = []

    def generate(system, prompt, **kwargs):
        if system == grounding.VERIFIER_SYSTEM:
            prompts.append(prompt)
            return {"supported": True}
        return {"answer": "सभी वारिस मिलकर आवेदन करें (S3)।", "sources": ["S3"], "confidence": "supported"}

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)
    assert ask("Dadaji ke naam par zameen hai")["engine"] == "gemini"
    assert "Rule S3" in prompts[0] and "Rule S2" in prompts[0] and "Rule S6" in prompts[0]
    assert "Rule S4" not in prompts[0]


@pytest.mark.real_verifier
@pytest.mark.parametrize("reply", [llm.LLMError("quota"), {"supported": "yes"}, {}])
def test_audit_that_cannot_confirm_means_not_trusted(monkeypatch, reply):
    def generate(system, prompt, **kwargs):
        if isinstance(reply, Exception):
            raise reply
        return reply

    monkeypatch.setattr(llm, "generate_json", generate)
    assert grounding.is_supported("x", "y") is False


@pytest.mark.real_verifier
def test_cached_answer_is_not_audited_again(monkeypatch):
    audits = []

    def generate(system, prompt, **kwargs):
        if system == grounding.VERIFIER_SYSTEM:
            audits.append(prompt)
            return {"supported": True}
        return {"answer": "कोई शुल्क नहीं है (S6)।", "sources": ["S6"], "confidence": "supported"}

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)
    for _ in range(2):
        assert ask("Kitna paisa lagega?")["engine"] == "gemini"
    assert len(audits) == 1


@pytest.mark.real_verifier
def test_document_wording_failing_the_audit_uses_offline_wording(monkeypatch):
    def generate(system, prompt, **kwargs):
        if system == grounding.VERIFIER_SYSTEM:
            return {"supported": False}
        return {"what_it_is": "यह नोटिस है।", "what_to_do": "कार्यालय में 5 बजे तक जाएँ।"}

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)
    body = client.post("/api/documents/explain", json={"text": LETTERS[1], "as_of": "2026-10-31"}).json()
    assert body["engine"] == "offline"


# Letter 2 date maths and wording
@pytest.mark.parametrize("as_of,status,remaining,overdue", [
    ("2026-10-21", "upcoming", 1, None),
    ("2026-10-22", "due_today", 0, None),
    ("2026-10-23", "overdue", None, 1),
    ("2026-10-31", "overdue", None, 9),
])
def test_letter_2_counts_21_days_from_the_letter_date(as_of, status, remaining, overdue):
    deadline = client.post("/api/documents/explain", json={"text": LETTERS[2], "as_of": as_of}).json()["deadline"]
    assert deadline["date"] == "2026-10-22"
    assert (date(2026, 10, 22) - date(2026, 10, 1)).days == 21
    assert deadline["status"] == status
    assert deadline["days_remaining"] == remaining
    assert deadline["days_overdue"] == overdue


@pytest.mark.parametrize("lang,hedge,counting", [("hi", "लगता है", "नहीं गिना"), ("en", "appears", "not counting")])
def test_letter_2_says_potentially_overdue_never_rejected(lang, hedge, counting):
    body = client.post("/api/documents/explain", json={"text": LETTERS[2], "as_of": "2026-10-31", "lang": lang}).json()
    deadline = body["deadline"]
    assert deadline["potentially_overdue"] is True
    assert hedge in deadline["message"]
    assert counting in deadline["basis"]
    for field in (body["what_it_is"], body["what_to_do"], deadline["message"]):
        assert "rejected" not in field and "अस्वीकार" not in field
    assert "may be rejected" in body["consequence"] or "किया जा सकता है" in body["consequence"]


# Silence must never reach the model
def wav(samples):
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(24000)
        output.writeframes(array("h", samples).tobytes())
    return buffer.getvalue()


def test_silent_wav_is_refused_without_calling_gemini(monkeypatch):
    def fail(*args):
        raise AssertionError("Gemini must not hear silence")

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "understand_audio", fail)
    response = client.post(
        "/api/voice/understand", files={"file": ("q.wav", io.BytesIO(wav([3, -2] * 24000)), "audio/wav")}, data={"lang": "bho"},
    )
    assert response.status_code == 422


def test_loud_wav_reaches_gemini(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "understand_audio", lambda *args: {"transcript": "नमस्ते", "detected_language": "hi", "normalized_question": "नमस्ते"})
    response = client.post(
        "/api/voice/understand", files={"file": ("q.wav", io.BytesIO(wav([3000, -3000] * 24000)), "audio/wav")}, data={"lang": "hi"},
    )
    assert response.status_code == 200
