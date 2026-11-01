"""Starter data and the fixed safety wording. Everything the app may quote lives here."""
import json
import re
from functools import lru_cache

from .config import DATA_DIR

UNKNOWN_ANSWER = {
    "hi": "यह जानकारी उपलब्ध नियमों में नहीं है। कृपया अपने अंचल कार्यालय से संपर्क करें।",
    "en": "This information is not in the available rules. Please contact your Circle Office.",
}
UNKNOWN_ACTION = {
    "hi": "पंचायत भवन के शिविर में भी पूछ सकते हैं।",
    "en": "You can also ask at the camp at the Panchayat Bhawan.",
}
FRAUD_WARNING = {
    "hi": "स्व-घोषणा के लिए कोई शुल्क नहीं है, किसी बिचौलिए को पैसे न दें। (नियम S6)",
    "en": "The self-declaration has no fee, so do not pay any middleman. (Rule S6)",
}
# Rule numbers are shown on screen; read aloud they only interrupt the sentence.
RULE_REFERENCE = re.compile(r"\s*\((?:नियम|Rule)?\s*S\d+(?:\s*[,/और]+\s*(?:नियम|Rule)?\s*S\d+)*\)|,?\s*(?:नियम|Rule)\s+S\d+(?:\s+के अनुसार)?", re.I)
ALREADY_WARNED = re.compile(r"न दें|do not pay|don't pay", re.I)
MENTIONS_FEE = re.compile(r"शुल्क|फीस|\bfee\b", re.I)
PAYMENT_WARNING = {"hi": "किसी बिचौलिए को पैसे न दें।", "en": "Do not pay any middleman."}
DISCLAIMER = {
    "hi": "नियम S1–S7 और सभी रिकॉर्ड काल्पनिक नमूना डेटा हैं, असली बिहार सरकार के कानून या असली लोगों का डेटा नहीं। "
    "यह कानूनी सलाह नहीं है। असली जानकारी के लिए अंचल कार्यालय या biharbhumi.bihar.gov.in देखें।",
    "en": "Rules S1–S7 and all records are fictional sample data, not actual Bihar government law or real people's data. "
    "This is not legal advice. For real information, contact the Circle Office or see biharbhumi.bihar.gov.in.",
}
DOCUMENTS_INTRO = {"hi": "ज़रूरी कागज़: ", "en": "Documents needed: "}
SENTENCE_END = {"hi": "।", "en": "."}
LIST_SEPARATOR = ", "

GLOSSARY_SOURCE = "GLOSSARY"

RULE_TITLES = {
    "S1": {"hi": "स्व-घोषणा पत्र (प्रपत्र-S1)", "en": "Self-declaration (Prapatra-S1)"},
    "S2": {"hi": "ज़रूरी कागज़", "en": "Documents to attach"},
    "S3": {"hi": "धारक की मृत्यु होने पर वारिस", "en": "Heirs of a deceased holder"},
    "S4": {"hi": "सीमा विवाद की आपत्ति (प्रपत्र-S2)", "en": "Boundary objection (Prapatra-S2)"},
    "S5": {"hi": "अंतिम रिकॉर्ड और दाखिल-खारिज", "en": "Final record and mutation"},
    "S6": {"hi": "कोई शुल्क नहीं, बिचौलियों से बचें", "en": "No fee, beware of middlemen"},
    "S7": {"hi": "पंचायत भवन में सहायता शिविर", "en": "Help camps at the Panchayat Bhawan"},
}

RULES_HI = {
    "S1": "सर्वे वाले गाँव के हर भू-धारक को गाँव की सूचना के 30 दिन के भीतर प्लॉट के विवरण के साथ स्व-घोषणा पत्र (प्रपत्र-S1) जमा करना है।",
    "S2": "साथ में लगाएँ: खतियान या पुराने रिकॉर्ड की कॉपी, ताज़ा लगान रसीद, घोषणा करने वाले का आधार, और ज़मीन विरासत की हो तो वंशावली।",
    "S3": "यदि रिकॉर्ड में दर्ज धारक की मृत्यु हो चुकी है, तो सभी वारिस वंशावली और मृत्यु प्रमाण पत्र के साथ मिलकर आवेदन कर सकते हैं।",
    "S4": "सीमा के विवाद की आपत्ति गाँव में प्रारूप नक्शा लगने के 15 दिन के भीतर प्रपत्र-S2 में देनी है।",
    "S5": "सर्वे के बाद अंतिम रिकॉर्ड पुराने खतियान की जगह लेगा। दाखिल-खारिज के आवेदन राज्य पोर्टल पर ऑनलाइन होते हैं।",
    "S6": "स्व-घोषणा के लिए कोई शुल्क नहीं है। \"नाम जुड़वाने\" के लिए पैसे माँगने वाले की शिकायत अंचल अधिकारी से करें।",
    "S7": "सहायता शिविर अधिसूचित तारीखों पर पंचायत भवन में लगते हैं।",
}

GLOSSARY = [
    {"term": {"hi": "खतियान", "en": "Khatiyan"}, "pattern": r"khatiyan|khatian|खतियान",
     "meaning": {"hi": "ज़मीन के सर्वे का अधिकार-अभिलेख। इसमें लिखा होता है कि कौन सा प्लॉट किसके पास है, उसका रकबा और प्रकार क्या है।",
                 "en": "The record of rights from a land survey. It shows who holds which plot, and its area and type."}},
    {"term": {"hi": "खाता नंबर", "en": "Khata number"}, "pattern": r"khata|खाता",
     "meaning": {"hi": "रिकॉर्ड में भू-धारक का खाता नंबर।", "en": "The account number of a land holder in the record."}},
    {"term": {"hi": "खेसरा", "en": "Khesra"}, "pattern": r"khesra|khasra|खेसरा|खसरा",
     "meaning": {"hi": "सर्वे के नक्शे पर किसी एक प्लॉट का नंबर।", "en": "The number of a specific plot on the survey map."}},
    {"term": {"hi": "जमाबंदी", "en": "Jamabandi"}, "pattern": r"jamabandi|जमाबंदी",
     "meaning": {"hi": "वर्तमान भू-धारक का रजिस्टर, जिसके नाम पर लगान लिया जाता है।",
                 "en": "The register of the current land holder, in whose name rent is collected."}},
    {"term": {"hi": "दाखिल-खारिज", "en": "Dakhil-kharij (mutation)"}, "pattern": r"dakhil|kharij|mutation|दाखिल|खारिज",
     "meaning": {"hi": "बिक्री, उपहार, बँटवारे या विरासत के बाद रिकॉर्ड में नए धारक का नाम चढ़ाना।",
                 "en": "Updating the record to the new holder's name after sale, gift, partition or inheritance."}},
    {"term": {"hi": "लगान रसीद", "en": "Lagan (rent receipt)"}, "pattern": r"lagan|rent receipt|लगान",
     "meaning": {"hi": "सरकार को दिए गए ज़मीन के लगान की रसीद।", "en": "The receipt for land rent paid to the government."}},
    {"term": {"hi": "एलपीसी", "en": "LPC"}, "pattern": r"\blpc\b|एलपीसी",
     "meaning": {"hi": "भूमि कब्ज़ा प्रमाण पत्र। यह अक्सर कर्ज़ और योजनाओं के लिए माँगा जाता है।",
                 "en": "Land Possession Certificate, often needed for loans and schemes."}},
    {"term": {"hi": "वंशावली", "en": "Vanshavali"}, "pattern": r"vanshavali|vansavali|वंशावली",
     "meaning": {"hi": "परिवार का वंश-वृक्ष, जिससे वारिस दिखाए जाते हैं।", "en": "A family tree, used to show heirs."}},
    {"term": {"hi": "बटाईदार", "en": "Bataidar"}, "pattern": r"bataidar|बटाईदार",
     "meaning": {"hi": "वह किसान जो फ़सल के हिस्से के बदले किसी और की ज़मीन जोतता है।",
                 "en": "A sharecropper who farms someone else's land for a share of the crop."}},
]


@lru_cache
def reference_notes() -> str:
    return (DATA_DIR / "land_reference_notes_SIMPLIFIED.md").read_text(encoding="utf-8")


@lru_cache
def rules() -> dict[str, dict[str, str]]:
    parsed = re.findall(r"^Rule (S\d)\. (.+)$", reference_notes(), flags=re.M)
    return {rule_id: {"id": rule_id, "text_en": text, "text_hi": RULES_HI.get(rule_id, text)} for rule_id, text in parsed}


def for_speech(text: str) -> str:
    return re.sub(r"\s+", " ", RULE_REFERENCE.sub("", text)).strip()


def spoken_warning(lang: str) -> str:
    return for_speech(FRAUD_WARNING[lang])


def localized_rules(lang: str) -> list[dict[str, str]]:
    return [
        {"id": rule["id"], "title": RULE_TITLES.get(rule["id"], {}).get(lang, rule["id"]), "text": rule[f"text_{lang}"]}
        for rule in rules().values()
    ]


@lru_cache
def land_records() -> tuple[dict, ...]:
    data = json.loads((DATA_DIR / "sample_land_records.json").read_text(encoding="utf-8"))
    return tuple(data["records"])


@lru_cache
def sample_letters() -> tuple[dict, ...]:
    raw = (DATA_DIR / "sample_official_letters.txt").read_text(encoding="utf-8")
    parts = re.split(r"^\[LETTER (\d+)\]\s*$", raw, flags=re.M)
    return tuple(
        {"id": int(number), "title": body.strip().splitlines()[0], "text": body.strip()}
        for number, body in zip(parts[1::2], parts[2::2])
    )


def source_details(source_ids: list[str], lang: str = "hi") -> list[dict[str, str]]:
    all_rules = rules()
    details = []
    for source_id in source_ids:
        if source_id == GLOSSARY_SOURCE:
            label = {"hi": "शब्दावली", "en": "Glossary"}[lang]
            text = {"hi": "ज़मीन के रिकॉर्ड के आम शब्द (संदर्भ नोट्स से)।", "en": "Common land-record words (from the reference notes)."}[lang]
            details.append({"id": source_id, "label": label, "text": text})
        else:
            label = {"hi": f"नियम {source_id} (काल्पनिक नमूना)", "en": f"Rule {source_id} (fictional sample)"}[lang]
            details.append({"id": source_id, "label": label, "text": all_rules[source_id][f"text_{lang}"]})
    return details
