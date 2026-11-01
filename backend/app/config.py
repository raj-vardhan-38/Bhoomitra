import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

DATA_DIR = Path(
    os.getenv(
        "BHOOMITRA_DATA_DIR",
        BACKEND_DIR / "data",
    )
)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "").strip() or "gemini-flash-latest"
# Gemini's speed changes with demand (the same model took 1 to 10 seconds when tested), so a slow reply gets a second try.
GEMINI_BACKUP_MODEL = os.getenv("GEMINI_BACKUP_MODEL", "").strip() or "gemini-3.1-flash-lite"
GEMINI_BACKUP_AFTER_SECONDS = float(os.getenv("GEMINI_BACKUP_AFTER_SECONDS", "2.5"))
# The lighter model confused Bhojpuri and Magahi with Hindi when tested, so voice input uses the stronger one.
# Tried before the lighter GEMINI_MODEL. Keep this short: gemini-3.7-flash and 3.8-flash each hung for
# about 18 seconds when tested, which made one voice question take over 80 seconds.
GEMINI_STRONG_MODELS = [
    model.strip()
    for model in (os.getenv("GEMINI_STRONG_MODELS", "").strip() or "gemini-3.5-flash").split(",")
]
# The free tier allows about 10 speech requests per day for each model, so several are tried in turn.
GEMINI_TTS_MODELS = [
    model.strip()
    for model in (
        os.getenv("GEMINI_TTS_MODELS", "").strip()
        or "gemini-3.8-flash-lite-tts,gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts"
    ).split(",")
]
GEMINI_TTS_VOICE = os.getenv("GEMINI_TTS_VOICE", "").strip() or "Kore"
# A strong model gets this long before the lighter model is used instead.
GEMINI_STRONG_TIMEOUT_SECONDS = int(os.getenv("GEMINI_STRONG_TIMEOUT_SECONDS", "12"))
GEMINI_TIMEOUT_SECONDS = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "20"))
CACHE_DIR = os.getenv("BHOOMITRA_CACHE_DIR", BACKEND_DIR / ".cache")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
