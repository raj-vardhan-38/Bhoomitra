import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  MapPin,
  RefreshCw,
  RotateCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  Volume2,
  X
} from 'lucide-react';
import { explainFile, explainText, getSampleLetters } from '../api';
import { errorMessage, useLanguage } from '../i18n';
import { useApiData } from '../useApiData';
import { useSpeaker } from '../useSpeaker';
import CameraCapture from './CameraCapture';
import SpeechFollow from './SpeechFollow';
import {
  DocumentList,
  ErrorBox,
  LanguageNote,
  ListenButton,
  PageHeader,
  SafetyNote,
  SourceChips,
  SpeechFailedNote,
  Spinner
} from './common';

const DEADLINE_STYLE = {
  upcoming: 'bg-amber-50/90 border-amber-300 text-amber-950',
  due_today: 'bg-rose-50 border-rose-300 text-rose-950',
  overdue: 'bg-rose-50 border-rose-300 text-rose-950',
  unknown: 'bg-stone-50 border-stone-200 text-stone-800'
};

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function DocumentIllustration() {
  return (
    <div className="relative w-24 h-24 mx-auto mb-3 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-emerald-100/70 scale-110" />
      <svg
        className="w-16 h-16 text-emerald-800 relative z-10 transition-transform group-hover:scale-105 duration-300"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M16 8C14.8954 8 14 8.89543 14 10V54C14 55.1046 14.8954 56 16 56H48C49.1046 56 50 55.1046 50 54V22L36 8H16Z"
          fill="#FAF8F5"
          stroke="#065F46"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M36 8V22H50"
          fill="#E6F4EA"
          stroke="#065F46"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <line x1="22" y1="28" x2="42" y2="28" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="36" x2="42" y2="36" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="44" x2="34" y2="44" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />
        <circle cx="46" cy="46" r="11" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
        <path
          d="M46 41L42 45M46 41L50 45M46 41V51"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function StepGuide({ lang }) {
  const steps = [
    {
      num: '01',
      title: lang === 'en' ? 'Upload or photograph paper' : 'कागज़ अपलोड करें या फ़ोटो लें',
      desc: lang === 'en' ? 'Notice, mutation slip, or survey form in PDF or photo.' : 'सर्वे नोटिस, पर्चा या दाखिल-खारिज पत्र की साफ़ फ़ोटो या PDF।'
    },
    {
      num: '02',
      title: lang === 'en' ? 'Bhoomitra reads and checks it' : 'भूमित्र इसे पढ़ेगा व जाँचेगा',
      desc: lang === 'en' ? 'AI vision extracts text and cross-references rules S1–S7.' : 'लिखाई पढ़कर नियमों (S1–S7) के आधार पर सत्यापन होगा।'
    },
    {
      num: '03',
      title: lang === 'en' ? 'Understand action & deadline' : 'तय समय-सीमा व कार्रवाई समझें',
      desc: lang === 'en' ? 'See exact steps, required documents, camp location & countdown.' : 'तय समय-सीमा, ले जाने वाले कागज़ और अंचल कार्यालय की जानकारी।'
    }
  ];

  return (
    <div className="mb-6 sm:mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
      {steps.map((st) => (
        <div
          key={st.num}
          className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-start gap-3.5 transition-all hover:border-emerald-200"
        >
          <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-black text-sm flex items-center justify-center flex-shrink-0">
            {st.num}
          </span>
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
              {st.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 font-medium leading-relaxed">
              {st.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PrivacySafetyCard({ lang }) {
  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-start gap-2.5 sm:gap-3 text-xs text-amber-950 leading-relaxed shadow-2xs">
      <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-800 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <span className="font-bold text-amber-950 block mb-0.5">
          {lang === 'en' ? 'Privacy & Safety Advisory:' : 'गोपनीयता व सुरक्षा सलाह:'}
        </span>
        <span className="text-stone-700">
          {lang === 'en'
            ? 'Upload only the specific land notice or paper needed for explanation. Avoid sharing unnecessary personal documents like bank passbooks or PAN cards. Your files are processed securely solely for citizen guidance.'
            : 'कृपया केवल वही नोटिस या ज़मीन का दस्तावेज़ अपलोड करें जिसे समझना है। बैंक पासबुक या पैन कार्ड जैसी अनावश्यक निजी जानकारी साझा न करें। आपके कागज़ केवल नागरिक सहायता हेतु सुरक्षित रूप से जाँचे जाते हैं।'}
        </span>
      </div>
    </div>
  );
}

function DeadlineCard({ deadline }) {
  const { t } = useLanguage();
  const badges = {
    upcoming: t.daysLeft(deadline.days_remaining),
    due_today: t.dueToday,
    overdue: t.daysOverdue(deadline.days_overdue),
    unknown: t.noDeadline
  };

  const isOverdue = deadline.status === 'overdue';
  const isDueToday = deadline.status === 'due_today';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border space-y-2.5 ${DEADLINE_STYLE[deadline.status]}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>{t.deadline}</span>
        </div>
        <span
          className={`text-[11px] sm:text-xs font-extrabold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border shadow-2xs ${
            isDueToday || isOverdue
              ? 'bg-rose-700 text-white border-rose-800'
              : 'bg-amber-800 text-white border-amber-900'
          }`}
        >
          {badges[deadline.status]}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-2">
        {deadline.date_display && (
          <span className="text-xl sm:text-2xl font-black tracking-tight">{deadline.date_display}</span>
        )}
      </div>

      <p className="text-xs sm:text-sm font-semibold leading-relaxed">{deadline.message}</p>
      {deadline.basis && (
        <p className="text-[11px] sm:text-xs opacity-80 pt-1 border-t border-current/20 font-medium">
          {t.basis}: {deadline.basis}
        </p>
      )}
    </div>
  );
}

function DocumentPreviewCard({
  file,
  previewUrl,
  rotationDeg,
  onRotate,
  onReplace,
  onRemove,
  lang
}) {
  const isImage = file?.type?.startsWith('image/');
  const isPdf = file?.type === 'application/pdf' || file?.name?.toLowerCase().endsWith('.pdf');

  return (
    <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3.5">
      {/* File metadata row */}
      <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-bold text-stone-900 truncate" title={file?.name}>
              {file?.name || (lang === 'en' ? 'Uploaded Notice Document' : 'अपलोड किया गया दस्तावेज़')}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
              <span>{formatFileSize(file?.size)}</span>
              <span>•</span>
              <span className="uppercase font-semibold text-emerald-800">
                {isPdf ? 'PDF DOCUMENT' : isImage ? 'IMAGE' : 'DOCUMENT'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls: Replace & Remove */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isImage && onRotate && (
            <button
              type="button"
              onClick={onRotate}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Rotate 90 degrees"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">90°</span>
            </button>
          )}
          <button
            type="button"
            onClick={onReplace}
            className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-colors"
            title={lang === 'en' ? 'Replace file' : 'फ़ाइल बदलें'}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'en' ? 'Replace' : 'बदलें'}</span>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
            title={lang === 'en' ? 'Remove file' : 'हटाएँ'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Canvas / Frame */}
      {isImage && previewUrl ? (
        <div className="relative rounded-xl overflow-hidden bg-stone-900/90 max-h-56 sm:max-h-64 flex items-center justify-center border border-stone-200 p-2">
          <img
            src={previewUrl}
            alt="Notice preview"
            className="max-h-52 sm:max-h-60 w-auto object-contain transition-transform duration-300"
            style={{ transform: `rotate(${rotationDeg}deg)` }}
          />
        </div>
      ) : isPdf ? (
        <div className="p-6 rounded-xl bg-stone-50 border border-stone-200 flex flex-col items-center justify-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-stone-900">
              {lang === 'en' ? 'PDF Document Ready' : 'PDF दस्तावेज़ तैयार है'}
            </div>
            <div className="text-[11px] text-stone-500 font-medium">
              {lang === 'en' ? 'The notice text will be analyzed' : 'सरकारी नोटिस के पन्नों का विश्लेषण होगा'}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DropZone({ isDragging, onDragOver, onDragEnter, onDragLeave, onDrop, onBrowse, onCamera, lang }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onBrowse}
      className={`group relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all duration-200 text-center cursor-pointer min-h-[320px] sm:min-h-[380px] ${
        isDragging
          ? 'border-emerald-600 bg-emerald-50/90 ring-4 ring-emerald-200/60 scale-[1.01]'
          : 'border-emerald-300/80 bg-gradient-to-b from-emerald-50/40 via-stone-50/30 to-[#FAF8F5] hover:border-emerald-500 hover:bg-emerald-50/50 shadow-2xs'
      }`}
    >
      <DocumentIllustration />

      <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight mb-1">
        {lang === 'en' ? 'Drag your notice here or browse files' : 'यहाँ अपना नोटिस ड्रैग करें या फ़ाइल चुनें'}
      </h3>
      <p className="text-xs sm:text-sm text-stone-600 max-w-sm mb-4 font-medium leading-relaxed">
        {lang === 'en'
          ? 'Choose a photo, PDF scan, or notice from your device.'
          : 'अपने मोबाइल या कंप्यूटर से सरकारी नोटिस, पर्चा या आवेदन की फ़ोटो या PDF चुनें।'}
      </p>

      {/* Button Group */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onBrowse}
          className="py-2.5 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>{lang === 'en' ? 'Browse Files' : 'फ़ाइल चुनें'}</span>
        </button>

        <button
          type="button"
          onClick={onCamera}
          className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-xs"
        >
          <Camera className="w-4 h-4" />
          <span>{lang === 'en' ? 'Take Photo' : 'फ़ोटो खींचें'}</span>
        </button>
      </div>

      <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-stone-500 bg-white/80 px-3 py-1 rounded-full border border-stone-200">
        <span>PNG, JPG, PDF, Scan • Max 10 MB</span>
      </div>
    </div>
  );
}

function ExplanationResult({ result, speaker }) {
  const { lang, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (result.extracted_text) {
      navigator.clipboard.writeText(result.extracted_text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <article className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-sm space-y-6 sm:space-y-8">
      
      {/* SECTION 1: What is this paper? */}
      <section className="space-y-3 pb-6 border-b border-stone-100">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-200">
                {lang === 'en' ? 'Section 1 • What is this paper?' : '१. यह कौन सा कागज़ है?'}
              </span>
              <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                {result.document_type || result.kind}
              </span>
              {!result.is_land_document && (
                <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
                  {t.notLand}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
              {result.what_it_is}
            </h2>
            {result.purpose && (
              <p className="text-xs sm:text-sm text-stone-600 font-medium mt-1">
                {result.purpose}
              </p>
            )}
          </div>

          {/* Section 5: Language Awareness & Listen Button */}
          <div className="flex items-center flex-shrink-0">
            <ListenButton speaker={speaker} text={result.spoken_text} id="paper-result" primary />
          </div>
        </div>

        <SpeechFollow speaker={speaker} text={result.spoken_text} id="paper-result" />
        <SpeechFailedNote speaker={speaker} />
        <LanguageNote fallback={result.language_fallback} />
      </section>

      {/* SECTION 2: What do I need to do? */}
      <section className="space-y-3 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{lang === 'en' ? 'Section 2 • What do I need to do?' : '२. मुझे क्या करना होगा?'}</span>
        </div>

        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
          <p className="text-sm sm:text-lg font-bold text-stone-900 leading-relaxed">
            {result.what_to_do}
          </p>
          {result.fee_note && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-md">
              <span>{result.fee_note}</span>
            </div>
          )}
        </div>

        {/* Consequence Alert */}
        {result.consequence && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong>{t.consequence}:</strong> {result.consequence}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Last date and days remaining */}
      <section className="space-y-3 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
          <Clock className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>{lang === 'en' ? 'Section 3 • Last date and days remaining' : '३. अंतिम तिथि व शेष दिन'}</span>
        </div>
        <DeadlineCard deadline={result.deadline} />
      </section>

      {/* SECTION 4: Documents required */}
      <section className="space-y-3 pb-6 border-b border-stone-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
            <FileText className="w-4 h-4 text-emerald-800 flex-shrink-0" />
            <span>{lang === 'en' ? 'Section 4 • Documents required' : '४. साथ ले जाने वाले ज़रूरी दस्तावेज़'}</span>
          </div>
          {result.documents_required?.length > 0 && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
              {result.documents_required.length} {lang === 'en' ? 'items' : 'कागज़'}
            </span>
          )}
        </div>

        {result.documents_required && result.documents_required.length > 0 ? (
          <DocumentList documents={result.documents_required} columns={1} />
        ) : (
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-600 font-medium">
            {lang === 'en'
              ? 'No additional documents specifically requested in this notice.'
              : 'इस नोटिस के लिए किसी अतिरिक्त दस्तावेज़ की आवश्यकता नहीं है।'}
          </div>
        )}
      </section>

      {/* SECTION 5: Which office should I visit? */}
      <section className="space-y-3 pb-6 border-b border-stone-100">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
          <Building2 className="w-4 h-4 text-emerald-800 flex-shrink-0" />
          <span>{lang === 'en' ? 'Section 5 • Which office should I visit?' : '५. किस अंचल या कार्यालय जाना है?'}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
            <div className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">
              {lang === 'en' ? 'Office / Authority' : 'संबंधित कार्यालय'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
              {result.office || (lang === 'en' ? 'Concerned Circle Office (Anchal Karyalay)' : 'संबंधित अंचल कार्यालय')}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
            <div className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">
              {lang === 'en' ? 'Submission Counter / Camp' : 'जमा करने का स्थान / शिविर'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
              {result.submission_place || (lang === 'en' ? 'Special Survey Camp / Anchal Camp' : 'विशेष सर्वेक्षण शिविर / अंचल काउंटर')}
            </div>
          </div>

          {(result.case_no || result.reference_no) && (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">
                {lang === 'en' ? 'Case / Reference Number' : 'वाद या पत्रांक संख्या'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug font-mono">
                {result.case_no || result.reference_no}
              </div>
            </div>
          )}

          {result.letter_date && (
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
              <div className="text-[10px] sm:text-xs text-stone-500 font-bold uppercase tracking-wider">
                {lang === 'en' ? 'Notice Issue Date' : 'नोटिस निर्गत तिथि'}
              </div>
              <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                {result.letter_date?.split('-').reverse().join('-')}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 6: Source and confidence / uncertainty */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-700">
          <ShieldAlert className="w-4 h-4 text-emerald-800 flex-shrink-0" />
          <span>{lang === 'en' ? 'Section 6 • Related sample rules' : '६. संबंधित नमूना नियम'}</span>
        </div>

        {result.sources && result.sources.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-stone-500">
              {lang === 'en' ? 'Related sample rules:' : 'संबंधित नमूना नियम:'}
            </div>
            <SourceChips sources={result.sources} />
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>
              {result.engine === 'gemini'
                ? (lang === 'en' ? 'Explained by Gemini AI and checked against the sample rules' : 'Gemini AI से समझाया गया और नमूना नियमों से जाँचा गया')
                : (lang === 'en' ? 'Explained by the offline rule engine' : 'ऑफ़लाइन नियम इंजन से समझाया गया')}
            </span>
          </div>
          <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
            {result.safety_message || t.disclaimer}
          </p>
        </div>

        {/* Original OCR Text Viewer */}
        {result.extracted_text && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                {t.rawNoticeText} (OCR Raw Extract)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-emerald-800 transition-colors py-1 px-2 rounded-md hover:bg-stone-100"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? t.copied : t.copyText}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 max-h-40 overflow-y-auto text-xs font-mono text-stone-800 whitespace-pre-wrap leading-relaxed">
              {result.extracted_text}
            </div>
          </div>
        )}
      </section>

    </article>
  );
}

export default function PaperExplainer() {
  const { lang, t } = useLanguage();
  const samples = useApiData(getSampleLetters, 'samples');
  const speaker = useSpeaker();

  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [customText, setCustomText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [busyStep, setBusyStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const requestRef = useRef(0);
  const lastTextRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const run = async (requestFn, onFailureRetry) => {
    requestRef.current += 1;
    const current = requestRef.current;
    speaker.stop();
    setBusy(true);
    setError(null);
    setBusyStep(1);

    const stepTimer = setTimeout(() => {
      if (current === requestRef.current) setBusyStep(2);
    }, 1200);

    try {
      const data = await requestFn();
      if (current !== requestRef.current) return;
      setResult(data);
      lastTextRef.current = data.extracted_text;
    } catch (err) {
      if (current !== requestRef.current) return;
      setResult(null);
      setError({ message: errorMessage(err, t), retry: onFailureRetry });
    } finally {
      clearTimeout(stepTimer);
      if (current === requestRef.current) setBusy(false);
    }
  };

  const explainWritten = (text) => {
    lastTextRef.current = text;
    run(() => explainText(text, lang), () => explainWritten(text));
  };

  const handleSelectSample = (letter) => {
    setSelectedSampleId(letter.id);
    setCustomText('');
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    explainWritten(letter.text);
  };

  const handleSubmitText = () => {
    setSelectedSampleId(null);
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    explainWritten(customText);
  };

  const openCamera = () => {
    if (navigator.mediaDevices?.getUserMedia) setCameraOpen(true);
    else cameraInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) explainSelectedFile(file);
  };

  const explainSelectedFile = (file) => {
    setSelectedSampleId(null);
    setCustomText('');
    lastTextRef.current = null;
    setSelectedFile(file);
    setRotationDeg(0);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    const upload = () => run(() => explainFile(file, lang), upload);
    upload();
  };

  const handleRotate = () => {
    setRotationDeg((prev) => (prev + 90) % 360);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRotationDeg(0);
    setResult(null);
    setError(null);
    speaker.stop();
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      explainSelectedFile(files[0]);
    }
  };

  useEffect(() => {
    if (lastTextRef.current) explainWritten(lastTextRef.current);
    else speaker.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
      <PageHeader
        title={t.paperTitle}
        intro={t.paperIntro}
      />

      {/* Point 3: Three-Step Guide */}
      <StepGuide lang={lang} />

      {/* Quick Sample Letters Banner */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">
            {t.samples} (क्लिक करके तुरंत आज़माएँ):
          </span>
        </div>

        {samples.loading && <Spinner label={t.loading} />}
        {samples.error && <ErrorBox message={errorMessage(samples.error, t)} onRetry={samples.retry} />}
        {samples.data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {samples.data.samples.map((letter) => {
              const isSelected = selectedSampleId === letter.id;
              return (
                <button
                  key={letter.id}
                  type="button"
                  onClick={() => handleSelectSample(letter)}
                  className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50 shadow-xs ring-1 ring-emerald-700'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t.letter} {letter.id}</span>
                    </span>
                    {isSelected && <span className="text-emerald-700 font-extrabold text-[11px]">चयनित ✓</span>}
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                    {letter.title}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf,text/plain,.heic,.heif"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {cameraOpen && (
        <CameraCapture
          onClose={() => setCameraOpen(false)}
          onCapture={(file) => {
            setCameraOpen(false);
            explainSelectedFile(file);
          }}
          onUseUpload={() => {
            setCameraOpen(false);
            fileInputRef.current?.click();
          }}
        />
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        {/* Left Column: Input Options, Paste Text & Privacy Note */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-5">
          
          {/* Document Preview (Point 2) if file selected */}
          {selectedFile && (
            <DocumentPreviewCard
              file={selectedFile}
              previewUrl={previewUrl}
              rotationDeg={rotationDeg}
              onRotate={handleRotate}
              onReplace={() => fileInputRef.current?.click()}
              onRemove={handleClearFile}
              lang={lang}
            />
          )}

          {/* Paste Notice Text Card */}
          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900 border-b border-stone-100 pb-2.5 flex items-center justify-between">
              <span>{lang === 'en' ? 'Paste Notice Text' : 'दस्तावेज़ की लिखाई पेस्ट करें'}</span>
            </h2>

            <div className="space-y-2">
              <label htmlFor="notice-text-input" className="block text-xs font-bold uppercase tracking-wider text-stone-600">
                {t.pasteLabel}
              </label>
              <textarea
                id="notice-text-input"
                rows={4}
                maxLength={20000}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t.pastePlaceholder}
                className="w-full p-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white text-xs sm:text-sm focus:ring-2 focus:ring-emerald-700 focus:outline-none font-medium text-stone-900 transition-all"
              />
              <button
                type="button"
                onClick={handleSubmitText}
                disabled={!customText.trim() || busy}
                className="w-full py-3 min-h-[44px] rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs"
              >
                {t.explain}
              </button>
            </div>
          </div>

          {/* Point 6: Privacy & Safety Advisory */}
          <PrivacySafetyCard lang={lang} />
        </div>

        {/* Right Column: Prominent Dropzone, Processing, or 6-Section Results */}
        <div className="lg:col-span-7 w-full">
          {busy && (
            <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-sm text-center space-y-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <Spinner label="" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-stone-900">
                  {busyStep === 1 ? t.stepReading : t.stepDates}
                </h3>
                <p className="text-[11px] sm:text-xs text-stone-500 font-medium">
                  {busyStep === 1 ? 'कागज़ की लिखाई पढ़ी जा रही है' : 'अंतिम तारीख व बचे हुए दिन गिने जा रहे हैं'}
                </p>
              </div>
            </div>
          )}

          {!busy && error && (
            <ErrorBox message={error.message} onRetry={error.retry} />
          )}

          {!busy && !error && result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  {lang === 'en' ? 'Document breakdown' : 'कागज़ का संपूर्ण विवरण'}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-900 hover:underline inline-flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Analyze another paper' : 'दूसरा कागज़ समझाएँ'}</span>
                </button>
              </div>

              {/* Point 4: 6-Section Explanation Result */}
              <ExplanationResult result={result} speaker={speaker} />
            </div>
          )}

          {/* Point 1: Prominent Drag-and-Drop Dropzone when no result yet */}
          {!busy && !error && !result && (
            <DropZone
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onBrowse={() => fileInputRef.current?.click()}
              onCamera={openCamera}
              lang={lang}
            />
          )}
        </div>
      </div>
    </div>
  );
}
