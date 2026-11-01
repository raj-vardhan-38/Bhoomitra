import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSpeech } from './api';

// The backend's voice comes first because Windows' built-in voices sound robotic. A browser voice is
// only the backup for when the backend can't produce speech, such as with no internet.
// Only Hindi and English can use one, because browsers have no Bhojpuri or Magahi voices.
const SPEECH_LOCALE = { hi: 'hi-IN', en: 'en-IN' };
const VOICE_LOAD_WAIT_MS = 800;

const MAX_CHUNK_LENGTH = 200;
const SERVER_VOICE_RATE = 1.1;
const BROWSER_CHARS_PER_SECOND = 14;

// Chrome silently stops long utterances from online voices, so those are split at sentence ends.
// Each split adds an audible gap, so local voices read in one go and chunks are kept as long as is safe.
const toChunks = (text, voice) => {
  if (voice.localService) return [text];
  const chunks = [];
  text.split(/(?<=[।.!?])\s+/).filter(Boolean).forEach((sentence) => {
    const last = chunks[chunks.length - 1];
    if (last && last.length + sentence.length < MAX_CHUNK_LENGTH) chunks[chunks.length - 1] = `${last} ${sentence}`;
    else chunks.push(sentence);
  });
  return chunks;
};

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

const loadVoices = () => new Promise((resolve) => {
  const speech = synth();
  if (!speech) {
    resolve([]);
    return;
  }
  const voices = speech.getVoices();
  if (voices.length > 0) {
    resolve(voices);
    return;
  }
  const finish = () => {
    speech.removeEventListener('voiceschanged', finish);
    resolve(speech.getVoices());
  };
  speech.addEventListener('voiceschanged', finish);
  setTimeout(finish, VOICE_LOAD_WAIT_MS);
});

const findVoice = (voices, lang) => {
  const locale = SPEECH_LOCALE[lang];
  if (!locale) return null;
  const exact = voices.find((voice) => voice.lang.replace('_', '-').toLowerCase() === locale.toLowerCase());
  return exact || voices.find((voice) => voice.lang.toLowerCase().startsWith(lang)) || null;
};

// A browser with no matching voice reports that it started but stays silent, so the voice
// has to match the script being read.
const speechLanguage = (text, lang) => (lang === 'en' && /[ऀ-ॿ]/.test(text) ? 'hi' : lang);

const audioUrls = new Map();

export function useSpeaker() {
  const [speakingId, setSpeakingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [failed, setFailed] = useState(false);
  const runRef = useRef(0);
  const audioRef = useRef(null);
  // Chrome can garbage-collect an utterance mid-speech and never fire its events.
  const utterancesRef = useRef([]);
  const browserReadingRef = useRef(null);

  const silence = useCallback(() => {
    synth()?.cancel();
    utterancesRef.current = [];
    browserReadingRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    runRef.current += 1;
    silence();
    setSpeakingId(null);
    setLoadingId(null);
  }, [silence]);

  const speakInBrowser = useCallback((text, lang, id, run, voice) => {
    const chunks = toChunks(text, voice);
    const fail = () => {
      if (runRef.current !== run) return;
      setSpeakingId(null);
      setFailed(true);
    };
    const reading = { startedAt: performance.now(), length: text.length, charIndex: null };
    browserReadingRef.current = reading;
    let offset = 0;
    utterancesRef.current = chunks.map((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      const chunkStart = offset;
      offset += chunk.length + 1;
      // Voices that report their position give an exact word. Others are estimated in getPosition.
      utterance.onboundary = (event) => {
        if (event.name === 'word') reading.charIndex = chunkStart + event.charIndex;
      };
      utterance.lang = SPEECH_LOCALE[lang];
      utterance.voice = voice;
      utterance.onerror = (event) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') fail();
      };
      if (index === chunks.length - 1) {
        utterance.onend = () => {
          if (runRef.current === run) setSpeakingId(null);
        };
      }
      return utterance;
    });
    setSpeakingId(id);
    utterancesRef.current.forEach((utterance) => synth().speak(utterance));
  }, []);

  const playFromServer = useCallback(async (text, lang, id, run) => {
    setLoadingId(id);
    setSpeakingId(null);
    try {
      const key = `${lang}:${text}`;
      if (!audioUrls.has(key)) audioUrls.set(key, URL.createObjectURL(await fetchSpeech(text, lang)));
      if (runRef.current !== run) return;
      const audio = new Audio(audioUrls.get(key));
      audio.playbackRate = SERVER_VOICE_RATE;
      audioRef.current = audio;
      audio.onended = () => {
        if (runRef.current === run) setSpeakingId(null);
      };
      await audio.play();
      if (runRef.current !== run) return;
      setLoadingId(null);
      setSpeakingId(id);
    } catch {
      if (runRef.current !== run) return;
      setLoadingId(null);
      setSpeakingId(null);
      const voice = findVoice(await loadVoices(), lang);
      if (runRef.current !== run) return;
      if (voice) speakInBrowser(text, lang, id, run, voice);
      else setFailed(true);
    }
  }, [speakInBrowser]);

  // Where the reading has reached: an exact character if the voice reports it, otherwise a fraction of the
  // text. Server audio gives no word timings, so its position is estimated from how far the audio has played.
  const getPosition = useCallback(() => {
    const audio = audioRef.current;
    if (audio) return Number.isFinite(audio.duration) && audio.duration > 0 ? { fraction: audio.currentTime / audio.duration } : null;
    const reading = browserReadingRef.current;
    if (!reading) return null;
    if (reading.charIndex !== null) return { charIndex: reading.charIndex };
    const elapsedSeconds = (performance.now() - reading.startedAt) / 1000;
    return { fraction: Math.min(1, (elapsedSeconds * BROWSER_CHARS_PER_SECOND) / reading.length) };
  }, []);

  const start = useCallback(async (text, lang, id) => {
    runRef.current += 1;
    const run = runRef.current;
    silence();
    setFailed(false);
    playFromServer(text, speechLanguage(text, lang), id, run);
  }, [playFromServer, silence]);

  const toggle = useCallback((text, lang, id) => {
    if (speakingId === id || loadingId === id) stop();
    else start(text, lang, id);
  }, [loadingId, speakingId, start, stop]);

  useEffect(() => {
    // Voices load asynchronously; asking early makes the browser start loading them.
    synth()?.getVoices();
    return () => {
      runRef.current += 1;
      silence();
    };
  }, [silence]);

  return { speakingId, loadingId, failed, active: speakingId !== null, getPosition, start, stop, toggle };
}
