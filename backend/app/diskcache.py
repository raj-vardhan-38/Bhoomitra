"""Keeps Gemini results on disk. Free-tier quotas are small, so a repeated answer must not spend another request."""
import hashlib
from pathlib import Path

from . import config


def _path(namespace: str, key: str) -> Path:
    return Path(config.CACHE_DIR) / namespace / hashlib.sha256(key.encode("utf-8")).hexdigest()


def get_bytes(namespace: str, key: str) -> bytes | None:
    try:
        return _path(namespace, key).read_bytes()
    except OSError:
        return None


def put_bytes(namespace: str, key: str, value: bytes) -> None:
    path = _path(namespace, key)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(value)
    except OSError:
        pass  # A cache that can't be written only costs a repeat request.


def get(namespace: str, key: str) -> str | None:
    value = get_bytes(namespace, key)
    return value.decode("utf-8") if value is not None else None


def put(namespace: str, key: str, value: str) -> None:
    put_bytes(namespace, key, value.encode("utf-8"))
