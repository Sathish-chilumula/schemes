'use client';

import { useState, useEffect } from 'react';
import { LANG_LABELS } from '@/lib/config';

interface SchemeContentProps {
  contentEn: string | null;
  contentHi: string | null;
  contentLocal: string | null;
  localLanguage: string | null;
}

export function SchemeContent({ contentEn, contentHi, contentLocal, localLanguage }: SchemeContentProps) {
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

  return (
    <div className="mb-8">
      {availableLangs.length > 1 && (
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
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

      {qaSections.length > 0 ? (
        <article className="space-y-6">
          {qaSections.map((section, i) => (
            <section key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                  {i + 1}
                </span>
                {section.question}
              </h2>
              <p className="text-slate-600 leading-relaxed pl-9">
                {section.answer}
              </p>
            </section>
          ))}
        </article>
      ) : activeContent ? (
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
          {activeContent.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
