'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { COUNTRIES } from '@/lib/config';

export function CountrySwitcher({ initialCountry = 'IN' }: { initialCountry?: string }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [current, setCurrent] = useState<string>(initialCountry);

  const handleSelect = (code: string) => {
    setCurrent(code);
    setIsOpen(false);
    router.push(`/${code}`);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100/10 transition-colors text-sm font-semibold text-inherit"
      >
        <span className="text-sm font-bold">{COUNTRIES[current]?.name || current}</span>
        <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in-up">
            <div className="p-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
              Select Region
            </div>
            <div className="py-1">
              {Object.entries(COUNTRIES).map(([code, config]) => (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                    current === code ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600'
                  }`}
                >
                  <span className="text-xl">{config.flag}</span>
                  <span>{config.name}</span>
                  {current === code && <span className="ml-auto text-brand-500 font-bold">✓</span>}
                </button>
              ))}
              <div className="border-t border-slate-100 my-1"></div>
              <button
                onClick={() => { setIsOpen(false); router.push('/schemes'); }}
                className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              >
                🌍 Global Schemes Index
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
