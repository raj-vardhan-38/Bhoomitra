import io
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app import knowledge, llm
from app.main import app

client = TestClient(app)
AS_OF = "2026-10-31"
LETTERS = {letter["id"]: letter["text"] for letter in knowledge.sample_letters()}


@pytest.fixture(autouse=True)
def clean_state(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: False)


def translator(monkeypatch, translate):
    def generate(system, prompt, **kwargs):
        strings = eval(prompt.removeprefix("<strings>").removesuffix("</strings>"))
        return {"translations": [translate(text) for text in strings]}

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)


# Bhojpuri and Magahi output
@pytest.mark.parametrize("lang", ["bho", "mag"])
def test_without_ai_dialects_fall_back_to_flagged_hindi(lang):
    body = client.post("/api/ask", json={"question": "Kitna paisa lagega?", "lang": lang}).json()
    assert "कोई शुल्क नहीं" in body["answer"]
    assert body["language_fallback"] is True
    assert [source["id"] for source in body["sources"]] == ["S6"]


@pytest.mark.parametrize("question", ["कतना पइसा लागी?", "केतना पइसा लगतइ?"])
def test_dialect_fee_questions_offline(question):
    body = client.post("/api/ask", json={"question": question, "lang": "bho"}).json()
    assert [source["id"] for source in body["sources"]] == ["S6"]


@pytest.mark.parametrize("question", ["का सरकार हमार जमीन ले ली?", "की सरकार हमर जमीन ले लेतइ?"])
def test_dialect_land_taken_questions_are_refused(question):
    body = client.post("/api/ask", json={"question": question, "lang": "mag"}).json()
    assert body["confidence"] == "unsupported"
    assert body["engine"] == "guard"


def test_dialect_translates_wording_but_keeps_ids_and_question(monkeypatch):
    translator(monkeypatch, lambda text: "भोजपुरी " + text)
    monkeypatch.setattr(llm, "generate_json", _only_translate(llm.generate_json))
    body = client.post("/api/ask", json={"question": "नक्सा गलत बा त का करीं?", "lang": "bho"}).json()
    assert body["answer"].startswith("भोजपुरी ")
    assert body["spoken_text"].startswith("भोजपुरी ")
    assert body["question"] == "नक्सा गलत बा त का करीं?"
    assert "S4" in [source["id"] for source in body["sources"]]
    assert body["language_fallback"] is False


def _only_translate(generate):
    """The first Gemini call answers the question; let it fail so the offline answer is used."""
    def wrapped(system, prompt, **kwargs):
        if not prompt.startswith("<strings>"):
            raise llm.LLMError("offline answer please")
        return generate(system, prompt, **kwargs)
    return wrapped


@pytest.mark.parametrize("bad", [
    lambda text: text.replace("15", "25"),   # changed number
    lambda text: text.replace("S4", "S5"),   # changed rule
    lambda text: text.replace("15", ""),     # dropped number
    lambda text: "",                         # empty
])
def test_translation_that_changes_facts_is_rejected(monkeypatch, bad):
    translator(monkeypatch, bad)
    monkeypatch.setattr(llm, "generate_json", _only_translate(llm.generate_json))
    body = client.post("/api/ask", json={"question": "Naksha galat hai", "lang": "bho"}).json()
    assert "15 दिन" in body["answer"] and "S4" in body["answer"]
    assert body["language_fallback"] is True


def test_translation_with_wrong_count_is_ignored(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", lambda system, prompt, **kwargs: {"translations": ["x"]})
    body = client.get("/api/rules", params={"lang": "mag"}).json()
    assert body["rules"][0]["text"] == knowledge.RULES_HI["S1"]
    assert body["language_fallback"] is True


def test_dialect_documents_keep_code_calculated_facts(monkeypatch):
    translator(monkeypatch, lambda text: "मगही " + text)
    calls = llm.generate_json

    def only_translate(system, prompt, **kwargs):
        if not prompt.startswith("<strings>"):
            raise llm.LLMError("offline wording please")
        return calls(system, prompt, **kwargs)

    monkeypatch.setattr(llm, "generate_json", only_translate)
    body = client.post("/api/documents/explain", json={"text": LETTERS[1], "as_of": AS_OF, "lang": "mag"}).json()
    assert body["deadline"]["date"] == "2026-11-18"
    assert body["deadline"]["days_remaining"] == 18
    assert body["deadline"]["status"] == "upcoming"
    assert body["kind"] == "survey_notice"
    assert body["what_to_do"].startswith("मगही ")
    assert body["extracted_text"].startswith("Office of the Circle Officer")


def test_dialect_record_keeps_enums(monkeypatch):
    translator(monkeypatch, lambda text: "भोजपुरी " + text)
    params = {"district": "Patna", "mauza": "Rampur Kalan", "khata": 45, "as_of": AS_OF, "lang": "bho"}
    body = client.get("/api/records/search", params=params).json()
    assert body["pending_actions"][0]["type"] == "deceased_holder"
    assert body["pending_actions"][0]["message"].startswith("भोजपुरी ")
    assert body["holder"] == "Ram Prasad Yadav"


@pytest.mark.parametrize("lang", ["bho", "mag"])
def test_dialect_lookups(lang):
    assert client.get("/api/ask/samples", params={"lang": lang}).json()["samples"]
    assert len(client.get("/api/help", params={"lang": lang}).json()["faqs"]) >= 5


# Voice input
def voice(content=b"audio", content_type="audio/webm;codecs=opus", filename="q.webm", lang="bho"):
    return client.post("/api/voice/understand", files={"file": (filename, io.BytesIO(content), content_type)}, data={"lang": lang})


def test_voice_understood(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    seen = {}

    def understand(data, mime_type, hint):
        seen.update(mime_type=mime_type, hint=hint)
        return {"transcript": "हमार दादाजी के नाम पर जमीन बा", "detected_language": "bho", "normalized_question": "मेरे दादाजी के नाम पर ज़मीन है"}

    monkeypatch.setattr(llm, "understand_audio", understand)
    body = voice().json()
    assert body["detected_language"] == "bho"
    assert body["normalized_question"] == "मेरे दादाजी के नाम पर ज़मीन है"
    assert seen == {"mime_type": "audio/webm", "hint": "Bhojpuri"}


def test_voice_errors(monkeypatch):
    assert voice().status_code == 503
    assert voice(b"").status_code == 422
    assert voice(content_type="video/avi").status_code == 415
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "understand_audio", lambda *args: {"transcript": "", "detected_language": "", "normalized_question": ""})
    assert voice().status_code == 422

    def fail(*args):
        raise llm.LLMError("down")

    monkeypatch.setattr(llm, "understand_audio", fail)
    assert voice().status_code == 502


# Speech output
def test_tts_returns_wav_and_caches(monkeypatch):
    calls = []

    def synthesize(text):
        calls.append(text)
        return b"RIFFaudio"

    monkeypatch.setattr(llm, "synthesize", synthesize)
    for _ in range(2):
        response = client.post("/api/tts", json={"text": "नमस्ते", "lang": "mag"})
        assert response.status_code == 200
        assert response.headers["content-type"] == "audio/wav"
        assert response.content == b"RIFFaudio"
    assert calls == ["नमस्ते"]


def test_speech_request_holds_only_the_text_because_instructions_get_read_aloud(monkeypatch):
    sent = []

    def generate_content(model, contents, config):
        sent.append(contents)
        audio = SimpleNamespace(data=b"\x00\x00" * 100, mime_type="audio/L16;rate=24000")
        return SimpleNamespace(candidates=[SimpleNamespace(content=SimpleNamespace(parts=[SimpleNamespace(inline_data=audio)]))])

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "_client", lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate_content)))
    assert llm.synthesize("नमस्ते")[:4] == b"RIFF"
    assert sent == ["नमस्ते"]


def fail_speech(*args):
    raise llm.LLMError("quota")


def test_tts_falls_back_to_free_voice_when_quota_is_gone(monkeypatch):
    monkeypatch.setattr(llm, "synthesize", fail_speech)
    seen = []

    def fallback(text, lang):
        seen.append(lang)
        return b"ID3mp3"

    monkeypatch.setattr(llm, "fallback_speech", fallback)
    response = client.post("/api/tts", json={"text": "नमस्ते", "lang": "bho"})
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert seen == ["bho"]


def test_tts_errors(monkeypatch):
    assert client.post("/api/tts", json={"text": "   "}).status_code == 422
    assert client.post("/api/tts", json={"text": "x" * 5001}).status_code == 422
    monkeypatch.setattr(llm, "synthesize", fail_speech)
    monkeypatch.setattr(llm, "fallback_speech", fail_speech)
    assert client.post("/api/tts", json={"text": "नमस्ते"}).status_code == 502


def test_repeated_question_spends_no_more_quota(monkeypatch):
    calls = []

    def generate(system, prompt, **kwargs):
        calls.append(prompt)
        return {"answer": "कोई शुल्क नहीं है (S6)।", "sources": ["S6"], "confidence": "supported"}

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)
    for _ in range(3):
        assert client.post("/api/ask", json={"question": "Kitna paisa lagega?"}).json()["engine"] == "gemini"
    assert len(calls) == 1


def test_bad_gemini_answer_is_not_cached(monkeypatch):
    calls = []

    def generate(system, prompt, **kwargs):
        calls.append(prompt)
        return {"answer": "शुल्क 500 रुपये है (S6)।", "sources": ["S6"], "confidence": "supported"}

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)
    for _ in range(2):
        assert client.post("/api/ask", json={"question": "Kitna paisa lagega?"}).json()["engine"] == "offline"
    assert len(calls) == 2
