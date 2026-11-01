import io
from datetime import date

import pytest
from fastapi.testclient import TestClient

from app import config, knowledge, llm
from app.main import app

client = TestClient(app)
AS_OF = "2026-10-31"
LETTERS = {letter["id"]: letter["text"] for letter in knowledge.sample_letters()}


@pytest.fixture(autouse=True)
def gemini_disabled(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: False)


def use_gemini(monkeypatch, reply):
    def generate(system, prompt):
        if isinstance(reply, Exception):
            raise reply
        return reply

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", generate)


def ask(question):
    response = client.post("/api/ask", json={"question": question})
    assert response.status_code == 200
    return response.json()


def source_ids(body):
    return [source["id"] for source in body["sources"]]


def explain(text):
    response = client.post("/api/documents/explain", json={"text": text, "as_of": AS_OF})
    assert response.status_code == 200
    return response.json()


# Mandatory demo cases, offline
@pytest.mark.parametrize("question", [
    "Hamar dadaji ke naam pe zameen ba, survey mein ka kare ke padi?",
    "Dadaji ke naam par zameen hai, kya karein?",
    "दादाजी के नाम पर ज़मीन है, क्या करें?",
])
def test_heirs(question):
    body = ask(question)
    assert source_ids(body) == ["S3", "S2", "S6"]
    assert "सभी वारिस" in body["answer"]
    assert "कोई शुल्क नहीं" in body["answer"]
    assert {"वंशावली", "मृत्यु प्रमाण पत्र", "आधार कार्ड"} <= set(body["documents_required"])


@pytest.mark.parametrize("question", ["Kitna paisa lagega?", "survey ki fee kitni hai", "कितना पैसा लगेगा?"])
def test_fee(question):
    body = ask(question)
    assert source_ids(body) == ["S6"]
    assert "कोई शुल्क नहीं" in body["answer"]
    assert "बिचौलिए" in body["safety_message"]


@pytest.mark.parametrize("question", ["Naksha galat hai to?", "The land map is wrong", "नक्शा गलत है"])
def test_wrong_map(question):
    body = ask(question)
    assert source_ids(body) == ["S4"]
    assert "15 दिन" in body["answer"]


@pytest.mark.parametrize("question", [
    "Will the government take my land?",
    "Will my land be taken?",
    "Kya sarkar meri zameen le legi?",
    "Land acquisition ka paisa kitna milega?",
    "सरकार मेरी ज़मीन ले लेगी क्या?",
    "Registry me kitna paisa lagega?",
    "Bihar ka mukhyamantri kaun hai?",
])
def test_unknown_questions(question):
    body = ask(question)
    assert body["confidence"] == "unsupported"
    assert body["sources"] == []
    assert body["answer"] == knowledge.UNKNOWN_ANSWER["hi"]
    assert "बिचौलिए" in body["safety_message"]


def test_glossary_definition():
    body = ask("Khatiyan kya hai?")
    assert source_ids(body) == ["GLOSSARY"]
    assert "अधिकार-अभिलेख" in body["answer"]


def test_letter_1():
    body = explain(LETTERS[1])
    assert body["kind"] == "survey_notice"
    assert body["deadline"]["date"] == "2026-11-18"
    assert body["deadline"]["window_start"] == "2026-10-20"
    assert body["deadline"]["days_remaining"] == 18
    assert body["deadline"]["status"] == "upcoming"
    assert body["letter_date"] == "2026-10-12"
    assert "अंचल अधिकारी कार्यालय, Fatuha" in body["office"]
    assert body["submission_place"] == "पंचायत भवन का शिविर"
    assert body["reference_no"] == "214/2026"
    assert len(body["documents_required"]) == 5
    assert body["fee_note"]


def test_letter_2_flagged_without_legal_finding():
    body = explain(LETTERS[2])
    assert body["kind"] == "mutation_letter"
    assert body["case_no"] == "MC-2026-0312"
    assert body["deadline"]["date"] == "2026-10-22"
    assert body["deadline"]["days_overdue"] == 9
    assert body["deadline"]["potentially_overdue"] is True
    assert any("सेल डीड" in document for document in body["documents_required"])
    assert "किया जा सकता है" in body["consequence"]


def test_letter_3_is_not_land():
    body = explain(LETTERS[3])
    assert body["kind"] == "electricity_bill"
    assert body["is_land_document"] is False
    assert "बिजली का बिल" in body["what_it_is"]
    assert body["documents_required"] == []
    assert body["sources"] == []
    assert body["deadline"]["date"] == "2026-10-15"
    assert body["letter_date"] is None


@pytest.mark.parametrize("text,expected,remaining", [
    ("भूमि सर्वे सूचना। दिनांक: १२-१०-२०२६। ३० दिन के भीतर जमा करें।", "2026-11-11", 11),
    ("Land survey notice. Date: 01-11-2026. Submit by 05/11/2026.", "2026-11-05", 5),
    ("भूमि सर्वे। कागज़ 18 नवंबर 2026 तक जमा करें।", "2026-11-18", 18),
])
def test_deadline_formats(text, expected, remaining):
    deadline = explain(text)["deadline"]
    assert deadline["date"] == expected
    assert deadline["days_remaining"] == remaining


def test_no_deadline_and_due_today():
    assert explain("खतियान की कॉपी")["deadline"]["status"] == "unknown"
    body = client.post("/api/documents/explain", json={"text": LETTERS[1], "as_of": "2026-11-18"}).json()
    assert body["deadline"]["status"] == "due_today"


def test_records():
    body = client.get("/api/records/search", params={"district": "patna", "mauza": "Rampur Kalan", "khata": 45, "as_of": AS_OF}).json()
    assert body["holder_deceased"] is True
    assert body["holder"] == "Ram Prasad Yadav"
    assert body["total_area_decimal"] == 60
    assert {"deceased_holder", "old_rent_receipt"} == {action["type"] for action in body["pending_actions"]}

    body = client.get("/api/records/search", params={"district": "Nalanda", "mauza": "Chandpur", "khata": 102, "as_of": AS_OF}).json()
    assert body["mutation_pending"] is True
    assert body["pending_actions"][0]["type"] == "mutation_pending"
    assert "MC-2026-0312" in body["pending_actions"][0]["message"]

    missing = client.get("/api/records/search", params={"district": "Patna", "mauza": "Rampur Kalan", "khata": 46})
    assert missing.status_code == 404


def test_lookups():
    assert len(client.get("/api/records/options").json()["districts"]) == 3
    assert len(client.get("/api/help").json()["faqs"]) >= 5
    assert [rule["id"] for rule in client.get("/api/rules").json()["rules"]] == [f"S{n}" for n in range(1, 8)]
    assert len(client.get("/api/documents/samples").json()["samples"]) == 3
    assert client.get("/api/health").json()["status"] == "ok"


def test_validation():
    assert client.post("/api/ask", json={"question": "   "}).status_code == 422
    assert client.post("/api/documents/explain", json={"text": "  "}).status_code == 422


def upload(content, content_type):
    return client.post("/api/documents/explain-file", files={"file": ("x", io.BytesIO(content), content_type)}, data={"as_of": AS_OF})


def test_file_uploads(monkeypatch):
    response = upload(LETTERS[1].encode(), "text/plain")
    assert response.json()["deadline"]["days_remaining"] == 18
    assert upload(b"x", "application/zip").status_code == 415
    assert upload(b"", "text/plain").status_code == 422
    assert upload(b"image", "image/png").status_code == 503

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "transcribe", lambda data, mime_type: LETTERS[2])
    monkeypatch.setattr(llm, "generate_json", lambda system, prompt: {"what_it_is": "दाखिल-खारिज का पत्र", "what_to_do": "कागज़ दें"})
    body = upload(b"image", "image/png").json()
    assert body["engine"] == "gemini"
    assert body["deadline"]["days_overdue"] == 9

    def fail(data, mime_type):
        raise llm.LLMError("down")

    monkeypatch.setattr(llm, "transcribe", fail)
    assert upload(b"image", "image/png").status_code == 502


def stub_models(monkeypatch, working_model, reply):
    """Every model but `working_model` fails, like one that has run out of quota."""
    tried = []

    def generate(contents, system, json_mode, timeout_seconds, model=None):
        tried.append(model)
        if model != working_model:
            raise llm.LLMError("RESOURCE_EXHAUSTED")
        return reply

    monkeypatch.setattr(config, "GEMINI_MODEL", "main")
    monkeypatch.setattr(config, "GEMINI_STRONG_MODELS", ["strong"])
    monkeypatch.setattr(config, "GEMINI_BACKUP_MODEL", "backup")
    monkeypatch.setattr(llm, "_generate", generate)
    return tried


def test_reading_a_photo_falls_back_when_a_model_is_out_of_quota(monkeypatch):
    tried = stub_models(monkeypatch, "backup", " Notice text ")
    assert llm.transcribe(b"image", "image/png") == "Notice text"
    assert tried == ["main", "strong", "backup"]


def test_reading_a_photo_fails_only_when_every_model_fails(monkeypatch):
    tried = stub_models(monkeypatch, None, "")
    with pytest.raises(llm.LLMError):
        llm.transcribe(b"image", "image/png")
    assert tried == ["main", "strong", "backup"]


def test_reading_a_photo_tries_a_shared_model_once(monkeypatch):
    tried = stub_models(monkeypatch, None, "")
    monkeypatch.setattr(config, "GEMINI_BACKUP_MODEL", "main")
    with pytest.raises(llm.LLMError):
        llm.transcribe(b"image", "image/png")
    assert tried == ["main", "strong"]


@pytest.mark.parametrize("heading", ["विद्युत बिल", "साउथ बिहार पावर डिस्ट्रीब्यूशन कम्पनी लिमिटेड", "उपभोक्ता संख्या: 1029384756"])
def test_hindi_electricity_bill_with_land_words_is_not_a_land_paper(heading):
    text = f"{heading}\nअंचल: AURANGABAD\nसुपुर्द कार्यालय: AURANGABAD\nबिल राशि 650.00 का भुगतान 10/09/2019 तक करें"
    body = client.post("/api/documents/explain", json={"text": text, "as_of": AS_OF}).json()
    assert body["kind"] == "electricity_bill"
    assert body["is_land_document"] is False
    assert "बिजली का बिल" in body["what_it_is"]
    assert "650" in body["what_it_is"]


def test_hindi_reply_is_not_used_when_english_was_asked_for(monkeypatch):
    use_gemini(monkeypatch, {"what_it_is": "यह आपका बिजली का बिल है।", "what_to_do": "बिल का भुगतान करें।"})
    body = client.post("/api/documents/explain", json={"text": "विद्युत बिल\nबिल राशि 650", "as_of": AS_OF, "lang": "en"}).json()
    assert body["engine"] == "offline"
    assert body["what_it_is"].startswith("This is not a land notice")


def test_understanding_speech_reaches_the_backup_model(monkeypatch):
    tried = stub_models(monkeypatch, "backup", '{"transcript": "सवाल"}')
    assert llm.understand_audio(b"audio", "audio/webm", "Hindi")["transcript"] == "सवाल"
    assert tried == ["strong", "main", "backup"]


# Checks applied to Gemini output
def test_gemini_answer_gets_completed_sources_and_canonical_documents(monkeypatch):
    use_gemini(monkeypatch, {
        "answer": "सभी वारिस मिलकर आवेदन करें (नियम S3)।", "action_required": "", "documents_required": ["वंशावली"],
        "sources": ["Rule S3"], "confidence": "supported",
    })
    body = ask("Dadaji ke naam par zameen hai")
    assert body["engine"] == "gemini"
    assert source_ids(body) == ["S3", "S2", "S6"]
    assert "मृत्यु प्रमाण पत्र" in body["documents_required"]


def test_gemini_unsupported_gives_fixed_fallback(monkeypatch):
    use_gemini(monkeypatch, {"answer": "शायद हाँ", "sources": [], "confidence": "unsupported"})
    body = ask("Kitna paisa lagega?")
    assert body["answer"] == knowledge.UNKNOWN_ANSWER["hi"]
    assert body["engine"] == "gemini"


@pytest.mark.parametrize("reply", [
    {"answer": "शुल्क 500 रुपये है (नियम S6)।", "sources": ["S6"], "confidence": "supported"},
    {"answer": "कोई शुल्क नहीं है।", "sources": ["S9"], "confidence": "supported"},
    {"answer": "कोई शुल्क नहीं है।", "sources": [], "confidence": "supported"},
    {"answer": "", "sources": ["S6"], "confidence": "supported"},
    {"sources": "S6", "confidence": "supported"},
    llm.LLMError("network down"),
])
def test_bad_gemini_output_falls_back_offline(monkeypatch, reply):
    use_gemini(monkeypatch, reply)
    body = ask("Kitna paisa lagega?")
    assert body["engine"] == "offline"
    assert source_ids(body) == ["S6"]
    assert "500" not in body["answer"]


def test_guard_never_calls_gemini(monkeypatch):
    def fail(system, prompt):
        raise AssertionError("Gemini must not be called")

    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", fail)
    assert ask("Will the government take my land?")["engine"] == "guard"


def test_gemini_cannot_change_document_facts(monkeypatch, tmp_path):
    use_gemini(monkeypatch, {"what_it_is": "सर्वे का नोटिस", "what_to_do": "कागज़ जमा करें"})
    body = explain(LETTERS[1])
    assert body["engine"] == "gemini"
    assert body["deadline"]["days_remaining"] == 18

    monkeypatch.setattr(config, "CACHE_DIR", tmp_path / "empty")  # The first answer is cached, as it should be.
    use_gemini(monkeypatch, {"what_it_is": "सर्वे का नोटिस", "what_to_do": "25 दिसंबर तक जमा करें"})
    assert explain(LETTERS[1])["engine"] == "offline"


def test_default_as_of_is_today():
    body = client.post("/api/documents/explain", json={"text": LETTERS[1]}).json()
    assert body["as_of"] == date.today().isoformat()


# Found by testing against live Gemini
@pytest.mark.parametrize("question", ["Form file lekar kahan jaun?", "Sale letter aaya hai, kya karun?", "Machine se form bharna hai"])
def test_guard_does_not_block_ordinary_questions(question):
    assert ask(question)["engine"] != "guard"


@pytest.mark.parametrize("answer", [
    "शुल्क पाँच सौ रुपये है (नियम S6)।",
    "शुल्क दस हज़ार रुपये है (नियम S6)।",
    "The fee is five hundred rupees (Rule S6).",
    "शुल्क 5 रुपये है (नियम S6)।",
])
def test_spelled_or_borrowed_numbers_are_rejected(monkeypatch, answer):
    use_gemini(monkeypatch, {"answer": answer, "sources": ["S6"], "confidence": "supported"})
    assert ask("Kitna paisa lagega?")["engine"] == "offline"


def test_spelled_number_from_the_rules_is_allowed(monkeypatch):
    use_gemini(monkeypatch, {"answer": "पंद्रह दिन के भीतर आपत्ति दें (नियम S4)।", "sources": ["S4"], "confidence": "supported"})
    assert ask("Naksha galat hai to?")["engine"] == "gemini"


def test_dasta_word_is_not_read_as_a_number(monkeypatch):
    use_gemini(monkeypatch, {"answer": "दस्तावेज़ लगाएँ (नियम S2)।", "sources": ["S2"], "confidence": "supported"})
    assert ask("Kagaz kya chahiye?")["engine"] == "gemini"


@pytest.mark.parametrize("content_type,filename", [("text/plain; charset=utf-8", "x.txt"), ("application/octet-stream", "notice.TXT"), ("", "notice.txt")])
def test_upload_type_detection(content_type, filename):
    response = client.post(
        "/api/documents/explain-file",
        files={"file": (filename, io.BytesIO(LETTERS[1].encode()), content_type)}, data={"as_of": AS_OF},
    )
    assert response.status_code == 200
    assert response.json()["deadline"]["days_remaining"] == 18


def test_short_month_names():
    assert explain("Land survey notice. Submit by 18 Nov 2026.")["deadline"]["date"] == "2026-11-18"


# English
def ask_en(question):
    return client.post("/api/ask", json={"question": question, "lang": "en"}).json()


def has_devanagari(text):
    return any("ऀ" <= char <= "ॿ" for char in text)


@pytest.mark.parametrize("question,sources", [
    ("The land is still in my grandfather's name", ["S3", "S2", "S6"]),
    ("How much is the survey fee?", ["S6"]),
    ("The land map is wrong", ["S4"]),
    ("Dadaji ke naam par zameen hai", ["S3", "S2", "S6"]),
])
def test_english_answers(question, sources):
    body = ask_en(question)
    assert source_ids(body) == sources
    assert not has_devanagari(body["spoken_text"])
    assert not has_devanagari(" ".join(body["documents_required"]))


def test_english_unknown():
    body = ask_en("Will the government take my land?")
    assert body["answer"] == knowledge.UNKNOWN_ANSWER["en"]
    assert not has_devanagari(body["spoken_text"])


@pytest.mark.parametrize("letter,kind", [(1, "survey_notice"), (2, "mutation_letter"), (3, "electricity_bill")])
def test_english_letters(letter, kind):
    response = client.post("/api/documents/explain", json={"text": LETTERS[letter], "as_of": AS_OF, "lang": "en"})
    body = response.json()
    assert body["kind"] == kind
    assert not has_devanagari(body["spoken_text"])
    assert not has_devanagari(body["deadline"]["message"])


def test_english_records_help_rules():
    body = client.get("/api/records/search", params={"district": "Patna", "mauza": "Rampur Kalan", "khata": 45, "as_of": AS_OF, "lang": "en"}).json()
    assert not has_devanagari(body["spoken_text"])
    assert body["plots"][0]["type"] == "Agricultural (dhanhar)"
    assert not has_devanagari(str(client.get("/api/help", params={"lang": "en"}).json()))
    assert not has_devanagari(str(client.get("/api/rules", params={"lang": "en"}).json()))
    assert not has_devanagari(str(client.get("/api/ask/samples", params={"lang": "en"}).json()))
    missing = client.get("/api/records/search", params={"district": "X", "mauza": "Y", "khata": 1, "lang": "en"})
    assert not has_devanagari(missing.json()["detail"])


def test_invalid_language_rejected():
    assert client.post("/api/ask", json={"question": "x", "lang": "fr"}).status_code == 422
