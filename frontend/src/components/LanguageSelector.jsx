import React from 'react';
import { Check, Mic } from 'lucide-react';
import { LANGUAGES, useLanguage } from '../i18n';

export default function LanguageSelector({ onSpeak }) {
  const { lang, setLang, t } = useLanguage();
  const selected = LANGUAGES.find((language) => language.code === lang) || LANGUAGES[0];

  return (
    <div className="w-full max-w-lg mx-auto rounded-3xl bg-white border border-stone-200 shadow-md overflow-hidden">
      {/* Header with Title and Active Badge */}
      <div className="p-4 sm:p-6 border-b border-stone-100 bg-stone-50/50">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="text-sm sm:text-lg font-extrabold text-stone-900 tracking-tight">
            {t.chooseLanguage}
          </h2>
          <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200 flex-shrink-0">
            {selected.label}
          </span>
        </div>

        {/* 4 Native Language Selection Buttons (Responsive grid) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
          {LANGUAGES.map((language) => {
            const isCurrent = lang === language.code;
            return (
              <button
                key={language.code}
                type="button"
                onClick={() => setLang(language.code)}
                aria-pressed={isCurrent}
                className={`flex items-center justify-between p-2.5 sm:p-3.5 min-h-[46px] rounded-xl border text-left font-bold text-xs sm:text-sm md:text-base transition-all ${
                  isCurrent
                    ? 'border-emerald-700 bg-emerald-50 text-emerald-950 shadow-xs ring-1 ring-emerald-700'
                    : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span className="truncate mr-1">{language.label}</span>
                {isCurrent && (
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Prompt Action Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-white to-stone-50/60 flex flex-col items-center text-center space-y-3">
        <button
          type="button"
          onClick={onSpeak}
          aria-label={t.voiceTitle}
          className="group relative flex flex-col items-center justify-center p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-full"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white flex items-center justify-center shadow-md group-hover:scale-105 active:scale-95 transition-all">
            <Mic className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-100" aria-hidden="true" />
          </div>
        </button>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-stone-900">{t.voiceTitle}</h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-xs mx-auto mt-0.5 leading-relaxed">
            {t.voiceSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={onSpeak}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-xs transition-colors"
        >
          <Mic className="w-4 h-4" />
          <span>{t.actionAsk} ({selected.short})</span>
        </button>
      </div>
    </div>
  );
}
