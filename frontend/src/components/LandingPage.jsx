import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ChevronRight, Clock, FileText, Landmark, MapPin, Mic, ShieldAlert, ShieldCheck, Users, Volume2 } from 'lucide-react';
import { getHelp } from '../api';
import { useLanguage } from '../i18n';
import { useApiData } from '../useApiData';
import FaqList from './FaqList';
import LanguageSelector from './LanguageSelector';
import { CadastralFieldPattern, TopographicPattern } from './GeospatialPatterns';

const STEP_ICONS = [Mic, ShieldCheck, Volume2];

const PROBLEM_CONFIGS = {
  file: { icon: FileText, bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  clock: { icon: Clock, bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  alert: { icon: AlertCircle, bg: 'bg-amber-50 text-amber-900 border-amber-300' }
};

function Section({ id, title, subtitle, tinted, topo = false, children }) {
  return (
    <section id={id} className={`relative py-12 sm:py-16 md:py-20 border-b border-stone-200 overflow-hidden ${tinted ? 'bg-stone-50/70' : 'bg-white'}`}>
      {topo && <TopographicPattern className="opacity-[0.035] mix-blend-multiply" />}
      <div className="relative z-10 max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs sm:text-base text-stone-600 leading-relaxed font-medium">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

export default function LandingPage({ setActiveTab }) {
  const { lang, t } = useLanguage();
  const help = useApiData(() => getHelp(lang), lang);

  const capabilities = [
    {
      tab: 'ask',
      title: t.actionAsk,
      desc: t.actionAskDesc,
      icon: Mic,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badge: 'आवाज़ व लिखाई',
      points: [
        'हिंदी, भोजपुरी, मगही व हिंग्लिश में बोलें',
        'केवल दिए गए नमूना नियमों (S1–S7) से जवाब',
        'बिना पढ़े जवाब बोलकर सुनें'
      ]
    },
    {
      tab: 'paper',
      title: t.actionPaper,
      desc: t.actionPaperDesc,
      icon: FileText,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      badge: 'OCR व अंतिम तिथि',
      points: [
        'नोटिस की फ़ोटो अपलोड करें या लिखाई पेस्ट करें',
        'अंतिम तारीख व बचे हुए दिनों की सही गणना',
        'ज़रूरी कागज़ और कार्यालय का पता'
      ]
    },
    {
      tab: 'record',
      title: t.actionRecord,
      desc: t.actionRecordDesc,
      icon: MapPin,
      color: 'bg-sky-50 text-sky-800 border-sky-200',
      badge: 'खतियान व खेसरा',
      points: [
        'ज़िला, मौज़ा और खाता संख्या से खोजें',
        'मृत्यु की स्थिति व वंशावली की चेतावनी',
        'दाखिल-खारिज व लगान रसीद की स्थिति'
      ]
    }
  ];

  return (
    <div className="overflow-hidden w-full">
      {/* Hero Section */}
      <section className="relative py-10 sm:py-16 md:py-20 border-b border-stone-200 bg-gradient-to-b from-[#FAF8F5] via-white to-[#F7F5F0] overflow-hidden">
        {/* Subtle Cadastral Satellite / Field Survey Grid Pattern */}
        <CadastralFieldPattern className="opacity-[0.045] mix-blend-multiply" />

        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 items-center">
            
            {/* Left Column: Heading, Primary Actions & Trust Badges */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-left">
              {/* Main Headline */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-stone-900 tracking-tight leading-[1.2] break-words">
                <span>
                  <span className="text-emerald-800">{lang === 'en' ? 'Bhoo' : 'भू'}</span>
                  <span className="text-amber-600">{lang === 'en' ? 'mitra' : 'मित्र'}</span>
                </span>
                <span className="text-emerald-800">:</span> <br className="hidden sm:inline" />
                <span className="text-emerald-950">
                  {t.heroTitle.split(':')[1] || ''}
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-lg text-stone-700 leading-relaxed max-w-2xl font-medium">
                {t.heroSubtitle}
              </p>

              {/* Primary Dual Actions: Ask Bhoomitra & Explain Paper */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab('ask')}
                  className="w-full sm:w-auto px-6 sm:px-7 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-bold text-sm sm:text-base shadow-sm hover:shadow transition-all inline-flex items-center justify-center gap-2.5 group"
                >
                  <Mic className="w-5 h-5 text-emerald-100 group-hover:scale-110 transition-transform" />
                  <span>{t.actionAsk} (बोलकर पूछें)</span>
                  <ArrowRight className="w-4 h-4 text-emerald-100 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('paper')}
                  className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-4 min-h-[48px] rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-bold text-sm sm:text-base border-2 border-stone-300 hover:border-emerald-700 shadow-xs transition-colors inline-flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5 text-amber-700" />
                  <span>{t.actionPaper} (नोटिस समझें)</span>
                </button>
              </div>

              {/* Trust Disclosures */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-xl">
                <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-800 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-800 font-medium leading-relaxed">
                    <strong className="text-stone-900 font-bold">निःशुल्क सेवा:</strong> सर्वे स्व-घोषणा के लिए कोई शुल्क नहीं है। (नियम S6)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-stone-800 font-medium leading-relaxed">
                    <strong className="text-stone-900 font-bold">नियमों पर आधारित:</strong> उत्तर केवल उपलब्ध नियमों व काल्पनिक नमूना डेटा से आते हैं।
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Native Language Selector Card */}
            <div className="lg:col-span-5 w-full">
              <LanguageSelector onSpeak={() => setActiveTab('ask')} />
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Capabilities */}
      <Section title={t.featuresTitle} subtitle={t.featuresSubtitle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.tab}
                className="p-5 sm:p-7 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-emerald-700 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border ${cap.color}`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                      {cap.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-1">{cap.title}</h3>
                    <p className="text-xs sm:text-sm text-stone-600 font-medium">{cap.desc}</p>
                  </div>

                  <ul className="space-y-2 pt-2 border-t border-stone-100">
                    {cap.points.map((pt, i) => (
                      <li key={i} className="text-xs text-stone-700 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-5 mt-5 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setActiveTab(cap.tab)}
                    className="w-full py-2.5 min-h-[44px] rounded-xl bg-stone-100 hover:bg-emerald-800 text-stone-800 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>{t.openLabel}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* How It Works Section */}
      <Section title={t.howTitle} subtitle={t.howSubtitle} tinted topo>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {t.howSteps.map((step, index) => {
            const Icon = STEP_ICONS[index] || ShieldCheck;
            return (
              <div
                key={step.title}
                className="p-5 sm:p-7 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3 relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black tracking-wider uppercase text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                      {t.step} 0{index + 1}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-emerald-800">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 mb-1.5">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">{step.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Rural Citizen Problems Addressed */}
      <Section title={t.problemTitle} subtitle={t.problemSubtitle}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {(t.problemCards || []).map((prob, idx) => {
            const conf = PROBLEM_CONFIGS[prob.iconType] || { icon: FileText, bg: 'bg-amber-50 text-amber-800 border-amber-200' };
            const Icon = conf.icon;
            return (
              <div
                key={prob.num || idx}
                className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${conf.bg}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                      {prob.num}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-stone-900 text-base sm:text-lg leading-snug">
                    {prob.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                    {prob.text}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-500">
                  <span>{prob.tag}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Target Audiences */}
      <Section title={t.whoTitle} subtitle={t.whoSubtitle} tinted topo>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          {/* Citizens Card */}
          <div className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl">{t.whoUsers}</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                  {lang === 'en' ? 'Citizen-First' : 'नागरिक सेवा'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                {t.whoUsersText}
              </p>
            </div>

            {/* Benefit Callout */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-bold text-emerald-950 leading-relaxed">
                {t.whoUsersBenefit}
              </div>
            </div>
          </div>

          {/* Institutions Card */}
          <div className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-lg sm:text-xl">{t.whoBuyers}</h3>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                  {lang === 'en' ? 'Governance' : 'प्रशासन व पंचायत'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
                {t.whoBuyersText}
              </p>
            </div>

            {/* Benefit Callout */}
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-bold text-amber-950 leading-relaxed">
                {t.whoBuyersBenefit}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Frequently Asked Questions */}
      <Section title={t.faq} subtitle={t.faqSubtitle}>
        <div className="max-w-5xl mx-auto">
          {help.data && <FaqList faqs={help.data.faqs} />}
        </div>
      </Section>
    </div>
  );
}
