import time
from array import array

import pytest
from fastapi.testclient import TestClient

from app import config, knowledge, llm
from app.ask import OFF_TOPIC_ANSWER
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def gemini_disabled(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: False)


def ask(question, lang="hi"):
    return client.post("/api/ask", json={"question": question, "lang": lang}).json()


@pytest.mark.parametrize("question", [
    "hello", "Hi!", "namaste", "नमस्ते जी", "प्रणाम", "good morning", "thanks", "धन्यवाद", "shukriya ji",
    "who are you?", "आप कौन हैं?", "aap kaun ho", "what is your name", "आपका नाम क्या है",
    "what can you do?", "help", "आप क्या कर सकते हैं?", "मदद", "kaise madad karoge",
])
def test_conversation_gets_a_friendly_reply(question):
    body = ask(question)
    assert body["confidence"] == "general"
    assert body["sources"] == []
    assert knowledge.UNKNOWN_ANSWER["hi"] not in body["answer"]
    assert "बिचौलिए" not in body["spoken_text"]
    assert "बिचौलिए" in body["safety_message"]


def test_conversation_never_spends_gemini_quota(monkeypatch):
    def fail(system, prompt, **kwargs):
        raise AssertionError("Gemini must not be called")

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", fail)
    assert ask("hello")["confidence"] == "general"


@pytest.mark.parametrize("question,expected", [
    ("mera naam kya hai aur zameen ka kya karein", None),
    ("help me with the land map", ["S4"]),
    ("मदद के लिए शिविर कहाँ है", ["S7"]),
    ("hello, kitna paisa lagega?", ["S6"]),
])
def test_real_questions_are_not_mistaken_for_conversation(question, expected):
    body = ask(question)
    assert body["confidence"] != "general"
    if expected:
        assert [source["id"] for source in body["sources"]] == expected


def test_english_conversation():
    body = ask("what can you do?", "en")
    assert body["confidence"] == "general"
    assert "official notices" in body["answer"]


def use_gemini(monkeypatch, reply):
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", lambda system, prompt, **kwargs: reply)


def test_off_topic_question_gets_polite_redirect(monkeypatch):
    use_gemini(monkeypatch, {"confidence": "unsupported", "topic": "other"})
    body = ask("Aaj mausam kaisa hai?")
    assert body["answer"] == OFF_TOPIC_ANSWER["hi"]
    assert body["confidence"] == "unsupported"
    assert body["sources"] == []


def test_uncovered_land_question_still_goes_to_circle_office(monkeypatch):
    use_gemini(monkeypatch, {"confidence": "unsupported", "topic": "land"})
    assert ask("LPC kaise banega?")["answer"] == knowledge.UNKNOWN_ANSWER["hi"]


def test_land_taken_question_is_still_refused_as_land():
    assert ask("Will the government take my land?")["answer"] == knowledge.UNKNOWN_ANSWER["hi"]


def test_romanized_hindi_from_gemini_is_rejected(monkeypatch):
    use_gemini(monkeypatch, {"answer": "swayan-ghoshna ke liye koi shulk nahi hai (S6)", "sources": ["S6"], "confidence": "supported"})
    body = ask("Kitna paisa lagega?")
    assert body["engine"] == "offline"
    assert "कोई शुल्क नहीं" in body["answer"]


def test_action_repeating_the_documents_is_not_spoken(monkeypatch):
    use_gemini(monkeypatch, {
        "answer": "सभी वारिस मिलकर आवेदन करें, कोई शुल्क नहीं है (S3)।",
        "action_required": "मृत्यु प्रमाण पत्र और वंशावली तैयार रखें।",
        "sources": ["S3"], "confidence": "supported",
    })
    assert "तैयार रखें" not in ask("Dadaji ke naam par zameen hai")["spoken_text"]


def test_off_topic_speech_has_no_middleman_warning(monkeypatch):
    use_gemini(monkeypatch, {"confidence": "unsupported", "topic": "other"})
    assert "बिचौलिए" not in ask("India ka capital kya hai?")["spoken_text"]


def test_fee_answer_speech_does_not_repeat_no_fee(monkeypatch):
    use_gemini(monkeypatch, {"answer": "कोई शुल्क नहीं लगता (S6)।", "sources": ["S6"], "confidence": "supported"})
    spoken = ask("Kitna paisa lagega?")["spoken_text"]
    assert spoken.count("शुल्क") == 1
    assert "बिचौलिए" in spoken


# A slow or failed main model
def test_backup_model_answers_when_main_is_slow(monkeypatch):
    monkeypatch.setattr(config, "GEMINI_MODEL", "main")
    monkeypatch.setattr(config, "GEMINI_BACKUP_MODEL", "backup")
    monkeypatch.setattr(config, "GEMINI_BACKUP_AFTER_SECONDS", 0.05)

    def generate(contents, system, json_mode, timeout_seconds, model=None):
        if model == "main":
            time.sleep(1)
        return '{"from": "%s"}' % model

    monkeypatch.setattr(llm, "_generate", generate)
    start = time.time()
    assert llm.generate_json("s", "p") == {"from": "backup"}
    assert time.time() - start < 0.8


def test_backup_is_not_used_when_main_is_quick(monkeypatch):
    monkeypatch.setattr(config, "GEMINI_MODEL", "main")
    monkeypatch.setattr(config, "GEMINI_BACKUP_MODEL", "backup")
    used = []

    def generate(contents, system, json_mode, timeout_seconds, model=None):
        used.append(model)
        return "{}"

    monkeypatch.setattr(llm, "_generate", generate)
    llm.generate_json("s", "p")
    assert used == ["main"]


def test_backup_answers_when_main_fails_and_error_when_both_fail(monkeypatch):
    monkeypatch.setattr(config, "GEMINI_MODEL", "main")
    monkeypatch.setattr(config, "GEMINI_BACKUP_MODEL", "backup")

    def generate(contents, system, json_mode, timeout_seconds, model=None):
        if model == "main":
            raise llm.LLMError("503")
        return "{}"

    monkeypatch.setattr(llm, "_generate", generate)
    assert llm.generate_json("s", "p") == {}

    def always_fail(*args, **kwargs):
        raise llm.LLMError("down")

    monkeypatch.setattr(llm, "_generate", always_fail)
    with pytest.raises(llm.LLMError):
        llm.generate_json("s", "p")


def test_strong_work_falls_back_to_the_lighter_model(monkeypatch):
    monkeypatch.setattr(config, "GEMINI_STRONG_MODELS", ["strong"])
    monkeypatch.setattr(config, "GEMINI_MODEL", "light")
    monkeypatch.setattr(config, "GEMINI_BACKUP_MODEL", "light")
    used = []

    def generate(contents, system, json_mode, timeout_seconds, model=None):
        used.append((model, timeout_seconds))
        if model == "strong":
            raise llm.LLMError("429")
        return "{}"

    monkeypatch.setattr(llm, "_generate", generate)
    assert llm.generate_json("s", "p", strong_model=True) == {}
    assert used == [("strong", config.GEMINI_STRONG_TIMEOUT_SECONDS), ("light", config.GEMINI_TIMEOUT_SECONDS)]

    used.clear()
    assert llm.understand_audio(b"x", "audio/wav", "Bhojpuri") == {}
    assert [model for model, _ in used] == ["strong", "light"]


# Speech pacing and engine choice
def tone(length, value=3000):
    return array("h", [value] * length)


def test_long_pauses_are_shortened_and_speech_is_kept():
    rate = 24000
    pcm = tone(rate) + array("h", [0] * (rate * 2)) + tone(rate)
    result = array("h")
    result.frombytes(llm.shorten_pauses(pcm.tobytes(), rate))
    assert 2 * rate <= len(result) <= 2 * rate + rate * 0.2
    assert sum(1 for sample in result if sample == 3000) == 2 * rate


def test_short_pause_is_kept():
    rate = 24000
    pcm = tone(rate) + array("h", [0] * (rate // 10)) + tone(rate)
    result = llm.shorten_pauses(pcm.tobytes(), rate)
    assert len(result) == len(pcm.tobytes())


@pytest.mark.parametrize("lang,first", [("hi", "free"), ("en", "free"), ("bho", "gemini"), ("mag", "gemini")])
def test_speech_engine_order(monkeypatch, lang, first):
    used = []
    monkeypatch.setattr(llm, "synthesize", lambda text: used.append("gemini") or b"RIFFx")
    monkeypatch.setattr(llm, "fallback_speech", lambda text, language: used.append("free") or b"ID3x")
    assert client.post("/api/tts", json={"text": "नमस्ते", "lang": lang}).status_code == 200
    assert used == [first]


def test_glossary_cannot_support_how_to_advice(monkeypatch):
    use_gemini(monkeypatch, {"answer": "बिहार भूमि पोर्टल पर जाकर देखें।", "sources": ["GLOSSARY"], "confidence": "supported"})
    assert ask("mera khata kaise dekhu?")["answer"] == knowledge.UNKNOWN_ANSWER["hi"]


def test_glossary_still_answers_what_a_word_means(monkeypatch):
    use_gemini(monkeypatch, {"answer": "खतियान ज़मीन का अधिकार-अभिलेख है।", "sources": ["GLOSSARY"], "confidence": "supported"})
    assert ask("Khatiyan kya hota hai?")["confidence"] == "supported"
