import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Building2, CheckCircle2, ChevronRight, FileText, Info, MapPin, Search, ShieldAlert, User, Volume2 } from 'lucide-react';
import { getRecordOptions, searchRecord } from '../api';
import { errorMessage, useLanguage } from '../i18n';
import { useApiData } from '../useApiData';
import { useSpeaker } from '../useSpeaker';
import SpeechFollow from './SpeechFollow';
import { ErrorBox, LanguageNote, ListenButton, PageHeader, SafetyNote, Spinner } from './common';
import { CadastralFieldPattern, TopographicPattern } from './GeospatialPatterns';

const SEVERITY_STYLE = {
  high: 'bg-rose-50 border-rose-300 text-rose-950',
  medium: 'bg-amber-50 border-amber-300 text-amber-950',
  info: 'bg-sky-50 border-sky-300 text-sky-950'
};

const SEVERITY_ICON = {
  high: AlertTriangle,
  medium: AlertCircle,
  info: Info
};

function SelectField({ id, label, value, onChange, children, disabled }) {
  return (
    <div className="space-y-1 sm:space-y-1.5">
      <label htmlFor={id} className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-600">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full p-2.5 sm:p-3 min-h-[44px] rounded-xl border border-stone-300 bg-white text-stone-900 text-xs sm:text-base font-semibold focus:ring-2 focus:ring-emerald-700 focus:outline-none transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

function RecordFact({ label, value, note, highlight }) {
  return (
    <div className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${highlight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-stone-50 border-stone-200'}`}>
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-500 mb-0.5 sm:mb-1">{label}</div>
      <div className="text-sm sm:text-lg font-extrabold text-stone-900 break-words">{value}</div>
      {note && <div className="text-[11px] sm:text-xs font-medium text-stone-500 mt-0.5 sm:mt-1">{note}</div>}
    </div>
  );
}

function RecordDetailsView({ record, speaker }) {
  const { t } = useLanguage();

  return (
    <article className="relative overflow-hidden p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5 sm:space-y-6">
      {/* Subtle Topographic Terrain Contours */}
      <TopographicPattern className="opacity-[0.035] mix-blend-multiply" />

      <div className="relative z-10 space-y-5 sm:space-y-6">
        {/* Top Header & Read Aloud Action */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 sm:pb-5 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
              {t.sampleRecord}
            </span>
            <span className="text-xs text-stone-500 font-medium">
              खाता: <strong>{record.khata_no}</strong>
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span>{record.holder}</span>
            {record.holder_deceased && (
              <span className="text-[11px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300">
                ({t.deceasedTag})
              </span>
            )}
          </h2>
          {record.relation && (
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              संबंध: {record.relation}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <ListenButton speaker={speaker} text={record.spoken_text} id="record-result" primary />
        </div>
      </div>

      <SpeechFollow speaker={speaker} text={record.spoken_text} id="record-result" />
      <LanguageNote fallback={record.language_fallback} />

      {/* Spoken Summary Box */}
      <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-1">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-700" />
          <span>{t.explanation}</span>
        </div>
        <p className="text-sm sm:text-lg font-bold text-stone-900 leading-relaxed">
          {record.explanation}
        </p>
      </div>

      {/* Pending Action Callouts */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-stone-600">
          {t.pendingActions}
        </div>

        {record.pending_actions.length === 0 ? (
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{t.noPending}</span>
          </div>
        ) : (
          record.pending_actions.map((action) => {
            const Icon = SEVERITY_ICON[action.severity] || AlertCircle;
            return (
              <div
                key={action.type}
                className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border flex items-start gap-2.5 sm:gap-3 ${SEVERITY_STYLE[action.severity]}`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-base font-bold leading-relaxed">{action.message}</p>
                  <p className="text-[11px] sm:text-xs opacity-85 font-medium">
                    {t.source}: {action.sources.join(', ')}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Facts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        <RecordFact
          label={t.holder}
          value={record.holder}
          note={record.holder_deceased ? `स्थिति: ${t.deceasedTag}` : 'स्थिति: जीवित'}
          highlight
        />
        <RecordFact
          label={t.khata}
          value={record.khata_no}
          note={record.jamabandi_no ? `${t.jamabandi}: ${record.jamabandi_no}` : null}
        />
        <RecordFact
          label={t.lastReceipt}
          value={record.last_rent_receipt_year ?? '—'}
          note={[record.thana_no && `${t.thana}: ${record.thana_no}`, record.circle && `${t.circle}: ${record.circle}`].filter(Boolean).join(' · ')}
        />
      </div>

      {/* Plots Table */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-600 truncate">
            प्लॉट व रकबा (खेसरा सूची)
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-stone-800 bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200 flex-shrink-0">
            {t.totalArea}: {record.total_area_decimal} {t.decimals}
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-stone-200">
          <table className="min-w-full divide-y divide-stone-200 text-left text-xs sm:text-sm" role="table">
            <thead className="bg-stone-50 font-bold text-stone-700">
              <tr>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wider">{t.khesra}</th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wider">{t.area}</th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 uppercase tracking-wider">{t.landType}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white">
              {record.plots.map((plot) => (
                <tr key={plot.khesra} className="hover:bg-stone-50/60 transition-colors">
                  <td className="px-3 sm:px-4 py-3 font-bold text-stone-900">{plot.khesra}</td>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-emerald-900">{plot.area_decimal} {t.decimals}</td>
                  <td className="px-3 sm:px-4 py-3 text-stone-700 font-medium">{plot.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="pt-3 sm:pt-4 border-t border-stone-100">
        <SafetyNote message={record.safety_message} />
      </div>
      </div>
    </article>
  );
}

export default function LandRecordExplorer() {
  const { lang, t } = useLanguage();
  const options = useApiData(getRecordOptions, 'options');
  const speaker = useSpeaker();

  const [districtName, setDistrictName] = useState('');
  const [mauzaName, setMauzaName] = useState('');
  const [khata, setKhata] = useState('');
  const [record, setRecord] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const requestRef = useRef(0);
  const lastSearchRef = useRef(null);

  const districts = options.data?.districts ?? [];
  const district = districts.find((item) => item.district === districtName);
  const mauza = district?.mauzas.find((item) => item.mauza === mauzaName);

  const selectMauza = (entry) => {
    setMauzaName(entry?.mauza ?? '');
    setKhata(String(entry?.khatas[0] ?? ''));
  };

  const selectDistrict = (name) => {
    setDistrictName(name);
    const targetDistrict = districts.find((item) => item.district === name);
    selectMauza(targetDistrict?.mauzas[0]);
  };

  useEffect(() => {
    if (districts.length > 0 && !districtName) {
      selectDistrict(districts[0].district);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districts]);

  const search = async (selection) => {
    if (!selection?.district || !selection?.mauza || !selection?.khata) return;
    requestRef.current += 1;
    const current = requestRef.current;
    lastSearchRef.current = selection;
    speaker.stop();
    setBusy(true);
    setError(null);

    try {
      const data = await searchRecord(selection.district, selection.mauza, selection.khata, lang);
      if (current === requestRef.current) setRecord(data);
    } catch (err) {
      if (current === requestRef.current) {
        setRecord(null);
        setError(err);
      }
    } finally {
      if (current === requestRef.current) setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    search({ district: districtName, mauza: mauzaName, khata });
  };

  const handleQuickPick = (dist, m, k) => {
    setDistrictName(dist);
    setMauzaName(m);
    setKhata(String(k));
    search({ district: dist, mauza: m, khata: String(k) });
  };

  useEffect(() => {
    if (lastSearchRef.current) search(lastSearchRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
      <PageHeader
        title={t.recordTitle}
        intro={t.recordIntro}
      />

      {/* Quick Demo Pick Pills (Horizontally scrollable on mobile) */}
      <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-500">
          {t.quickSamples}:
        </span>
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-0.5">
          {/* Built from the API, so a chip can only ever point at a record that exists. */}
          {districts.flatMap((item) => item.mauzas.flatMap((entry) => entry.khatas.map((number) => (
            <button
              key={`${item.district}-${entry.mauza}-${number}`}
              type="button"
              onClick={() => handleQuickPick(item.district, entry.mauza, number)}
              className="text-xs font-bold px-3 py-1.5 min-h-[38px] rounded-xl bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-950 border border-stone-200 hover:border-emerald-300 transition-colors whitespace-nowrap flex-shrink-0"
            >
              {entry.mauza} · {t.khata} {number}
            </button>
          ))))}
        </div>
      </div>

      {/* Filter Selector Form */}
      <div className="relative overflow-hidden mb-6 sm:mb-8 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs">
        {/* Subtle Cadastral Field Grid */}
        <CadastralFieldPattern className="opacity-[0.035] mix-blend-multiply" />
        <div className="relative z-10">
          {options.loading && <Spinner label={t.loading} />}
        {options.error && <ErrorBox message={errorMessage(options.error, t)} onRetry={options.retry} />}
        {options.data && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
            <SelectField
              id="district-select"
              label={t.district}
              value={districtName}
              onChange={selectDistrict}
            >
              {districts.map((item) => (
                <option key={item.district} value={item.district}>{item.district}</option>
              ))}
            </SelectField>

            <SelectField
              id="mauza-select"
              label={t.mauza}
              value={mauzaName}
              onChange={(name) => selectMauza(district?.mauzas.find((m) => m.mauza === name))}
            >
              {district?.mauzas.map((item) => (
                <option key={item.mauza} value={item.mauza}>{item.mauza}</option>
              ))}
            </SelectField>

            <SelectField
              id="khata-select"
              label={t.khata}
              value={khata}
              onChange={setKhata}
            >
              {mauza?.khatas.map((num) => (
                <option key={num} value={num}>खाता संख्या {num}</option>
              ))}
            </SelectField>

            <button
              type="submit"
              disabled={!khata || busy}
              className="py-3 px-4 min-h-[46px] rounded-xl bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 disabled:opacity-40 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>{t.search}</span>
            </button>
          </form>
        )}
        </div>
      </div>

      {/* Results or Loading */}
      {busy && <Spinner label={t.loading} />}
      {!busy && error && (
        <ErrorBox message={errorMessage(error, t)} onRetry={() => search(lastSearchRef.current)} />
      )}
      {!busy && !error && record && (
        <RecordDetailsView record={record} speaker={speaker} />
      )}
    </div>
  );
}
