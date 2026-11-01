import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CornerDownRight,
  FileText,
  Landmark,
  Mic,
  MicOff,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Square,
  Volume2,
  X
} from 'lucide-react';
import { askQuestion, getSampleQuestions, understandVoice } from '../api';
import { errorMessage, LANGUAGES, useLanguage } from '../i18n';
import { useApiData } from '../useApiData';
import { useSpeaker } from '../useSpeaker';
import SpeechFollow from './SpeechFollow';
import {
  ErrorBox,
  LanguageNote,
  ListenButton,
  PageHeader,
  SourceChips,
  SpeechFailedNote,
  Spinner
} from './common';

const RECOGNITION_LOCALE = { hi: 'hi-IN', en: 'en-IN' };
const MAX_RECORDING_MS = 30000;
const LEVEL_CHECK_MS = 80;
const MIN_SPEECH_LEVEL = 0.01;

const FOLLOW_UPS = {
  heirs: [
    { hi: 'स्व-घोषणा के लिए क्या कोई शुल्क है?', en: 'Is there any fee for the self-declaration?' },
    { hi: 'कागज़ कहाँ जमा करने होंगे?', en: 'Where do I submit the documents?' },
    { hi: 'यदि वंशावली न हो तो क्या करें?', en: 'What if we do not have a vanshavali?' }
  ],
  fee: [
    { hi: 'दादाजी के नाम पर ज़मीन है, क्या करें?', en: "The land is in my grandfather's name, what to do?" },
    { hi: 'यदि कोई पैसे माँगे तो कहाँ शिकायत करें?', en: 'Where to report if someone asks for money?' }
  ],
  map: [
    { hi: 'आपत्ति देने के लिए कितने दिन मिलते हैं?', en: 'How many days do we get to file an objection?' },
    { hi: 'प्रपत्र-S2 कहाँ मिलेगा?', en: 'Where to get Prapatra-S2?' }
  ],
  default: [
    { hi: 'स्व-घोषणा के लिए कौन से कागज़ चाहिए?', en: 'Which documents are needed for the survey?' },
    { hi: 'सर्वे की स्व-घोषणा का कितना पैसा लगता है?', en: 'How much fee is charged for the survey?' },
    { hi: 'नक्शा गलत हो तो क्या करना होगा?', en: 'What to do if the land map is wrong?' }
  ]
};

function getSuggestedFollowUps(text, lang) {
  const isEn = lang === 'en';
  const lower = (text || '').toLowerCase();
  let pool = FOLLOW_UPS.default;
  if (/dadaji|दादा|वारिस|heir|death|निधन|विरासत/i.test(lower)) {
    pool = FOLLOW_UPS.heirs;
  } else if (/paisa|fee|पैसा|शुल्क|रुपये|money/i.test(lower)) {
    pool = FOLLOW_UPS.fee;
  } else if (/naksha|map|नक्शा|सीमा|boundary|विवाद/i.test(lower)) {
    pool = FOLLOW_UPS.map;
  }
  return pool.map((item) => (isEn ? item.en : item.hi));
}

function parseNextSteps(text) {
  if (!text) return [];
  const rawSteps = text
    .split(/(?:\r?\n|(?<=[।?!.])\s+)/)
    .map((s) => s.replace(/^[0-9]+[\.\)\-–]\s*/, '').trim())
    .filter((s) => s.length > 2);
  return rawSteps.length > 0 ? rawSteps : [text.trim()];
}

export default function VoiceQA({ setActiveTab }) {
  const { lang, t } = useLanguage();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isUnderstanding, setIsUnderstanding] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [micError, setMicError] = useState(null);
  const [messages, setMessages] = useState([]);
  const speaker = useSpeaker();
  const samples = useApiData(() => getSampleQuestions(lang), lang);

  const recognitionRef = useRef(null);
  const submitRef = useRef(null);
  const nextId = useRef(1);
  const endRef = useRef(null);
  const recorderRef = useRef(null);
  const recognitionUnavailableRef = useRef(false);

  const activeLangObj = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const fetchAnswer = async (id, question, answerLang, speakWhenDone) => {
    try {
      const answer = await askQuestion(question, answerLang);
      setMessages((current) =>
        current.map((msg) =>
          msg.id === id
            ? { ...msg, answers: { ...msg.answers, [answerLang]: answer }, error: null }
            : msg
        )
      );
      if (speakWhenDone && answer?.spoken_text) {
        speaker.start(answer.spoken_text, answerLang, id);
      }
    } catch (error) {
      setMessages((current) =>
        current.map((msg) => (msg.id === id ? { ...msg, error } : msg))
      );
    }
  };

  const submit = (text, asked = text, detected = null) => {
    const question = text.trim();
    if (!question) return;
    speaker.stop();
    const id = nextId.current;
    nextId.current += 1;
    setMessages((current) => [
      ...current,
      { id, question, asked, detected, answers: {}, error: null }
    ]);
    setInputText('');
    fetchAnswer(id, asked, lang, true);
  };
  submitRef.current = submit;

  const retry = (message) => {
    setMessages((current) =>
      current.map((item) => (item.id === message.id ? { ...item, error: null } : item))
    );
    fetchAnswer(message.id, message.asked, lang, false);
  };

  useEffect(() => {
    speaker.stop();
    messages
      .filter((message) => !message.answers[lang] && !message.error)
      .forEach((message) => {
        fetchAnswer(message.id, message.asked, lang, false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition || !RECOGNITION_LOCALE[lang]) return undefined;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = RECOGNITION_LOCALE[lang];
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const transcript = results.map((result) => result[0].transcript).join('');
      setInputText(transcript);
      if (results.every((result) => result.isFinal)) submitRef.current(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') setMicError('micDenied');
      else if (event.error === 'no-speech') setMicError('micNoSpeech');
      else if (event.error === 'network') {
        recognitionUnavailableRef.current = true;
        setMicError('micRetry');
      } else {
        setMicError('micFailed');
      }
    };
    recognition.onend = () => {
      setIsListening(false);
      setAudioLevel(0);
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.abort();
      recognitionRef.current = null;
      setIsListening(false);
      setAudioLevel(0);
    };
  }, [lang]);

  useEffect(() => {
    if (messages.length > 0) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages.length]);

  const startRecording = async (recordingLang) => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMicError('micUnsupported');
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      setMicError(error.name === 'NotFoundError' ? 'micNoDevice' : 'micDenied');
      return;
    }

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    let audioCtx;
    let analyser;
    let timer;
    let loudest = 0;
    try {
      audioCtx = new AudioContext();
      analyser = audioCtx.createAnalyser();
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const dataArr = new Float32Array(analyser.fftSize);
      timer = setInterval(() => {
        analyser.getFloatTimeDomainData(dataArr);
        const power = dataArr.reduce((sum, s) => sum + s * s, 0) / dataArr.length;
        const rms = Math.sqrt(power);
        loudest = Math.max(loudest, rms);
        setAudioLevel(Math.min(100, Math.round(rms * 400)));
      }, LEVEL_CHECK_MS);
    } catch {
      // Audio visualizer fallback
    }

    const maxTimer = setTimeout(() => recorder.stop(), MAX_RECORDING_MS);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      clearTimeout(maxTimer);
      if (timer) clearInterval(timer);
      if (audioCtx) audioCtx.close().catch(() => {});
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      setIsListening(false);
      setAudioLevel(0);

      if (recorder.discard) return;
      if (loudest < MIN_SPEECH_LEVEL) {
        setMicError('micNoSpeech');
        return;
      }

      setIsUnderstanding(true);
      try {
        const heard = await understandVoice(new Blob(chunks, { type: recorder.mimeType }), recordingLang);
        submitRef.current(heard.transcript, heard.normalized_question, heard.detected_language);
      } catch (err) {
        setMicError(errorMessage(err, t));
      } finally {
        setIsUnderstanding(false);
      }
    };

    recorderRef.current = recorder;
    recorder.start();
    setIsListening(true);
  };

  const toggleListening = () => {
    setMicError(null);
    if (isUnderstanding) return;
    if (recorderRef.current) {
      recorderRef.current.stop();
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    speaker.stop();
    setInputText('');
    if (!recognitionRef.current || recognitionUnavailableRef.current) {
      startRecording(lang);
      return;
    }
    try {
      recognitionRef.current.start();
    } catch {
      // Already running
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    submit(inputText);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
      <PageHeader
        title={t.askTitle}
        intro={t.askIntro}
      />

      {/* Main Tactile Voice Hub */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-sm mb-6 sm:mb-8 space-y-5 sm:space-y-6">
        {/* Interaction Card Top Bar */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-stone-800">
              {t.voiceTitle || (lang === 'en' ? 'Ask by Voice' : 'अपनी बात बोलकर पूछें')}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-bold flex-shrink-0">
            <span>{activeLangObj.label}</span>
          </div>
        </div>

        {/* Point 2: Central Tactile Mic Area with Prominent Focus & Animation */}
        <div className="flex flex-col items-center justify-center py-3 sm:py-5 space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Ambient Pulse Ring when Active / Listening */}
            <div
              className={`absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full transition-all duration-500 pointer-events-none ${
                isListening
                  ? 'bg-rose-500/20 scale-125 animate-ping'
                  : speaker.active
                  ? 'bg-emerald-500/20 scale-110 animate-pulse'
                  : 'bg-emerald-50/70 scale-95'
              }`}
            />
            {isListening && (
              <div className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-rose-500/15 animate-pulse pointer-events-none" />
            )}

            {/* Tactile Microphone Button (Prominent & Focal) */}
            <button
              type="button"
              onClick={toggleListening}
              aria-label={isListening ? t.micStop : t.micStart}
              aria-pressed={isListening}
              className={`relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center text-white transition-all shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-700 active:scale-95 ${
                isListening
                  ? 'bg-rose-700 hover:bg-rose-800 ring-4 ring-rose-400/40 ring-offset-4 ring-offset-white'
                  : speaker.active
                  ? 'bg-emerald-800 hover:bg-emerald-900 ring-4 ring-emerald-400/40'
                  : 'bg-emerald-800 hover:bg-emerald-900 hover:scale-105 shadow-lg'
              }`}
            >
              {isListening ? (
                <MicOff className="w-9 h-9 sm:w-11 sm:h-11 text-rose-100" />
              ) : (
                <Mic className="w-9 h-9 sm:w-11 sm:h-11 text-emerald-100" />
              )}
              <span className="text-[11px] sm:text-xs font-black mt-1 tracking-wider uppercase">
                {isListening ? (lang === 'en' ? 'Stop' : 'रोकें') : (lang === 'en' ? 'Speak' : 'बोलें')}
              </span>
            </button>
          </div>

          {/* Point 2: Visible Status Banner & Audio Waveform Visualizer */}
          {isListening && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm font-bold shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                <span>{lang === 'en' ? 'Listening... Speak now' : 'सुन रहे हैं... कृपया बोलें'}</span>
                <div className="flex items-center gap-1 h-3.5 ml-1">
                  {[35, 85, 55, 100, 65, 90, 45].map((base, i) => (
                    <span
                      key={i}
                      className="w-1 bg-rose-600 rounded-full transition-all duration-100"
                      style={{
                        height: `${Math.max(25, Math.min(100, base * (audioLevel ? audioLevel / 45 : 1)))}%`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Point 2: Obvious Stop-Recording Button Control */}
              <button
                type="button"
                onClick={toggleListening}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white text-xs sm:text-sm font-bold shadow-sm transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'en' ? 'Stop recording' : 'बोलना समाप्त करें (Stop)'}</span>
              </button>
            </div>
          )}

          {/* Point 2: Display Recognized Question in Real Time */}
          {isListening && inputText && (
            <div className="w-full max-w-lg p-3 sm:p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-900 text-xs sm:text-sm text-center font-medium shadow-2xs">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-800 mb-0.5">
                {lang === 'en' ? 'Recognizing question:' : 'पहचाना जा रहा सवाल:'}
              </div>
              <div className="font-semibold text-stone-900">"{inputText}"</div>
            </div>
          )}

          {isUnderstanding && (
            <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold shadow-2xs">
              <Spinner label="" />
              <span>{lang === 'en' ? 'Processing your question...' : 'आपके सवाल को समझ रहे हैं...'}</span>
            </div>
          )}

          {/* Reading Aloud Indicator */}
          {speaker.active && (
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-stone-800 text-xs font-semibold">
              <Volume2 className="w-4 h-4 text-emerald-700 animate-pulse flex-shrink-0" />
              <span className="truncate">{t.speakingNow}</span>
              <button
                type="button"
                onClick={() => speaker.stop()}
                className="ml-2 text-xs font-bold underline text-emerald-800 hover:text-emerald-950 flex-shrink-0"
              >
                {t.stop}
              </button>
            </div>
          )}

          {!isListening && !isUnderstanding && (
            <p className="text-xs sm:text-sm font-semibold text-stone-700 text-center max-w-md px-2">
              {t.micHelpIdle || (lang === 'en' ? 'Tap mic to speak, or write below' : 'माइक दबाकर बोलें, या नीचे लिखें')}
            </p>
          )}

          {micError && (
            <div className="w-full max-w-xl">
              <ErrorBox message={t[micError] || micError} />
            </div>
          )}
        </div>

        {/* Suggested Question Chips */}
        {samples.data && (
          <div className="pt-2 border-t border-stone-100">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-2">
              {t.tryAsking}:
            </div>
            <div className="flex flex-wrap gap-2">
              {samples.data.samples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => submit(sample)}
                  className="px-3.5 py-2 min-h-[44px] rounded-xl bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-200 hover:border-emerald-300 text-xs sm:text-sm font-semibold transition-colors text-left"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Point 2: Typing Available as an Alternative */}
        <form onSubmit={handleSubmit} className="pt-2 flex flex-row items-center gap-2.5">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              maxLength={1000}
              placeholder={t.placeholder || (lang === 'en' ? 'Type your question here...' : 'या यहाँ अपना सवाल लिखें...')}
              aria-label={t.placeholder}
              className="w-full px-4 py-3 min-h-[46px] rounded-xl border border-stone-300 bg-stone-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs sm:text-base text-stone-900 placeholder:text-stone-400 font-medium transition-all"
            />
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
                aria-label="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isUnderstanding}
            className="px-5 py-3 min-h-[46px] rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 shadow-xs flex-shrink-0"
          >
            <span>{t.send}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-6 sm:space-y-8">
        <SpeechFailedNote speaker={speaker} />

        {/* Welcome Callout */}
        {messages.length === 0 && (
          <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>{t.assistant}</span>
            </div>
            <p className="text-stone-800 text-sm sm:text-lg leading-relaxed font-semibold">
              {t.welcome}
            </p>
          </div>
        )}

        {/* Message Exchanges */}
        {messages.map((message) => {
          const answer = message.answers[lang];
          const followUps = getSuggestedFollowUps(message.question, lang);
          const nextSteps = answer ? parseNextSteps(answer.action_required) : [];

          return (
            <div key={message.id} className="space-y-5">
              {/* User Question Balloon */}
              <div className="p-4 sm:p-5 rounded-2xl bg-stone-100 border border-stone-200 ml-auto max-w-[92%] sm:max-w-xl shadow-xs">
                <div className="text-[11px] sm:text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
                  {t.you}
                </div>
                <p className="text-stone-900 text-sm sm:text-base font-bold">{message.question}</p>
                {message.detected && LANGUAGES.some((l) => l.code === message.detected) && (
                  <p className="text-xs text-stone-500 mt-1.5 pt-1.5 border-t border-stone-200">
                    {t.heardAs}: <strong>{LANGUAGES.find((l) => l.code === message.detected).short}</strong> · {t.heardWrong}
                  </p>
                )}
              </div>

              {/* Error State */}
              {message.error && (
                <ErrorBox message={errorMessage(message.error, t)} onRetry={() => retry(message)} />
              )}

              {/* Processing Spinner */}
              {!message.error && !answer && <Spinner label={t.thinking} />}

              {/* Point 1: Upgraded Structured Response Card with Stronger Visual Hierarchy */}
              {answer && (
                <article className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6 sm:space-y-7">
                  
                  {/* Top Bar with Status and Listen */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-stone-800 bg-stone-100 px-3 py-1 rounded-lg border border-stone-200">
                        {t.assistant}
                      </span>
                      {answer.confidence === 'supported' && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{t.answerFound}</span>
                        </span>
                      )}
                      {answer.confidence === 'unsupported' && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900">
                          {t.answerNotFound}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center">
                      <ListenButton
                        speaker={speaker}
                        text={answer.spoken_text}
                        id={message.id}
                        primary
                      />
                    </div>
                  </div>

                  <SpeechFollow speaker={speaker} text={answer.spoken_text} id={message.id} />

                  {/* Point 1.1: Main Answer (Slightly larger, prominent text) */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <span>{t.directAnswer || (lang === 'en' ? 'Direct Answer' : 'सीधा जवाब')}</span>
                    </div>
                    <p className="text-stone-900 text-base sm:text-xl font-bold leading-relaxed">
                      {answer.answer}
                    </p>
                  </div>

                  {/* Point 1.3: Next Steps (Separate, numbered instructions) */}
                  {nextSteps.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                        <span>{lang === 'en' ? 'Next steps to take' : 'आपको क्या करना है (ज़रूरी कदम)'}</span>
                      </div>
                      <div className="space-y-2">
                        {nextSteps.map((step, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-stone-900 flex items-start gap-3 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <p className="text-xs sm:text-sm font-bold text-stone-900 leading-relaxed pt-0.5">
                              {step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Point 1.2: Required Documents (Checklist with more spacing) */}
                  {answer.documents_required && answer.documents_required.length > 0 && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-800 flex-shrink-0" />
                          <span>{lang === 'en' ? 'Required documents to bring' : 'साथ ले जाने वाले ज़रूरी कागज़'}</span>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                          {answer.documents_required.length} {lang === 'en' ? 'documents' : 'कागज़'}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {answer.documents_required.map((doc, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-xl bg-white border border-stone-200 shadow-2xs hover:border-emerald-300 transition-colors flex items-center gap-3 text-xs sm:text-sm font-semibold text-stone-900"
                          >
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 flex-shrink-0" aria-hidden="true" />
                            <span className="leading-snug">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Point 1.5: Warning / Anti-Fraud (Amber background, visually distinct) */}
                  {answer.safety_message && (
                    <div className="p-4 sm:p-4.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-950 flex items-start gap-3 shadow-2xs">
                      <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          {lang === 'en' ? 'Important Safety Advisory:' : 'महत्वपूर्ण सावधानी:'}
                        </div>
                        <p className="text-xs sm:text-sm font-medium leading-relaxed text-amber-950">
                          {answer.safety_message}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Point 1.4: Sources (Distinct smaller source-reference section) */}
                  {answer.confidence !== 'general' && answer.sources && answer.sources.length > 0 && (
                    <div className="p-3 sm:p-3.5 rounded-xl bg-stone-50/80 border border-stone-200/80 space-y-1.5">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        {lang === 'en' ? 'Sample rules used:' : 'उपयोग किए गए नमूना नियम:'}
                      </div>
                      <SourceChips sources={answer.sources} />
                    </div>
                  )}

                  <LanguageNote fallback={answer.language_fallback} />

                  {/* Point 4: Clear Next Actions After the Answer */}
                  <div className="pt-5 border-t border-stone-100 space-y-3.5">
                    <div className="text-xs font-bold text-stone-600 uppercase tracking-wider">
                      {lang === 'en' ? 'What would you like to do next?' : 'आगे क्या करना चाहते हैं?'}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Primary Action (Visually dominant) */}
                      <button
                        type="button"
                        onClick={() => {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          setTimeout(() => toggleListening(), 300);
                        }}
                        className="py-2.5 px-4 min-h-[44px] rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-xs"
                      >
                        <Mic className="w-4 h-4" />
                        <span>{lang === 'en' ? 'Ask a follow-up question' : 'दूसरा सवाल पूछें'}</span>
                      </button>

                      {/* Secondary Action: Listen again */}
                      <button
                        type="button"
                        onClick={() => speaker.toggle(answer.spoken_text, lang, message.id)}
                        className="py-2.5 px-3.5 min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 border border-stone-200"
                      >
                        <Volume2 className="w-4 h-4 text-emerald-800" />
                        <span>{lang === 'en' ? 'Listen again' : 'फिर से सुनें'}</span>
                      </button>

                      {/* Secondary Action: Explain a document */}
                      {setActiveTab && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('paper');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="py-2.5 px-3.5 min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 border border-stone-200"
                        >
                          <FileText className="w-4 h-4 text-stone-600" />
                          <span>{lang === 'en' ? 'Explain a document' : 'कागज़ समझाएँ'}</span>
                        </button>
                      )}

                      {/* Secondary Action: Check land record */}
                      {setActiveTab && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('record');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="py-2.5 px-3.5 min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 border border-stone-200"
                        >
                          <Landmark className="w-4 h-4 text-stone-600" />
                          <span>{lang === 'en' ? 'Check a land record' : 'ज़मीन रिकॉर्ड देखें'}</span>
                        </button>
                      )}
                    </div>

                    {/* Contextual Follow-Up Suggestions */}
                    {followUps.length > 0 && (
                      <div className="pt-2 space-y-2">
                        <div className="text-[11px] sm:text-xs font-bold text-stone-500 flex items-center gap-1">
                          <CornerDownRight className="w-3.5 h-3.5 text-stone-400" />
                          <span>{t.followUpsTitle || (lang === 'en' ? 'Related questions you can ask' : 'संबंधित प्रश्न')}:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {followUps.map((fu, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => submit(fu)}
                              className="text-xs font-semibold px-3 py-1.5 min-h-[38px] rounded-xl bg-stone-50 hover:bg-emerald-50 hover:text-emerald-950 border border-stone-200 hover:border-emerald-300 transition-colors text-stone-700 text-left"
                            >
                              {fu} &rarr;
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </article>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
