'use client';

import { useState, useEffect } from 'react';
import { LANG_LABELS } from '@/lib/config';

interface SchemeContentProps {
  contentEn: string | null;
  contentHi: string | null;
  contentLocal: string | null;
  localLanguage: string | null;
  fallbackWhatYouGet?: string | null;
  fallbackBenefitAmount?: string | null;
  eligibilityList?: string[];
  howToApplyList?: string[];
  documents?: string[];
  schemeName?: string;
}

export function SchemeContent({ 
  contentEn, 
  contentHi, 
  contentLocal, 
  localLanguage,
  fallbackWhatYouGet,
  fallbackBenefitAmount,
  eligibilityList = [],
  howToApplyList = [],
  documents = [],
  schemeName = 'this scheme'
}: SchemeContentProps) {
  const [lang, setLang] = useState('en');

  // Sync with URL search params on mount if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang) setLang(urlLang);
    }
  }, []);

  const parseQAContent = (content: string) => {
    if (!content) return [];
    
    // Pattern 1: "Q: question?\nA: answer"
    if (content.includes('Q:') && content.includes('A:')) {
      const pairs = [];
      const lines = content.split('\n');
      let currentQ = '';
      let currentA = '';
      
      for (const line of lines) {
        if (line.startsWith('Q:') || line.match(/^\d+\.\s+What|Who|How|When|Is /)) {
          if (currentQ && currentA) pairs.push({ question: currentQ, answer: currentA });
          currentQ = line.replace(/^Q:\s*/, '').replace(/^\d+\.\s*/, '');
          currentA = '';
        } else if (line.startsWith('A:')) {
          currentA = line.replace(/^A:\s*/, '');
        } else if (currentA && line.trim()) {
          currentA += ' ' + line.trim();
        }
      }
      if (currentQ && currentA) pairs.push({ question: currentQ, answer: currentA });
      return pairs;
    }
    
    // Pattern 2: Old markdown format — convert ## sections to Q&A
    const sections = content.split(/##\s+/);
    return sections
      .filter(s => s.trim().length > 50)
      .map(section => {
        const lines = section.split('\n').filter(l => l.trim());
        const heading = lines[0]
          .replace(/📌|💰|👥|🚫|📄|📝|⚠️|💡|❓|🌟/g, '')
          .trim();
        const body = lines.slice(1).join(' ')
          .replace(/\*\*/g, '')
          .replace(/[-•]\s/g, '')
          .trim();
        
        // Convert heading to question format
        const question = heading.includes('?') 
          ? heading 
          : `What is the ${heading.toLowerCase()} for this scheme?`;
        
        return { question, answer: body };
      })
      .filter(pair => pair.question && pair.answer);
  };

  const activeContent = lang === 'hi' ? contentHi : (lang === localLanguage ? contentLocal : contentEn);
  const qaSections = activeContent ? parseQAContent(activeContent) : [];

  const availableLangs: { code: string; label: string }[] = [];
  if (contentEn) availableLangs.push({ code: 'en', label: 'English' });
  if (contentHi) availableLangs.push({ code: 'hi', label: 'हिंदी' });
  if (contentLocal && localLanguage && localLanguage !== 'hi') {
    availableLangs.push({ code: localLanguage, label: LANG_LABELS[localLanguage] || localLanguage });
  }

  const formatTextAsParagraphs = (text: string, baseClassName: string) => {
    if (!text) return null;
    return text.split(/\n+/).filter(p => p.trim()).map((p, i) => (
      <p key={i} className={`${baseClassName} mb-3`.trim()}>{p.trim()}</p>
    ));
  };

  return (
    <div className="mb-8 scheme-seo-article">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {availableLangs.length > 1 ? (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {availableLangs.map(l => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('lang', l.code);
                    window.history.replaceState({}, '', url);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                  lang === l.code
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        ) : <div />}

        <button 
          onClick={() => {
            const url = encodeURIComponent(window.location.href);
            const text = encodeURIComponent(`Check out ${schemeName} on SchemeAtlas: `);
            window.open(`https://wa.me/?text=${text}${url}`, '_blank');
          }}
          className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors w-fit"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          Share on WhatsApp
        </button>
      </div>

      {qaSections.length > 0 ? (
        <article className="mt-8">
          {qaSections.map((pair, index) => (
            <section key={index} className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500 transform origin-left transition-transform duration-300"></div>
              
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 flex items-start gap-4">
                  <span className="text-brand-500 font-extrabold mt-1 text-2xl leading-none">Q.</span>
                  <span className="leading-snug">{pair.question}</span>
                </h2>
                <div className="text-slate-700 leading-relaxed pl-10 text-lg">
                  {formatTextAsParagraphs(pair.answer, "mb-4")}
                </div>
              </div>
            </section>
          ))}
        </article>
      ) : (
        <article className="prose prose-slate max-w-none prose-h2:text-slate-900 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4">
           {fallbackWhatYouGet ? formatTextAsParagraphs(fallbackWhatYouGet, "text-slate-700 mb-4") : null}
           {eligibilityList.length > 0 && (
             <>
               <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2">
                 <span className="text-2xl">👤</span> Eligibility Criteria
               </h2>
               <ul className="space-y-2 !pl-0">
                 {eligibilityList.map((item, i) => (
                   <li key={i} className="flex items-start gap-3 text-slate-700 list-none">
                     <span className="mt-1 w-5 h-5 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                     {String(item)}
                   </li>
                 ))}
               </ul>
             </>
           )}
        </article>
      )}
    </div>
  );
}
