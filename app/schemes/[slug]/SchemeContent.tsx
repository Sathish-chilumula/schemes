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
    const sections: { question: string; answer: string }[] = [];
    const parts = content.split(/(?=(?:\*\*?)?(?:Q\d+:|\d+\.)\s*)/i);
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const lines = trimmed.split('\n');
      const questionLine = lines[0]?.trim() || '';
      const answerLines = lines.slice(1).join('\n').trim();
      if (questionLine && answerLines) {
        const question = questionLine.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/Q\d+:\s*/i, '').trim();
        const answer = answerLines.replace(/\*\*/g, '').trim();
        if (question.length > 3) sections.push({ question, answer });
      }
    }
    return sections;
  };

  const activeContent = lang === 'hi' ? contentHi : (lang === localLanguage ? contentLocal : contentEn);
  const qaSections = activeContent ? parseQAContent(activeContent) : [];

  const availableLangs: { code: string; label: string }[] = [];
  if (contentEn) availableLangs.push({ code: 'en', label: 'English' });
  if (contentHi) availableLangs.push({ code: 'hi', label: 'हिंदी' });
  if (contentLocal && localLanguage && localLanguage !== 'hi') {
    availableLangs.push({ code: localLanguage, label: LANG_LABELS[localLanguage] || localLanguage });
  }

  // The generate-content LLM outputs 8 specific questions. 
  // We map indices 0 through 4 to specific structured SEO headers.
  const hasCleanStructure = qaSections.length >= 5;
  const overview = hasCleanStructure ? qaSections[0] : null;
  const eligibility = hasCleanStructure ? qaSections[1] : null;
  const benefits = hasCleanStructure ? qaSections[2] : null;
  const application = hasCleanStructure ? qaSections[3] : null;
  const docs = hasCleanStructure ? qaSections[4] : null;
  const faqs = hasCleanStructure ? qaSections.slice(5) : qaSections;

  return (
    <div className="mb-8 scheme-seo-article">

      {availableLangs.length > 1 && (
        <div className="flex gap-1 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
          {availableLangs.map(l => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                // Update URL without reload
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
      )}

      {activeContent ? (
        <article className="prose prose-slate max-w-none prose-h2:text-slate-900 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4">
          
          <p className="text-lg text-slate-700 leading-relaxed mb-6 font-medium">
            {overview ? overview.answer : fallbackWhatYouGet || `Learn about ${schemeName} including benefits, eligibility, and how to apply.`}
          </p>

          <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-2xl">🌟</span> Benefits
          </h2>
          <p className="text-slate-700 leading-relaxed">
            {benefits ? benefits.answer : fallbackBenefitAmount || 'Not specified'}
          </p>

          <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-2xl">👤</span> Eligibility Criteria
          </h2>
          {eligibility ? (
            <p className="text-slate-700 leading-relaxed">{eligibility.answer}</p>
          ) : eligibilityList.length > 0 ? (
            <ul className="space-y-2 !pl-0">
              {eligibilityList.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 list-none">
                  <span className="mt-1 w-5 h-5 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  {String(item)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 italic">Eligibility details currently being updated.</p>
          )}

          <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-2xl">📂</span> Required Documents
          </h2>
          {docs ? (
             <p className="text-slate-700 leading-relaxed">{docs.answer}</p>
          ) : documents.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-2 not-prose">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                  <span className="text-slate-400">📄</span>
                  <span className="text-slate-700 text-sm">{doc}</span>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-slate-500 italic">No specific documents listed.</p>
          )}

          <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <span className="text-2xl">📝</span> Application Process
          </h2>
          {application ? (
            <p className="text-slate-700 leading-relaxed">{application.answer}</p>
          ) : howToApplyList.length > 0 ? (
            <ol className="space-y-4 !pl-0">
              {howToApplyList.map((step, i) => (
                <li key={i} className="flex items-start gap-4 list-none">
                  <span className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">{i + 1}</span>
                  <span className="text-slate-700 mt-0.5">{String(step)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-slate-500 italic">Visit the official website for application details.</p>
          )}

          {faqs.length > 0 && (
             <>
                <h2 className="flex items-center gap-2 border-b border-slate-100 pb-2 mt-12 mb-6">
                  <span className="text-2xl">❓</span> Frequently Asked Questions
                </h2>
                <div className="space-y-6 not-prose">
                  {faqs.map((faq, i) => (
                    <div key={i} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                      <h3 className="text-slate-900 font-bold mb-2 flex items-start gap-2 text-base">
                        <span className="text-brand-500 font-extrabold mt-0.5">Q.</span> 
                        {faq.question}
                      </h3>
                      <p className="text-slate-600 pl-6 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
             </>
          )}
        </article>
      ) : (
        <div className="prose prose-slate max-w-none text-slate-700">
           {/* Ultimate fallback if no LLM data available but component is rendered */}
           <p>{fallbackWhatYouGet}</p>
        </div>
      )}
    </div>
  );
}
