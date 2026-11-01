import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, CheckSquare, FileText, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../i18n';

const STORAGE_KEY = 'bhoomitra-camp-checklist';

const readTicks = () => {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
};

export default function CampChecklist({ checklist }) {
  const { t } = useLanguage();
  const [ticks, setTicks] = useState(readTicks);

  const items = checklist?.items || [];
  const total = items.length;
  const done = items.filter((_, idx) => ticks.includes(idx)).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggle = (index) => {
    const next = ticks.includes(index)
      ? ticks.filter((item) => item !== index)
      : [...ticks, index];
    setTicks(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable fallback
    }
  };

  const mandatoryItems = items.slice(0, 4);
  const conditionalItems = items.slice(4);

  return (
    <section className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5 sm:space-y-6">
      {/* Title & Progress Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-stone-100 pb-4 sm:pb-5">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-800 flex-shrink-0" />
            <span>{checklist.title}</span>
          </h2>
          <p className="text-[11px] sm:text-sm text-stone-600 font-medium mt-0.5 sm:mt-1">
            शिविर या अंचल कार्यालय जाने से पहले इन कागज़ात की जाँच कर लें
          </p>
        </div>

        {/* Progress Pill & Bar */}
        <div className="space-y-1 sm:text-right min-w-[140px] sm:min-w-[180px]">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-stone-100 text-stone-800 text-[11px] sm:text-xs font-semibold border border-stone-200">
            <span>{t.checklistProgress(done, total)}</span>
            <span>({percent}%)</span>
          </div>
          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden border border-stone-200">
            <div
              className="bg-emerald-700 h-full rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Group 1: Mandatory Documents */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-700 flex-shrink-0" />
          <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-950">
            {t.mandatoryDocs}
          </h3>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5" role="list">
          {mandatoryItems.map((item, localIdx) => {
            const globalIdx = localIdx;
            const isChecked = ticks.includes(globalIdx);
            return (
              <li key={globalIdx}>
                <label className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 min-h-[44px] rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
                  isChecked
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50/40 text-stone-800'
                }`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(globalIdx)}
                    className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-emerald-800 flex-shrink-0 cursor-pointer"
                  />
                  <span className={`text-xs sm:text-base font-semibold leading-relaxed ${
                    isChecked ? 'line-through opacity-75' : ''
                  }`}>
                    {item}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Group 2: Conditional Documents */}
      {conditionalItems.length > 0 && (
        <div className="space-y-2.5 sm:space-y-3 pt-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-amber-600 flex-shrink-0" />
            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-950">
              {t.conditionalDocs}
            </h3>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5" role="list">
            {conditionalItems.map((item, localIdx) => {
              const globalIdx = localIdx + 4;
              const isChecked = ticks.includes(globalIdx);
              return (
                <li key={globalIdx}>
                  <label className={`flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 min-h-[44px] rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/40 text-stone-800'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(globalIdx)}
                      className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 accent-emerald-800 flex-shrink-0 cursor-pointer"
                    />
                    <span className={`text-xs sm:text-base font-semibold leading-relaxed ${
                      isChecked ? 'line-through opacity-75' : ''
                    }`}>
                      {item}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Sources Citation Footer */}
      <div className="pt-2.5 sm:pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] sm:text-xs text-stone-500 font-medium">
        <span>{t.source}: {checklist.sources?.join(', ')}</span>
        <ShieldCheck className="w-4 h-4 text-emerald-700" />
      </div>
    </section>
  );
}
