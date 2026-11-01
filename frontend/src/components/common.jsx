import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, FileText, Loader2, RefreshCw, ShieldAlert, ShieldCheck, Square, Volume2 } from 'lucide-react';
import { useLanguage } from '../i18n';

export function PageHeader({ title, intro }) {
  return (
    <header className="text-center max-w-3xl mx-auto space-y-2.5 mb-8 sm:mb-10 px-2">
      <h1 className="text-2xl sm:text-4xl font-black text-stone-900 tracking-tight leading-tight">
        {title}
      </h1>
      {intro && (
        <p className="text-stone-600 text-xs sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
          {intro}
        </p>
      )}
    </header>
  );
}

export function SourceChips({ sources, onSelectRule }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1" aria-label={t.source}>
      <span className="text-xs font-bold uppercase tracking-wider text-stone-500">{t.source}:</span>
      {(!sources || sources.length === 0) ? (
        <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 border border-stone-300">
          {t.noSource}
        </span>
      ) : (
        sources.map((source) => (
          <button
            key={source.id}
            type="button"
            onClick={() => onSelectRule && onSelectRule(source.id)}
            title={source.text}
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
              onSelectRule
                ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 cursor-pointer'
                : 'bg-stone-100 text-stone-800 border border-stone-200 cursor-default'
            }`}
          >
            <span>{source.label || `नियम ${source.id}`}</span>
          </button>
        ))
      )}
    </div>
  );
}

export function SafetyNote({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 text-amber-950 text-xs sm:text-sm font-medium leading-relaxed">
      <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function DocumentList({ documents, title, columns = 1 }) {
  const { t } = useLanguage();
  if (!documents || documents.length === 0) return null;
  return (
    <div className="space-y-2">
      {title && (
        <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
          {title}
        </div>
      )}
      <ul className={columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-2' : 'space-y-2'} role="list">
        {documents.map((doc, idx) => (
          <li
            key={idx}
            className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-900 flex items-start gap-2.5 transition-colors hover:bg-emerald-50/40 hover:border-emerald-200"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span className="font-semibold leading-relaxed">{doc}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ListenButton({ speaker, text, id, primary = false, label }) {
  const { lang, t } = useLanguage();
  const speaking = speaker.speakingId === id;
  const loading = speaker.loadingId === id;

  const handleToggle = () => {
    speaker.toggle(text, lang, id);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={speaking ? t.stop : t.listen}
      aria-pressed={speaking}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-sm transition-all focus-visible:ring-2 focus-visible:ring-emerald-700 ${
        primary
          ? 'bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white shadow-xs'
          : speaking
          ? 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
          : 'bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-xs'
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
          <span>{t.preparingVoice}</span>
        </>
      ) : speaking ? (
        <>
          <div className="flex items-center gap-1 h-3.5" aria-hidden="true">
            {[40, 90, 60, 100].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-current rounded-full eq-bar"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <Square className="w-4 h-4 fill-current ml-0.5" aria-hidden="true" />
          <span>{t.stop}</span>
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-current" aria-hidden="true" />
          <span>{label || t.listen}</span>
        </>
      )}
    </button>
  );
}

export function SpeechFailedNote({ speaker }) {
  const { t } = useLanguage();
  if (!speaker.failed) return null;
  return (
    <div
      role="alert"
      className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm font-medium flex items-start gap-2.5"
    >
      <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{t.speechFailed}</span>
    </div>
  );
}

export function LanguageNote({ fallback }) {
  const { lang, t } = useLanguage();
  if (lang !== 'bho' && lang !== 'mag') return null;
  return (
    <p className="text-xs text-stone-500 font-medium">
      {fallback ? t.languageFallback : t.aiTranslationNote}
    </p>
  );
}

export function Spinner({ label }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-10 text-stone-600 text-sm"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="w-6 h-6 animate-spin text-emerald-800" aria-hidden="true" />
      <span className="font-semibold">{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  const { t } = useLanguage();
  return (
    <div
      className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-sm flex flex-wrap items-center justify-between gap-3 shadow-xs"
      role="alert"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <span className="font-semibold leading-relaxed">{message}</span>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg bg-white border border-rose-300 text-rose-900 font-bold text-xs hover:bg-rose-100 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t.retry}</span>
        </button>
      )}
    </div>
  );
}
