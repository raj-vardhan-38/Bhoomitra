import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, FileText, Globe, HelpCircle, Home, MapPin, Menu, Mic, X } from 'lucide-react';
import { LANGUAGES, useLanguage } from '../i18n';

export default function Navbar({ activeTab, setActiveTab }) {
  const { lang, setLang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setLangMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  const navItems = [
    { id: 'landing', label: t.navHome, icon: Home },
    { id: 'ask', label: t.navAsk, icon: Mic },
    { id: 'paper', label: t.navPaper, icon: FileText },
    { id: 'record', label: t.navRecord, icon: MapPin },
    { id: 'rules', label: t.navRules, icon: BookOpen },
    { id: 'help', label: t.navHelp, icon: HelpCircle }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FBF9F5]/98 backdrop-blur-md border-b border-stone-200 shadow-xs w-full">
      {/* Top Advisory Strip (Responsive text) */}
      <div className="bg-slate-900 text-slate-300 px-3 py-1.5 text-[11px] sm:text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center gap-1.5 justify-center leading-tight">
            <span className="truncate sm:whitespace-normal">{t.fraudBanner}</span>
          </div>
          <span className="text-[11px] text-slate-400 hidden md:inline">
            {t.disclaimer}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-18 sm:h-20">
          
          {/* Logo & Branding */}
          <button
            type="button"
            onClick={() => handleNavClick('landing')}
            className="flex items-center gap-3 sm:gap-3.5 text-left min-w-0 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-xl p-1 -ml-1 transition-all"
          >
            <img
              src="/logo.png"
              alt="Bhoomitra Logo"
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
            />
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                  <span className="text-emerald-800">Bhoo</span><span className="text-amber-600">mitra</span>
                </span>
                <span className="text-sm font-bold font-hindi text-stone-400">
                  (<span className="text-emerald-800">भू</span><span className="text-amber-600">मित्र</span>)
                </span>
              </div>
              <span className="text-xs text-stone-500 font-normal hidden md:block mt-1 truncate">
                {t.brandTagline}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Main Navigation">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavClick(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-stone-700 hover:text-emerald-900 hover:bg-stone-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          {/* Language Selector & Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
            {/* Custom Styled Language Selector Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((prev) => !prev)}
                aria-expanded={langMenuOpen}
                aria-haspopup="listbox"
                aria-label={t.languageLabel}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 min-h-[40px] sm:min-h-[44px] rounded-xl border border-stone-300 bg-white hover:border-emerald-700 hover:bg-stone-50/70 text-stone-900 text-xs sm:text-sm font-bold transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              >
                <Globe className="w-4 h-4 text-emerald-800 flex-shrink-0" aria-hidden="true" />
                <span className="font-hindi">{currentLang.short}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-stone-500 transition-transform duration-200 ${
                    langMenuOpen ? 'rotate-180 text-emerald-800' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {langMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-white border border-stone-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  role="listbox"
                  aria-label={t.languageLabel}
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-100 mb-1">
                    {t.chooseLanguage}
                  </div>
                  {LANGUAGES.map((language) => {
                    const isSelected = lang === language.code;
                    return (
                      <button
                        key={language.code}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setLang(language.code);
                          setLangMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs sm:text-sm font-bold transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-950 font-extrabold shadow-2xs'
                            : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                        }`}
                      >
                        <span className="font-hindi">{language.label}</span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-700 flex-shrink-0 stroke-[2.5]" aria-hidden="true" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-xl text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 transition-colors border border-stone-200"
              aria-label={t.toggleMenu}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <nav
          className="lg:hidden bg-white border-b border-stone-200 px-3 sm:px-4 pt-3 pb-6 space-y-3 shadow-xl animate-in fade-in duration-200"
          aria-label="Mobile Navigation"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {navItems.map(({ id, label, icon: Icon }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavClick(id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 py-3.5 min-h-[48px] rounded-xl text-base font-bold transition-all text-left ${
                    isActive
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-stone-800 hover:bg-stone-100 border border-stone-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Language Selection Grid */}
          <div className="pt-3 border-t border-stone-100 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              {t.chooseLanguage}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((language) => {
                const isSelected = lang === language.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => {
                      setLang(language.code);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-extrabold shadow-2xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <span className="font-hindi">{language.short}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0 stroke-[2.5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500 font-medium">
            {t.disclaimer}
          </div>
        </nav>
      )}
    </header>
  );
}
