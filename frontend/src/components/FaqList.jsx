import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FaqList({ faqs = [] }) {
  const [openIndices, setOpenIndices] = useState([0]); // Open first FAQ by default

  const toggle = (index) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 items-start w-full"
      role="region"
      aria-label="Frequently Asked Questions"
    >
      {faqs.map((faq, index) => {
        const isOpen = openIndices.includes(index);
        const headingId = `faq-heading-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <div
            key={faq.question}
            className={`rounded-2xl border transition-all ${
              isOpen
                ? 'border-emerald-600/70 bg-white shadow-xs'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <h3>
              <button
                id={headingId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="w-full p-4 sm:p-5 min-h-[56px] text-left flex items-center justify-between gap-3.5 hover:bg-stone-50/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 rounded-2xl"
              >
                <span className="font-bold text-stone-900 text-sm sm:text-base leading-snug flex items-center gap-2.5 flex-1 min-w-0 pr-1">
                  <span className="w-6 h-6 rounded-md bg-stone-100 text-stone-700 text-xs font-black flex items-center justify-center flex-shrink-0">
                    Q{index + 1}
                  </span>
                  <span>{faq.question}</span>
                </span>

                <ChevronDown
                  className={`w-5 h-5 text-stone-400 transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? 'rotate-180 text-emerald-800' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>
            </h3>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs sm:text-sm text-stone-700 leading-relaxed font-medium border-t border-stone-100"
              >
                <div className="p-3.5 rounded-xl bg-stone-50/80 border border-stone-100 mt-2.5">
                  {faq.answer}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
