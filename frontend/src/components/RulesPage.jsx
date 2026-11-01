import React, { useMemo, useState } from 'react';
import { BookOpen, Check, Filter, HelpCircle, Info, Search, ShieldCheck, X } from 'lucide-react';
import { getHelp, getRules } from '../api';
import { errorMessage, useLanguage } from '../i18n';
import { useApiData } from '../useApiData';
import { ErrorBox, PageHeader, Spinner } from './common';
import { TopographicPattern } from './GeospatialPatterns';

const RULE_CATEGORIES = {
  S1: 'catSurvey',
  S2: 'catDocs',
  S3: 'catDocs',
  S4: 'catDispute',
  S5: 'catDispute',
  S6: 'catFees',
  S7: 'catFees'
};

export default function RulesPage() {
  const { lang, t } = useLanguage();
  const rules = useApiData(() => getRules(lang), lang);
  const help = useApiData(() => getHelp(lang), lang);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [glossaryQuery, setGlossaryQuery] = useState('');

  const categoryTabs = [
    { id: 'all', label: t.allRules },
    { id: 'catSurvey', label: t.catSurvey },
    { id: 'catDocs', label: t.catDocs },
    { id: 'catDispute', label: t.catDispute },
    { id: 'catFees', label: t.catFees }
  ];

  const filteredRules = useMemo(() => {
    if (!rules.data?.rules) return [];
    return rules.data.rules.filter((rule) => {
      const cat = RULE_CATEGORIES[rule.id];
      const matchesCat = selectedCategory === 'all' || cat === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const title = (rule.title || '').toLowerCase();
      const text = (rule.text || rule.text_hi || rule.text_en || '').toLowerCase();
      const id = (rule.id || '').toLowerCase();
      const matchesSearch = !q || title.includes(q) || text.includes(q) || id.includes(q);
      return matchesCat && matchesSearch;
    });
  }, [rules.data, selectedCategory, searchQuery]);

  const filteredGlossary = useMemo(() => {
    if (!help.data?.glossary) return [];
    const q = glossaryQuery.trim().toLowerCase();
    if (!q) return help.data.glossary;
    return help.data.glossary.filter((item) =>
      item.term.toLowerCase().includes(q) || item.meaning.toLowerCase().includes(q)
    );
  }, [help.data, glossaryQuery]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12 w-full">
      <PageHeader
        title={t.rulesTitle}
        intro={t.rulesIntro}
      />

      {/* Trust Notice */}
      <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium flex items-start gap-2.5">
        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>काल्पनिक नियम सूचना:</strong> नियम S1 से S7 प्रोटोटाइप हेतु तैयार किए गए नियम हैं। भूमित्र के उत्तर इन्हीं नमूना नियमों पर आधारित होते हैं ताकि मनगढ़ंत जानकारी न फैले।
        </div>
      </div>

      {/* Rules Section: Search & Category Filter */}
      <div className="mb-6 space-y-3 sm:space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-stone-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchRules}
            aria-label={t.searchRules}
            className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 min-h-[46px] rounded-2xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 text-xs sm:text-base font-medium shadow-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Filter Pills (Scrollable horizontally on mobile) */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 sm:gap-2 pb-0.5" role="tablist">
          {categoryTabs.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3.5 sm:px-4 py-2 min-h-[38px] sm:min-h-[40px] rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rules Grid */}
      {rules.loading && !rules.data && <Spinner label={t.loading} />}
      {rules.error && <ErrorBox message={errorMessage(rules.error, t)} onRetry={rules.retry} />}

      {rules.data && (
        <div className="mb-10 sm:mb-14">
          {filteredRules.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl border border-stone-200 bg-white text-center text-stone-500 text-xs sm:text-sm">
              {t.noRulesFound}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredRules.map((rule) => {
                const catKey = RULE_CATEGORIES[rule.id];
                const catLabel = catKey ? t[catKey] : null;
                const title = rule.title || rule.id;
                const description = rule.text || rule.text_hi || rule.text_en;

                return (
                  <article
                    key={rule.id}
                    className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-xs hover:border-emerald-600 hover:shadow-sm transition-all flex flex-col justify-between space-y-3 sm:space-y-4"
                  >
                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs font-black px-2.5 py-0.5 sm:py-1 rounded-md bg-emerald-800 text-white shadow-2xs">
                          नियम {rule.id}
                        </span>
                        {catLabel && (
                          <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                            {catLabel}
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                        {title}
                      </h2>

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                        {description}
                      </p>
                    </div>

                    <div className="pt-2.5 sm:pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] sm:text-xs text-stone-500 font-medium">
                      <span>संदर्भ: Rule {rule.id}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Land Record Glossary Section */}
      {help.data && (
        <section className="relative overflow-hidden p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-stone-200 shadow-sm space-y-5 sm:space-y-6">
          <TopographicPattern className="opacity-[0.035] mix-blend-multiply" />
          <div className="relative z-10 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3 sm:pb-4">
            <div>
              <h2 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight">
                {t.glossary}
              </h2>
              <p className="text-[11px] sm:text-sm text-stone-600 font-medium">
                बिहार भूमि सर्वे और खतियान से संबंधित मुख्य पारिभाषिक शब्द
              </p>
            </div>

            {/* Glossary Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                placeholder="शब्द खोजें..."
                className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
            {filteredGlossary.map((item) => (
              <div
                key={item.term}
                className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-stone-50 border border-stone-200 space-y-1 hover:border-emerald-300 transition-colors"
              >
                <div className="font-extrabold text-xs sm:text-sm text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>{item.term}</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-medium">
                  {item.meaning}
                </p>
              </div>
            ))}
          </div>
          </div>
        </section>
      )}
    </div>
  );
}
