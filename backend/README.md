# Bhoomitra backend API

Base URL: `http://localhost:8000`. Live schema: `/docs` and `/openapi.json`. CORS allows any `localhost` or `127.0.0.1` port.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Status, and whether Gemini is configured |
| POST | `/api/ask` | Answer a question from the rules |
| GET | `/api/ask/samples` | Sample questions for the Ask screen |
| POST | `/api/voice/understand` | Transcribe a recorded question, detect its language and normalize it to Hindi |
| POST | `/api/tts` | Read text aloud; returns WAV or MP3 audio |
| GET | `/api/rules` | Rules S1–S7 with titles |
| GET | `/api/documents/samples` | The three sample letters, for demo buttons |
| POST | `/api/documents/explain` | Explain pasted text |
| POST | `/api/documents/explain-file` | Explain an upload (image, PDF or `.txt`) |
| GET | `/api/records/options` | District → mauza → khata tree for dropdowns |
| GET | `/api/records/search` | Look up and explain a record |
| GET | `/api/help` | Checklists, FAQs, fraud warnings, glossary |

**Language:** `/api/ask`, `/api/ask/samples`, `/api/rules`, `/api/documents/explain`, `/api/documents/explain-file`, `/api/records/search` and `/api/help` accept `lang`: `hi` (default), `en`, `bho` or `mag`. It goes in the JSON body for POST requests with JSON, as a form field for file uploads, and in the query string for GET requests. Answers, error messages and `spoken_text` all follow it.

Error responses use FastAPI's `{"detail": ...}`. For errors raised by the app, `detail` is a message to show the user, in the requested language. For request-format errors, it's FastAPI's validation list.

## POST /api/ask

```json
{ "question": "Dadaji ke naam par zameen hai, kya karein?" }
```

Returns:

```json
{
  "question": "...",
  "answer": "...",
  "action_required": "...",
  "documents_required": ["वंशावली", "..."],
  "sources": [{ "id": "S3", "label": "नियम S3 (काल्पनिक नमूना)", "text": "..." }],
  "confidence": "supported",
  "safety_message": "...",
  "spoken_text": "...",
  "engine": "gemini",
  "disclaimer": "..."
}
```

- Pass `spoken_text` to speech output. It says each thing once and leaves out rule numbers, which stay on screen in `sources`.
- `confidence: "unsupported"` means `sources` is empty. A land question the rules don't cover gets the fixed "ask the Circle Office" message; an off-topic question gets a polite "I can only help with land" reply.
- `confidence: "general"` is conversation such as a greeting, thanks, "who are you" or "what can you do". It needs no sources.
- `engine` is `gemini`, `offline` (curated answers) or `guard` (out-of-scope topic, refused before reaching Gemini).
- `sources[].id` is `S1`–`S7`, or `GLOSSARY` when the answer only explains a term.

## POST /api/documents/explain

```json
{ "text": "Office of the Circle Officer...", "as_of": "2026-10-31" }
```

`as_of` is optional and defaults to the server's date.

`POST /api/documents/explain-file` takes multipart fields `file` and optional `as_of`. Accepted types: JPEG, PNG, WebP, HEIC, PDF and plain text, up to 10 MB. Images and PDFs need Gemini.

| Status | Meaning |
| --- | --- |
| 413 | File too large |
| 415 | Unsupported file type |
| 422 | Empty file, no readable text, or text that isn't UTF-8 |
| 502 | Gemini couldn't read the file |
| 503 | Gemini isn't configured |

For 502 and 503, offer the paste-text screen instead.

Both endpoints return:

```json
{
  "kind": "survey_notice",
  "is_land_document": true,
  "what_it_is": "...",
  "what_to_do": "...",
  "office": "अंचल अधिकारी कार्यालय, Fatuha (Patna)",
  "reference_no": "214/2026",
  "case_no": null,
  "letter_date": "2026-10-12",
  "submission_place": "पंचायत भवन का शिविर",
  "documents_required": ["..."],
  "deadline": {
    "date": "2026-11-18",
    "date_display": "18 नवंबर 2026",
    "window_start": "2026-10-20",
    "basis": "...",
    "days_remaining": 18,
    "days_overdue": null,
    "status": "upcoming",
    "potentially_overdue": false,
    "message": "अंतिम तारीख 18 नवंबर 2026 है। आज से 18 दिन बाकी हैं।"
  },
  "fee_note": "...",
  "consequence": null,
  "sources": [],
  "as_of": "2026-10-31",
  "safety_message": "...",
  "spoken_text": "...",
  "engine": "offline",
  "extracted_text": "...",
  "disclaimer": "..."
}
```

- `kind`: `survey_notice`, `mutation_letter`, `other_land`, `electricity_bill` or `unknown`.
- `deadline.status`: `upcoming`, `due_today`, `overdue` or `unknown`. Highlight the card when `potentially_overdue` is true.
- `sources` lists the sample rules related to this kind of document.

## GET /api/records/search

Query parameters: `district`, `mauza`, `khata`, and optional `as_of`. District and mauza are case-insensitive. Returns 404 if there's no match.

Key fields: `holder`, `holder_deceased`, `relation`, `plots`, `total_area_decimal`, `mutation_pending`, `mutation_case`, `explanation`, `pending_actions[]` (`type`, `severity`, `message`, `sources`), `spoken_text`.

## Voice

- **Input:** Hindi and English use the browser's Web Speech API. Bhojpuri and Magahi record audio and post it to `/api/voice/understand` (multipart `file`, `lang`). The app shows `transcript` and sends `normalized_question` to `/api/ask`. It also records this way if the browser's speech service is unavailable.
- **Output:** the app calls `/api/tts`, and uses the browser's own voice only if that fails and the browser has one for the language. `/api/tts` uses gTTS first for Hindi and English, because it is quicker and has no daily limit. Bhojpuri and Magahi try each model in `GEMINI_TTS_MODELS` first, then gTTS, which reads them with its Hindi voice. Long silences in Gemini audio are shortened in code.
- **Quota:** the Gemini free tier allowed 10 speech requests per day per model when tested, and `gemini-3.5-flash` also ran out during a day of testing. Limits are per model. `GEMINI_TTS_MODELS` are tried in turn. `GEMINI_STRONG_MODELS` handles voice understanding and dialect translation, with a 12-second limit before dropping to the lighter model, whose Bhojpuri and Magahi are noticeably weaker. Answers, translations and audio are cached in `backend/.cache`. Delete that folder to get fresh answers after changing a prompt.

## Bhojpuri and Magahi

The Hindi answer is built and checked first, then translated, so grounding doesn't change. A translated string is kept only if its numbers and rule IDs match the Hindi exactly; otherwise that string stays in Hindi and `language_fallback` is true. Translations haven't been checked by native speakers.

## How answers stay grounded

1. **Guard:** topics the rules don't cover (land being taken, court, registry costs, compensation) go straight to the fallback, even if they share words with covered topics.
2. **Gemini:** receives only the reference notes and must return JSON. If the main model hasn't replied after 2.5 seconds, or fails, `GEMINI_BACKUP_MODEL` is asked too, and the first good reply is used.
3. **Validation in code:** at least one real rule ID is required, every rule named in the text must be listed as a source, and every number must appear in the cited rules or the question. This covers common spelled-out numbers such as "पाँच सौ", though not every possible wording. Heir answers always include S2 and S6. Text with mixed-in Arabic or Cyrillic letters is rejected. Document lists for S2 and S3 come from code. Failed checks fall through to step 5.
4. **Audit:** a second Gemini call receives only the cited rules and judges whether they really state each claim, catching a rule applied to the wrong subject or two rules combined into a new claim. If it says no or can't run, the answer isn't shown. This is an AI judgement, so it reduces the risk without eliminating it, and it adds about one more request per new answer.
5. **Offline answers:** curated keyword matching, or the "ask the Circle Office" fallback if nothing matches.

Documents work the same way: Python extracts the office, dates, documents and deadline. Gemini writes only `what_it_is` and `what_to_do`, can't change any extracted fact, and its wording passes the same audit against the document.

## Adding your own data

Everything is read from the data folder, so new fictional content needs no code change. Restart the backend afterwards.

- **Records:** add an entry to `sample_land_records.json`. Only `district`, `mauza`, `khata_no`, `holder` and `plots` are required. It appears in the dropdowns automatically.
- **Notices:** add a `[LETTER n]` block to `sample_official_letters.txt`. It appears as a sample button automatically.
- **Rules:** add a `Rule S8. ...` line to `land_reference_notes_SIMPLIFIED.md`. Its Hindi screen text falls back to the English until you add it to `RULES_HI`, though Gemini can still answer from it in Hindi.

To keep your data separate from the starter files, set `BHOOMITRA_DATA_DIR` to another folder holding the same three files.

## Decisions worth knowing for the jury

- **Letter 1 vs Rule S1:** the notice was issued on 12-10-2026, and Rule S1's 30 days would end on 11-11-2026, but the notice itself sets 18-11-2026. The app uses the date in the citizen's own notice, which is also what the acceptance criteria expect.
- **Letter 2:** the 21 days are counted after the letter date, not counting that day (01-10-2026 + 21 = 22-10-2026, so 9 days past on 31-10-2026). The app says this is an assumption, since the days may run from the date of receipt. It says "potentially" overdue and that the case "may" be rejected, never that it was.
- **Records:** explanations come from a code template instead of Gemini, so record facts can't be altered.

## Known limits

- Offline matching uses keywords, so it is less precise than Gemini. Gemini is the primary path whenever a key is set.
- Pasting several letters at once is treated as one document. Explain one at a time.
