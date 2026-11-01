"""Check that every configured Gemini model is available to this API key and really answers.

Run before a demo, from the backend folder:  .venv\\Scripts\\python scripts\\check_models.py
This spends one request per text model. Speech models are only listed, because their daily quota is small.
"""
import platform
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app import config, llm  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")


def main() -> int:
    print(f"Python {platform.python_version()}")
    if not llm.is_enabled():
        print("GEMINI_API_KEY is not set")
        return 1
    available = {model.name.removeprefix("models/") for model in llm._client().models.list()}
    problems = 0

    text_models = {
        "GEMINI_MODEL": config.GEMINI_MODEL,
        "GEMINI_BACKUP_MODEL": config.GEMINI_BACKUP_MODEL,
        **{f"GEMINI_STRONG_MODELS[{index}]": model for index, model in enumerate(config.GEMINI_STRONG_MODELS)},
    }
    for setting, model in text_models.items():
        if model not in available:
            # gemini-flash-latest and similar aliases are not always listed, so try before judging.
            print(f"{setting} = {model}: not in this key's model list")
        start = time.time()
        try:
            llm._generate("Reply with {\"ok\": true}", "Return JSON only.", True, 30, model)
            print(f"{setting} = {model}: works ({time.time() - start:.1f}s)")
        except llm.LLMError as error:
            problems += 1
            reason = "out of quota" if "RESOURCE_EXHAUSTED" in str(error) else str(error)[:120]
            print(f"{setting} = {model}: FAILED, {reason}")

    for index, model in enumerate(config.GEMINI_TTS_MODELS):
        status = "listed, not called to save quota" if model in available else "NOT LISTED"
        problems += model not in available
        print(f"GEMINI_TTS_MODELS[{index}] = {model}: {status}")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
