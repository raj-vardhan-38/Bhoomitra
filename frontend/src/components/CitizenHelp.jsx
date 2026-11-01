import React from 'react';
import { AlertCircle, AlertTriangle, Building2, CheckCircle2, ExternalLink, FileText, HelpCircle, MapPin, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getHelp } from '../api';
import { errorMessage, useLanguage } from '../i18n';
import { useApiData } from '../useApiData';
import { DocumentList, ErrorBox, PageHeader, Spinner } from './common';
import CampChecklist from './CampChecklist';
import FaqList from './FaqList';

export default function CitizenHelp() {
  const { lang, t } = useLanguage();
  const help = useApiData(() => getHelp(lang), lang);
  const data = help.data;

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
      <PageHeader
        title={t.helpTitle}
        intro={t.helpIntro}
      />

      {help.loading && !data && <Spinner label={t.loading} />}
      {help.error && <ErrorBox message={errorMessage(help.error, t)} onRetry={help.retry} />}

      {data && (
        <div className="space-y-8 sm:space-y-10">
          {/* Section 1: Fraud Warning & Help Desk Alert Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Anti-Fraud Banner */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-rose-50 border border-rose-300 space-y-2.5 sm:space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-rose-950 font-black text-sm sm:text-base">
                <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-700 flex-shrink-0" />
                <span>{t.fraud} (सावधान रहें)</span>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-rose-950 font-semibold" role="list">
                {data.fraud_warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-700 font-bold">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-2 border-t border-rose-200 text-[11px] sm:text-xs text-rose-900 font-bold">
                {data.no_fee?.message}
              </div>
            </div>

            {/* Help Camp Desk */}
            <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 space-y-2.5 sm:space-y-3 shadow-xs flex flex-col justify-between">
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm sm:text-base">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-800 flex-shrink-0" />
                  <span>{t.helpDesk} (नियम S7)</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
                  {data.help_desk?.message}
                </p>
                <p className="text-[11px] sm:text-xs text-stone-600 font-normal">
                  अधिसूचित तिथियों पर पंचायत भवन जाकर आप बिना किसी शुल्क के सहायता प्राप्त कर सकते हैं।
                </p>
              </div>

              <div className="pt-2.5 sm:pt-3 border-t border-stone-100 text-xs font-semibold text-stone-700 flex items-center justify-between">
                <span>स्रोत: Rule S7</span>
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Before-Camp Checklist */}
          {data.camp_checklist && (
            <CampChecklist checklist={data.camp_checklist} />
          )}

          {/* Section 3: Topic-wise Document Requirements */}
          <section className="space-y-3 sm:space-y-4">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight">
                {t.checklists}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium">
                विशिष्ट परिस्थितियों के लिए आवश्यक कागज़ात
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {data.checklists.map((checklist) => (
                <div
                  key={checklist.title}
                  className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-stone-900 text-base sm:text-lg leading-snug">
                        {checklist.title}
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200 flex-shrink-0 whitespace-nowrap">
                        {checklist.items.length} {lang === 'en' ? 'Docs' : 'कागज़'}
                      </span>
                    </div>

                    <ul className="space-y-2" role="list">
                      {checklist.items.map((doc, i) => (
                        <li
                          key={i}
                          className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs sm:text-sm text-stone-900 flex items-start gap-2.5 transition-colors hover:bg-emerald-50/50 hover:border-emerald-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
                          <span className="font-semibold leading-relaxed">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] sm:text-xs text-stone-500 font-medium">
                    <span>
                      {t.source}: {checklist.sources?.map((s) => `Rule ${s}`).join(', ')}
                    </span>
                    <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" aria-hidden="true" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4: FAQs */}
          <section className="space-y-3 sm:space-y-4">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight">
                {t.faq}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 font-medium">
                अक्सर पूछे जाने वाले सवाल एवं उनके प्रामाणिक उत्तर
              </p>
            </div>
            <FaqList faqs={data.faqs} />
          </section>

          {/* Section 5: Official Government Websites */}
          <section className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-xl font-black text-stone-900 tracking-tight">
              {t.officialSites}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {data.official_sites.map((site) => (
                <a
                  key={site.url}
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 transition-all group flex items-center justify-between"
                >
                  <span className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-emerald-950">
                    {site.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 group-hover:text-emerald-700 flex-shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
