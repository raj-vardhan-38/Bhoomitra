from datetime import date
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, Query, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import ask, config, dialect, diskcache, documents, help_content, knowledge, llm, records
from .dialect import base_lang, localize
from .schemas import AskRequest, AskResponse, DocumentExplanation, ExplainRequest, Lang, RecordExplanation, SpeechRequest, VoiceQuestion

app = FastAPI(title="Bhoomitra API", version="1.2.0", description="Grounded land-record assistant. Fictional sample data only.")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_FILE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"}
AUDIO_TYPES = {"audio/webm", "audio/ogg", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/aac", "audio/flac"}
TYPES_BY_SUFFIX = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
    ".heic": "image/heic", ".heif": "image/heif", ".pdf": "application/pdf", ".txt": "text/plain",
}
SPEECH_LANGUAGES = {"hi": "Hindi", "en": "Indian English", **dialect.DIALECTS}

ERRORS = {
    "empty_question": {"hi": "कृपया अपना सवाल बोलें या लिखें।", "en": "Please speak or type your question."},
    "empty_text": {"hi": "कृपया नोटिस की लिखाई डालें।", "en": "Please enter the text of the notice."},
    "too_large": {"hi": "फ़ाइल 10 MB से बड़ी है।", "en": "The file is larger than 10 MB."},
    "empty_file": {"hi": "फ़ाइल खाली है।", "en": "The file is empty."},
    "not_utf8": {"hi": "यह टेक्स्ट फ़ाइल UTF-8 में नहीं है।", "en": "This text file is not in UTF-8."},
    "no_ai": {"hi": "फ़ोटो पढ़ने के लिए AI उपलब्ध नहीं है। कृपया नोटिस की लिखाई पेस्ट करें।", "en": "AI is not available to read photos. Please paste the notice text."},
    "unreadable": {"hi": "फ़ोटो नहीं पढ़ी जा सकी। कृपया नोटिस की लिखाई पेस्ट करें।", "en": "The photo could not be read. Please paste the notice text."},
    "bad_type": {"hi": "केवल फ़ोटो, PDF या टेक्स्ट फ़ाइल डालें।", "en": "Please upload only a photo, PDF or text file."},
    "no_text": {"hi": "इस फ़ाइल में कोई लिखाई नहीं मिली।", "en": "No text was found in this file."},
    "no_record": {"hi": "यह रिकॉर्ड नमूना डेटा में नहीं मिला। कृपया ज़िला, मौज़ा और खाता नंबर जाँचें या अंचल कार्यालय से पूछें।",
                  "en": "This record is not in the sample data. Please check the district, mauza and khata number, or ask the Circle Office."},
    "voice_no_ai": {"hi": "आवाज़ समझने के लिए AI उपलब्ध नहीं है। कृपया लिखकर पूछें।", "en": "AI is not available to understand speech. Please type your question."},
    "voice_failed": {"hi": "आवाज़ समझ नहीं आई। कृपया फिर से बोलें या लिखकर पूछें।", "en": "The speech could not be understood. Please speak again or type your question."},
    "voice_bad_type": {"hi": "यह आवाज़ का सही प्रारूप नहीं है।", "en": "This audio format is not supported."},
    "no_speech": {"hi": "कोई साफ़ आवाज़ सुनाई नहीं दी। कृपया फिर से बोलें।", "en": "No clear speech was heard. Please speak again."},
    "speech_failed": {"hi": "अभी जवाब पढ़कर नहीं सुनाया जा सका। कृपया फिर से कोशिश करें।", "en": "The answer could not be read aloud just now. Please try again."},
}

def _error(key: str, lang: str) -> str:
    return ERRORS[key][base_lang(lang)]


def _file_type(file: UploadFile) -> str:
    """Browsers may add a charset or send no useful type, as often happens with phone photos."""
    content_type = (file.content_type or "").split(";")[0].strip().lower()
    if content_type in ("", "application/octet-stream"):
        return TYPES_BY_SUFFIX.get(Path(file.filename or "").suffix.lower(), content_type)
    return content_type


def _generate_speech(text: str, lang: str) -> bytes | None:
    """gTTS is quicker and has no daily limit but has no dialect voices, so Gemini's limited quota is kept for those."""
    gemini = lambda: llm.synthesize(text)
    free = lambda: llm.fallback_speech(text, lang)
    for generate in (gemini, free) if lang in dialect.DIALECTS else (free, gemini):
        try:
            return generate()
        except llm.LLMError:
            continue
    return None


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "gemini_configured": llm.is_enabled(), "model": config.GEMINI_MODEL, "today": date.today()}


@app.post("/api/ask", response_model=AskResponse)
def ask_question(request: AskRequest) -> dict:
    if not request.question.strip():
        raise HTTPException(422, _error("empty_question", request.lang))
    answer = ask.answer_question(request.question, base_lang(request.lang))
    return localize(answer, request.lang, skip=frozenset({"question"}))


@app.get("/api/ask/samples")
def sample_questions(lang: Lang = "hi") -> dict:
    return {"samples": ask.SAMPLE_QUESTIONS[lang]}


@app.post("/api/voice/understand", response_model=VoiceQuestion)
def understand_voice(file: UploadFile = File(...), lang: Lang = Form("hi")) -> dict:
    data = file.file.read(config.MAX_UPLOAD_BYTES + 1)
    if len(data) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(413, _error("too_large", lang))
    if not data:
        raise HTTPException(422, _error("no_speech", lang))
    file_type = _file_type(file)
    if file_type not in AUDIO_TYPES:
        raise HTTPException(415, _error("voice_bad_type", lang))
    if llm.is_silent(data, file_type):
        raise HTTPException(422, _error("no_speech", lang))
    if not llm.is_enabled():
        raise HTTPException(503, _error("voice_no_ai", lang))
    try:
        result = llm.understand_audio(data, file_type, SPEECH_LANGUAGES[lang])
    except llm.LLMError:
        raise HTTPException(502, _error("voice_failed", lang))
    transcript = str(result.get("transcript") or "").strip()
    question = str(result.get("normalized_question") or "").strip() or transcript
    if not transcript:
        raise HTTPException(422, _error("no_speech", lang))
    return {
        "transcript": transcript,
        "detected_language": str(result.get("detected_language") or "other"),
        "normalized_question": question,
    }


@app.post("/api/tts", responses={200: {"content": {"audio/wav": {}, "audio/mpeg": {}}}})
def text_to_speech(request: SpeechRequest) -> Response:
    if not request.text.strip():
        raise HTTPException(422, _error("empty_text", request.lang))
    # The prefix changed when the spoken instruction was removed, so that audio is never served again.
    key = f"text-only:{request.lang}:{request.text}"
    audio = diskcache.get_bytes("speech", key)
    if audio is None:
        audio = _generate_speech(request.text, request.lang)
        if audio is None:
            raise HTTPException(502, _error("speech_failed", request.lang))
        diskcache.put_bytes("speech", key, audio)
    return Response(content=audio, media_type="audio/wav" if audio[:4] == b"RIFF" else "audio/mpeg")


@app.get("/api/rules")
def list_rules(lang: Lang = "hi") -> dict:
    base = base_lang(lang)
    return localize({"rules": knowledge.localized_rules(base), "disclaimer": knowledge.DISCLAIMER[base]}, lang)


@app.get("/api/documents/samples")
def sample_documents() -> dict:
    return {"samples": knowledge.sample_letters()}


@app.post("/api/documents/explain", response_model=DocumentExplanation)
def explain_text(request: ExplainRequest) -> dict:
    if not request.text.strip():
        raise HTTPException(422, _error("empty_text", request.lang))
    return localize(documents.explain(request.text, request.as_of, base_lang(request.lang)), request.lang)


@app.post("/api/documents/explain-file", response_model=DocumentExplanation)
def explain_file(file: UploadFile = File(...), as_of: Optional[date] = Form(None), lang: Lang = Form("hi")) -> dict:
    data = file.file.read(config.MAX_UPLOAD_BYTES + 1)
    if len(data) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(413, _error("too_large", lang))
    if not data:
        raise HTTPException(422, _error("empty_file", lang))

    file_type = _file_type(file)
    if file_type == "text/plain":
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise HTTPException(422, _error("not_utf8", lang))
    elif file_type in GEMINI_FILE_TYPES:
        if not llm.is_enabled():
            raise HTTPException(503, _error("no_ai", lang))
        try:
            text = llm.transcribe(data, file_type)
        except llm.LLMError:
            raise HTTPException(502, _error("unreadable", lang))
    else:
        raise HTTPException(415, _error("bad_type", lang))

    if not text.strip():
        raise HTTPException(422, _error("no_text", lang))
    return localize(documents.explain(text, as_of, base_lang(lang)), lang)


@app.get("/api/records/options")
def record_options() -> dict:
    return {"districts": records.options()}


@app.get("/api/records/search", response_model=RecordExplanation)
def search_record(
    district: str = Query(min_length=1),
    mauza: str = Query(min_length=1),
    khata: int = Query(ge=1),
    as_of: Optional[date] = None,
    lang: Lang = "hi",
) -> dict:
    record = records.find(district, mauza, khata)
    if not record:
        raise HTTPException(404, _error("no_record", lang))
    return localize(records.explain(record, as_of, base_lang(lang)), lang)


@app.get("/api/help")
def citizen_help(lang: Lang = "hi") -> dict:
    return localize(help_content.content(base_lang(lang)), lang)
