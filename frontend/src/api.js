// All citizen-facing data comes from the backend. Requests go through the Vite proxy.
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new ApiError(null, 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    // FastAPI validation errors arrive as a list, which is not a message for citizens.
    const detail = typeof body?.detail === 'string' ? body.detail : null;
    throw new ApiError(detail, response.status);
  }
  return response.json();
}

const postJson = (path, body) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

export const askQuestion = (question, lang) => postJson('/api/ask', { question, lang });
export const getSampleQuestions = (lang) => request(`/api/ask/samples?lang=${lang}`);
export const getRules = (lang) => request(`/api/rules?lang=${lang}`);
export const getHelp = (lang) => request(`/api/help?lang=${lang}`);
export const getSampleLetters = () => request('/api/documents/samples');
export const explainText = (text, lang) => postJson('/api/documents/explain', { text, lang });
export const understandVoice = (audio, lang) => {
  const form = new FormData();
  form.append('file', audio, 'question.webm');
  form.append('lang', lang);
  return request('/api/voice/understand', { method: 'POST', body: form });
};

export const fetchSpeech = async (text, lang) => {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, lang })
  });
  if (!response.ok) throw new ApiError(null, response.status);
  return response.blob();
};

export const getRecordOptions = () => request('/api/records/options');

export const explainFile = (file, lang) => {
  const form = new FormData();
  form.append('file', file);
  form.append('lang', lang);
  return request('/api/documents/explain-file', { method: 'POST', body: form });
};

export const searchRecord = (district, mauza, khata, lang) => {
  const query = new URLSearchParams({ district, mauza, khata, lang });
  return request(`/api/records/search?${query}`);
};
