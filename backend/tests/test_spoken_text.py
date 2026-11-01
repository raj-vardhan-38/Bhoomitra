import re

import pytest
from fastapi.testclient import TestClient

from app import knowledge, llm
from app.main import app

client = TestClient(app)
AS_OF = "2026-10-31"
LETTERS = {letter["id"]: letter["text"] for letter in knowledge.sample_letters()}
RULE_NUMBER = re.compile(r"(?<![-\w])S[1-7]\b|नियम S|Rule S")


@pytest.fixture(autouse=True)
def gemini_disabled(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: False)


def use_gemini(monkeypatch, reply):
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", lambda system, prompt, **kwargs: reply)


def ask(question, lang="hi"):
    return client.post("/api/ask", json={"question": question, "lang": lang}).json()


def sentences(text):
    return [part.strip() for part in re.split(r"[।.!?]\s*", text) if part.strip()]


@pytest.mark.parametrize("question,lang", [
    ("Dadaji ke naam par zameen hai", "hi"),
    ("Kitna paisa lagega?", "hi"),
    ("Naksha galat hai to?", "hi"),
    ("Mutation kaise hoga?", "hi"),
    ("Will the government take my land?", "hi"),
    ("My grandfather died, what should I do?", "en"),
    ("How much is the fee?", "en"),
])
def test_speech_has_no_rule_numbers_and_no_repeated_sentence(question, lang):
    spoken = ask(question, lang)["spoken_text"]
    assert not RULE_NUMBER.search(spoken), spoken
    parts = sentences(spoken)
    assert len(parts) == len(set(parts)), spoken


def test_screen_keeps_rules_and_full_warning():
    body = ask("Kitna paisa lagega?")
    assert [source["id"] for source in body["sources"]] == ["S6"]
    assert "(नियम S6)" in body["safety_message"]


@pytest.mark.parametrize("question", ["Naksha galat hai to?", "Dadaji ke naam par zameen hai"])
def test_middleman_warning_is_spoken_once(question):
    assert ask(question)["spoken_text"].count("बिचौलिए") == 1


def test_fee_answer_does_not_add_a_second_warning():
    assert ask("Kitna paisa lagega?")["spoken_text"].count("न दें") == 1


def test_gemini_action_repeating_the_answer_is_not_spoken_twice(monkeypatch):
    use_gemini(monkeypatch, {
        "answer": "15 दिन के भीतर प्रपत्र-S2 में आपत्ति जमा करें (S4)।",
        "action_required": "प्रपत्र-S2 में 15 दिन के भीतर आपत्ति जमा करें।",
        "documents_required": ["आपत्ति प्रपत्र"], "sources": ["S4"], "confidence": "supported",
    })
    body = ask("Naksha galat hai to?")
    assert body["spoken_text"].count("आपत्ति जमा करें") == 1
    assert "(S4)" not in body["spoken_text"]
    assert "(S4)" in body["answer"]


def test_only_relevant_rule_is_cited(monkeypatch):
    use_gemini(monkeypatch, {"answer": "आपत्ति दें (S4)।", "sources": ["S4"], "confidence": "supported"})
    assert [source["id"] for source in ask("Naksha galat hai to?")["sources"]] == ["S4"]


def test_glossary_answer_has_no_fee_warning_when_spoken():
    assert "बिचौलिए" not in ask("Khatiyan kya hai?")["spoken_text"]


@pytest.mark.parametrize("text", ["दाखिल-خариج कराएँ (S5)।", "दाखिल-хариж कराएँ (S5)।"])
def test_foreign_script_from_gemini_is_rejected(monkeypatch, text):
    use_gemini(monkeypatch, {"answer": text, "sources": ["S5"], "confidence": "supported"})
    body = ask("Mutation kaise hoga?")
    assert body["engine"] == "offline"
    assert not llm.has_foreign_script(body["answer"])


def test_letter_speech_says_documents_once():
    body = client.post("/api/documents/explain", json={"text": LETTERS[1], "as_of": AS_OF}).json()
    assert body["spoken_text"].count("खतियान") == 1
    assert body["spoken_text"].count("शुल्क") == 1
    assert "18 दिन" in body["spoken_text"]
    assert len(body["documents_required"]) == 5


def test_bill_speech_has_no_land_warning():
    body = client.post("/api/documents/explain", json={"text": LETTERS[3], "as_of": AS_OF}).json()
    assert "बिचौलिए" not in body["spoken_text"]
    assert "बिचौलिए" in body["safety_message"]


def test_record_speech_is_a_summary():
    params = {"district": "Patna", "mauza": "Rampur Kalan", "khata": 45, "as_of": AS_OF}
    body = client.get("/api/records/search", params=params).json()
    assert "JB-0921" not in body["spoken_text"]
    assert "JB-0921" in body["explanation"]
    assert "60 डिसमिल" in body["spoken_text"]
    assert "निधन" in body["spoken_text"]


def test_case_note_is_in_the_language_being_spoken():
    params = {"district": "Nalanda", "mauza": "Chandpur", "khata": 102, "as_of": AS_OF}
    hindi = client.get("/api/records/search", params=params).json()
    assert "MC-2026-0312 (4 महीने से लंबित)" in hindi["spoken_text"]
    assert "pending since" not in hindi["spoken_text"]
    english = client.get("/api/records/search", params={**params, "lang": "en"}).json()
    assert "MC-2026-0312 (pending for 4 months)" in english["spoken_text"]
