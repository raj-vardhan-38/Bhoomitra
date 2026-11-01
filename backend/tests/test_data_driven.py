"""New fictional records, notices and rules must work by editing data files alone."""
import json
import shutil

import pytest
from fastapi.testclient import TestClient

from app import ask, knowledge, llm
from app.main import app

client = TestClient(app)
AS_OF = "2026-10-31"
NEW_RECORD = {
    "district": "Siwan", "mauza": "Naya Gaon", "khata_no": 7, "holder": "Meena Kumari",
    "plots": [{"khesra": 5, "area_decimal": 12.5, "type": "orchard (bagicha)"}],
}
NEW_LETTER = """

[LETTER 4]
Office of the Circle Officer, Maharajganj (Siwan)
Notice No. 99/2026   Date: 15-10-2026
Subject: Special Land Survey 2026, Mauza Naya Gaon
Raiyats must submit the self-declaration (Prapatra-S1) with khatiyan at the camp in Panchayat Bhawan by 25-11-2026.
"""


def clear_caches():
    for loader in (knowledge.reference_notes, knowledge.rules, knowledge.land_records, knowledge.sample_letters):
        loader.cache_clear()


@pytest.fixture(autouse=True)
def extended_data(monkeypatch, tmp_path):
    for file in knowledge.DATA_DIR.iterdir():
        shutil.copy(file, tmp_path)
    records = json.loads((tmp_path / "sample_land_records.json").read_text(encoding="utf-8"))
    records["records"].append(NEW_RECORD)
    (tmp_path / "sample_land_records.json").write_text(json.dumps(records), encoding="utf-8")
    with open(tmp_path / "sample_official_letters.txt", "a", encoding="utf-8") as letters:
        letters.write(NEW_LETTER)
    notes = (tmp_path / "land_reference_notes_SIMPLIFIED.md").read_text(encoding="utf-8")
    notes = notes.replace("## SAMPLE FAQ", "Rule S8. Survey camps close at 5 pm.\n\n## SAMPLE FAQ")
    (tmp_path / "land_reference_notes_SIMPLIFIED.md").write_text(notes, encoding="utf-8")

    monkeypatch.setattr(knowledge, "DATA_DIR", tmp_path)
    monkeypatch.setattr(llm, "is_enabled", lambda: False)
    clear_caches()
    yield
    clear_caches()


def test_new_record_with_only_required_fields():
    districts = client.get("/api/records/options").json()["districts"]
    assert "Siwan" in [item["district"] for item in districts]
    response = client.get("/api/records/search", params={"district": "Siwan", "mauza": "Naya Gaon", "khata": 7, "as_of": AS_OF})
    assert response.status_code == 200
    body = response.json()
    assert body["holder"] == "Meena Kumari"
    assert body["total_area_decimal"] == 12.5
    assert body["plots"][0]["type"] == "orchard (bagicha)"
    assert body["pending_actions"] == []
    assert body["last_rent_receipt_year"] is None


def test_new_notice_is_offered_and_explained():
    samples = client.get("/api/documents/samples").json()["samples"]
    new = next(sample for sample in samples if sample["id"] == 4)
    body = client.post("/api/documents/explain", json={"text": new["text"], "as_of": AS_OF}).json()
    assert body["kind"] == "survey_notice"
    assert body["deadline"]["date"] == "2026-11-25"
    assert body["deadline"]["days_remaining"] == 25
    assert body["purpose"] == "Special Land Survey 2026, Mauza Naya Gaon"
    assert "Maharajganj" in body["office"]


@pytest.mark.parametrize("lang", ["hi", "en"])
def test_new_rule_is_listed(lang):
    rules = client.get("/api/rules", params={"lang": lang}).json()["rules"]
    assert rules[-1]["id"] == "S8"
    assert "5 pm" in rules[-1]["text"]


def test_gemini_can_cite_new_rule_but_not_one_that_does_not_exist(monkeypatch):
    monkeypatch.setattr(llm, "is_enabled", lambda: True)
    monkeypatch.setattr(llm, "generate_json", lambda system, prompt, **kwargs: {"answer": "शिविर 5 बजे बंद होता है (S8)।", "sources": ["S8"], "confidence": "supported"})
    body = client.post("/api/ask", json={"question": "Shivir kab band hota hai?"}).json()
    assert [source["id"] for source in body["sources"]] == ["S8"]
    assert "S8" not in body["spoken_text"]

    assert ask._clean_sources(["S9", "S8"]) == ["S8"]


def test_original_data_still_works():
    body = client.post("/api/documents/explain", json={"text": knowledge.sample_letters()[0]["text"], "as_of": AS_OF}).json()
    assert body["document_type"] == "ज़मीन सर्वे का नोटिस"
    assert body["deadline"]["days_remaining"] == 18
    second = client.post("/api/documents/explain", json={"text": knowledge.sample_letters()[1]["text"], "as_of": AS_OF, "lang": "en"}).json()
    assert second["document_type"] == "Mutation letter"
    assert second["purpose"] == "Mutation case MC-2026-0312"
    third = client.post("/api/documents/explain", json={"text": knowledge.sample_letters()[2]["text"], "as_of": AS_OF, "lang": "en"}).json()
    assert "not a land paper" in third["document_type"]
    assert third["purpose"] is None


@pytest.mark.parametrize("lang", ["hi", "en"])
def test_help_has_what_the_brief_lists(lang):
    body = client.get("/api/help", params={"lang": lang}).json()
    assert len(body["camp_checklist"]["items"]) >= 6
    assert len(body["faqs"]) >= 10
