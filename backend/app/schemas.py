from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field

Date = date  # Deadline has a field called "date", which would shadow the type inside that class
Lang = Literal["hi", "en", "bho", "mag"]


class AskRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    lang: Lang = "hi"


class Source(BaseModel):
    id: str
    label: str
    text: str


class AskResponse(BaseModel):
    question: str
    answer: str
    action_required: str
    documents_required: list[str]
    sources: list[Source]
    confidence: Literal["supported", "unsupported", "general"]
    safety_message: str
    spoken_text: str
    engine: Literal["gemini", "offline", "guard"]
    disclaimer: str
    language_fallback: bool = False


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=5000)
    lang: Lang = "hi"


class VoiceQuestion(BaseModel):
    transcript: str
    detected_language: str
    normalized_question: str


class ExplainRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    as_of: Optional[date] = None
    lang: Lang = "hi"


class Deadline(BaseModel):
    date: Optional[Date] = None
    date_display: Optional[str] = None
    window_start: Optional[Date] = None
    basis: Optional[str] = None
    days_remaining: Optional[int] = None
    days_overdue: Optional[int] = None
    status: Literal["upcoming", "due_today", "overdue", "unknown"]
    potentially_overdue: bool
    message: str


class DocumentExplanation(BaseModel):
    kind: Literal["survey_notice", "mutation_letter", "other_land", "electricity_bill", "unknown"]
    is_land_document: bool
    document_type: str
    purpose: Optional[str]
    what_it_is: str
    what_to_do: str
    office: Optional[str]
    reference_no: Optional[str]
    case_no: Optional[str]
    letter_date: Optional[date]
    submission_place: Optional[str]
    documents_required: list[str]
    deadline: Deadline
    fee_note: Optional[str]
    consequence: Optional[str]
    sources: list[Source]
    as_of: date
    safety_message: str
    spoken_text: str
    engine: Literal["gemini", "offline"]
    extracted_text: str
    disclaimer: str
    language_fallback: bool = False


class PendingAction(BaseModel):
    type: Literal["deceased_holder", "mutation_pending", "old_rent_receipt"]
    severity: Literal["high", "medium", "info"]
    message: str
    sources: list[str]


class Plot(BaseModel):
    khesra: int
    area_decimal: float
    type: str


class RecordExplanation(BaseModel):
    district: str
    circle: Optional[str]
    mauza: str
    thana_no: Optional[int]
    khata_no: int
    holder: str
    holder_deceased: bool
    relation: Optional[str]
    plots: list[Plot]
    total_area_decimal: float
    jamabandi_no: Optional[str]
    last_rent_receipt_year: Optional[int]
    mutation_pending: bool
    mutation_case: Optional[str]
    explanation: str
    pending_actions: list[PendingAction]
    safety_message: str
    spoken_text: str
    disclaimer: str
    language_fallback: bool = False
