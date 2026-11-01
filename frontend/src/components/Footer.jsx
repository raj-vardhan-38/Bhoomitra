import React from 'react';
import { AlertCircle, ExternalLink, FileText, HelpCircle, MapPin, Mic } from 'lucide-react';
import { useLanguage } from '../i18n';

export default function Footer({ setActiveTab }) {
  const { lang, t } = useLanguage();

  return (
    <footer className="bg-[#F4F1EA] text-stone-700 pt-10 sm:pt-12 pb-8 border-t border-stone-300/80 w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-6 sm:gap-8">
          
          {/* Col 1: Brand & Overview */}
          <div className="md:col-span-5 space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3.5">
              <img
                src="/logo.png"
                alt="Bhoomitra Logo"
                className="w-11 h-11 sm:w-12 sm:h-12 object-contain flex-shrink-0"
              />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                    <span className="text-emerald-800">Bhoo</span><span className="text-amber-600">mitra</span>
                  </span>
                  <span className="text-sm font-bold font-hindi text-stone-400">
                    (<span className="text-emerald-800">भू</span><span className="text-amber-600">मित्र</span>)
                  </span>
                </div>
                <span className="block text-xs text-stone-600 font-medium mt-1">
                  {lang === 'en' ? 'Your land, explained in your language' : t.brandTagline}
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md">
              {t.footerAbout}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-[11px] sm:text-xs font-semibold">
              <span>{lang === 'en' ? 'Rule S6: Survey self-declaration is completely free' : 'नियम S6: सर्वे की स्व-घोषणा पूर्णतः निःशुल्क है'}</span>
            </div>
          </div>

          {/* Col 2: Services / Capabilities */}
          <div className="md:col-span-3 space-y-2.5 sm:space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">{lang === 'en' ? 'Citizen Services' : 'नागरिक सेवाएँ'}</div>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveTab?.('ask'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-900 text-stone-700 transition-colors flex items-center gap-2 py-1 font-medium"
                >
                  <Mic className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.navAsk}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveTab?.('paper'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-900 text-stone-700 transition-colors flex items-center gap-2 py-1 font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.navPaper}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveTab?.('record'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-900 text-stone-700 transition-colors flex items-center gap-2 py-1 font-medium"
                >
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.navRecord}</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { setActiveTab?.('help'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="hover:text-emerald-900 text-stone-700 transition-colors flex items-center gap-2 py-1 font-medium"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                  <span>{t.navHelp}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Sources */}
          <div className="md:col-span-4 space-y-2.5 sm:space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">{lang === 'en' ? 'Official Portals' : 'आधिकारिक स्रोत व लिंक'}</div>
            <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
              <li>
                <a
                  href="https://biharbhumi.bihar.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-900 inline-flex items-center gap-1.5 transition-colors py-1 font-medium"
                >
                  <span>बिहार भूमि पोर्टल (आधिकारिक)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://state.bihar.gov.in/lrc"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-900 inline-flex items-center gap-1.5 transition-colors py-1 font-medium"
                >
                  <span>राजस्व एवं भूमि सुधार विभाग, बिहार</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-2.5 sm:gap-3 text-xs text-stone-700 leading-relaxed shadow-xs">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-bold text-amber-950 block mb-0.5">{lang === 'en' ? 'Demo Disclaimer:' : 'सावधानी एवं अस्वीकरण:'}</span>
            <span className="text-stone-700">{t.disclaimer} {lang === 'en' ? 'This portal does not provide official legal advice. For any statutory action, please contact your Circle Office.' : 'यह पोर्टल आधिकारिक कानूनी सलाह नहीं प्रदान करता। किसी भी वैधानिक कार्रवाई के लिए कृपया संबंधित अंचल कार्यालय से संपर्क करें।'}</span>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-5 border-t border-stone-300/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] sm:text-xs text-stone-500 text-center sm:text-left">
          <div>© 2026 Bhoomitra. {lang === 'en' ? 'Digital Land & Survey Citizen Assistance Service' : 'बिहार के नागरिकों के लिए डिजिटल भूमि सहायता सेवा'}</div>
          <div className="font-medium text-stone-600">{lang === 'en' ? 'Survey Camps · Vanshavali · Self-Declaration Support' : 'अंचल शिविर · वंशावली · स्व-घोषणा सहायता'}</div>
        </div>
      </div>
    </footer>
  );
}
