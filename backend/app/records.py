"""Land-record lookup. Every fact and pending action is derived in code from the sample records."""
import re
from datetime import date

from . import knowledge
from .knowledge import FRAUD_WARNING

TYPE_LABELS = {
    "hi": {
        "agricultural (dhanhar)": "खेती की ज़मीन (धनहर)",
        "homestead (basauri)": "रहने की ज़मीन (बसौरी)",
        "agricultural": "खेती की ज़मीन",
        "pond (talab)": "तालाब",
    },
    "en": {
        "agricultural (dhanhar)": "Agricultural (dhanhar)",
        "homestead (basauri)": "Homestead (basauri)",
        "agricultural": "Agricultural",
        "pond (talab)": "Pond (talab)",
    },
}

MESSAGES = {
    "hi": {
        "deceased": "रिकॉर्ड में दर्ज धारक का निधन हो चुका है। सर्वे में सभी वारिस वंशावली और मृत्यु प्रमाण पत्र के साथ मिलकर आवेदन करें।",
        "mutation": "दाखिल-खारिज का मामला लंबित है: {case}। इसकी स्थिति जानने के लिए अपने अंचल कार्यालय से संपर्क करें।",
        "receipt": "आखिरी लगान रसीद {year} की है। सर्वे के लिए ताज़ा रसीद चाहिए, इसलिए अंचल कार्यालय से पता कर लें।",
        "father": "पिता: {name}",
        "husband": "पति: {name}",
        "late": "स्वर्गीय {name}",
        "plot": "खेसरा {khesra}, {area} डिसमिल, {type}",
        "plot_separator": "; ",
        "pending_for": r"(\1 महीने से लंबित)",
        "spoken": "खाता नंबर {khata}, मौज़ा {mauza}, {holder} के नाम दर्ज है। इसमें {count} प्लॉट हैं, कुल {total} डिसमिल।",
        "explanation": "यह ज़मीन {district} ज़िले के {circle} अंचल, मौज़ा {mauza} में है। खाता नंबर {khata} {holder} के नाम दर्ज है। "
        "इसमें {count} प्लॉट हैं, कुल {total} डिसमिल: {plots}। जमाबंदी नंबर {jamabandi} है। आखिरी लगान रसीद {year} की है।",
    },
    "en": {
        "deceased": "The recorded holder has died. In the survey, all heirs should apply together with the vanshavali and death certificate.",
        "mutation": "A mutation case is pending: {case}. Contact your Circle Office to find out its status.",
        "receipt": "The last rent receipt is from {year}. The survey needs the latest receipt, so please check with the Circle Office.",
        "father": "Father: {name}",
        "husband": "Husband: {name}",
        "late": "the late {name}",
        "plot": "Khesra {khesra}, {area} decimals, {type}",
        "plot_separator": "; ",
        "pending_for": r"(pending for \1 months)",
        "spoken": "Khata number {khata} in Mauza {mauza} is recorded in the name of {holder}. It has {count} plot(s), {total} decimals in total.",
        "explanation": "This land is in Mauza {mauza}, {circle} circle, {district} district. Khata number {khata} is recorded in the name of {holder}. "
        "It has {count} plot(s), {total} decimals in total: {plots}. The jamabandi number is {jamabandi}. The last rent receipt is from {year}.",
    },
}


def options() -> list[dict]:
    """District -> mauza -> khata tree for the cascading dropdowns."""
    tree: dict[str, dict[str, list[int]]] = {}
    for record in knowledge.land_records():
        tree.setdefault(record["district"], {}).setdefault(record["mauza"], []).append(record["khata_no"])
    return [
        {"district": district, "mauzas": [{"mauza": mauza, "khatas": sorted(khatas)} for mauza, khatas in mauzas.items()]}
        for district, mauzas in tree.items()
    ]


def find(district: str, mauza: str, khata_no: int) -> dict | None:
    for record in knowledge.land_records():
        if (
            record["district"].casefold() == district.strip().casefold()
            and record["mauza"].casefold() == mauza.strip().casefold()
            and record["khata_no"] == khata_no
        ):
            return record
    return None


def _case_text(case: str, lang: str) -> str:
    """The sample data says "(pending since 4 months)" in English, which would be read out inside a Hindi sentence."""
    return re.sub(r"\(pending since (\d+) months?\)", MESSAGES[lang]["pending_for"], case)


def _pending_actions(record: dict, deceased: bool, as_of: date, lang: str) -> list[dict]:
    messages = MESSAGES[lang]
    actions = []
    if deceased:
        actions.append({
            "type": "deceased_holder", "severity": "high",
            "message": messages["deceased"],
            "sources": ["S3", "S2"],
        })
    if record.get("mutation_pending"):
        actions.append({
            "type": "mutation_pending", "severity": "high",
            "message": messages["mutation"].format(case=_case_text(record.get("mutation_case", ""), lang)),
            "sources": ["S5"],
        })
    receipt_year = record.get("last_rent_receipt_year")
    if receipt_year and receipt_year < as_of.year:
        actions.append({
            "type": "old_rent_receipt", "severity": "medium" if as_of.year - receipt_year > 1 else "info",
            "message": messages["receipt"].format(year=receipt_year),
            "sources": ["S2"],
        })
    return actions


def explain(record: dict, as_of: date | None = None, lang: str = "hi") -> dict:
    as_of = as_of or date.today()
    messages = MESSAGES[lang]
    holder = record["holder"].replace("(late)", "").strip()
    deceased = "(late)" in record["holder"]
    if record.get("father"):
        relation = messages["father"].format(name=record["father"])
    elif record.get("father_or_husband"):
        relation = messages["husband"].format(name=record["father_or_husband"].replace(" (husband)", ""))
    else:
        relation = None
    plots = [{**plot, "type": TYPE_LABELS[lang].get(plot["type"], plot["type"])} for plot in record["plots"]]
    total = sum(plot["area_decimal"] for plot in plots)
    actions = _pending_actions(record, deceased, as_of, lang)

    plot_lines = messages["plot_separator"].join(
        messages["plot"].format(khesra=plot["khesra"], area=plot["area_decimal"], type=plot["type"]) for plot in plots
    )
    holder_text = messages["late"].format(name=holder) if deceased else holder
    summary = messages["spoken"].format(khata=record["khata_no"], mauza=record["mauza"], holder=holder_text, count=len(plots), total=total)
    explanation = messages["explanation"].format(
        district=record["district"], circle=record.get("circle", "—"), mauza=record["mauza"], khata=record["khata_no"],
        holder=holder_text,
        count=len(plots), total=total, plots=plot_lines,
        jamabandi=record.get("jamabandi_no", "—"), year=record.get("last_rent_receipt_year", "—"),
    )
    spoken = " ".join([summary, *(action["message"] for action in actions), knowledge.spoken_warning(lang)])
    return {
        "district": record["district"],
        "circle": record.get("circle"),
        "mauza": record["mauza"],
        "thana_no": record.get("thana_no"),
        "khata_no": record["khata_no"],
        "holder": holder,
        "holder_deceased": deceased,
        "relation": relation,
        "plots": plots,
        "total_area_decimal": total,
        "jamabandi_no": record.get("jamabandi_no"),
        "last_rent_receipt_year": record.get("last_rent_receipt_year"),
        "mutation_pending": bool(record.get("mutation_pending")),
        "mutation_case": record.get("mutation_case"),
        "explanation": explanation,
        "pending_actions": actions,
        "safety_message": FRAUD_WARNING[lang],
        "spoken_text": spoken,
        "disclaimer": knowledge.DISCLAIMER[lang],
    }
