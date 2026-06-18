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
  initialLang?: string;
}

interface StructuredContent {
  intro: string;
  tableOfContents: string[];
  sections: { heading: string; content: string }[];
  faqs: { q: string; a: string }[];
}

// ─── Try to parse structured JSON (new Money Guide format) ───────────────
function tryParseStructured(content: string | null): StructuredContent | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.sections) && parsed.intro) {
      if (!Array.isArray(parsed.faqs)) parsed.faqs = [];
      if (!Array.isArray(parsed.tableOfContents)) parsed.tableOfContents = [];
      return parsed as StructuredContent;
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Inline FAQ Accordion ────────────────────────────────────────────────
function FAQAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  
  const cleanFaqs = faqs.map(faq => ({
    q: faq.q?.replace(/^(Q:\s*)+/i, '').trim() || '',
    a: faq.a?.replace(/^(A:\s*)+/i, '').trim() || ''
  }));

  return (
    <div className="space-y-3">
      {cleanFaqs.map((faq, i) => (
        <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
          >
            <span className="font-semibold text-slate-800 leading-snug pr-4">{faq.q}</span>
            <span className={`text-2xl text-brand-500 transition-transform duration-200 flex-shrink-0 ${open === i ? 'rotate-45' : ''}`}>+</span>
          </button>
          {open === i && (
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-slate-700 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Structured (Money Guide) Renderer ──────────────────────────────────
function StructuredRenderer({ content, lang }: { content: StructuredContent; lang: string }) {
  return (
    <div>
      {/* Intro */}
      {content.intro && (
        <p className="text-lg sm:text-xl text-slate-700 leading-relaxed font-medium mb-8 p-6 bg-brand-50/40 rounded-2xl border border-brand-100">
          {content.intro}
        </p>
      )}

      {/* Table of Contents */}
      {content.tableOfContents && content.tableOfContents.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-10">
          <div className="font-bold text-slate-700 text-sm uppercase tracking-widest mb-3">📋 In This Guide</div>
          <ol className="list-none space-y-1">
            {content.tableOfContents.map((item, i) => (
              <li key={i}>
                <a
                  href={`#section-${i}`}
                  className="flex items-center gap-2 text-brand-600 hover:text-brand-800 text-sm font-medium py-1 hover:underline transition-colors"
                >
                  <span className="text-brand-400 font-bold">{i + 1}.</span>
                  {item}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Sections */}
      <article className="space-y-8 mt-4">
        {content.sections.map((section, i) => (
          <div key={i}>
            <section
              id={`section-${i}`}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group"
            >
              <div className="flex items-start gap-0">
                <div className="w-1.5 self-stretch bg-brand-500 flex-shrink-0 rounded-l-3xl" />
                <div className="flex-1 p-6 sm:p-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">{section.heading}</h2>
                  <div className="text-slate-700 leading-relaxed text-base sm:text-lg whitespace-pre-line">
                    {section.content}
                  </div>
                </div>
              </div>
            </section>
          </div>
        ))}
      </article>

      {/* FAQs */}
      {content.faqs && content.faqs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">❓ Frequently Asked Questions</h2>
          <FAQAccordion faqs={content.faqs} />
        </div>
      )}

    </div>
  );
}

// ─── Legacy Plain-Text Renderer ─────────────────────────────────────────
function legacyParseQAContent(content: string) {
  if (!content) return { overview: '', qa: [] };

  let overview = '';
  const qa: { question: string; answer: string }[] = [];

  const numberedPattern = /^(\d+)\.\s+([^:]+):/m;
  if (numberedPattern.test(content)) {
    const parts = content.split(/^(\d+)\.\s+([^:]+):/m).filter(p => p.trim());
    for (let i = 0; i < parts.length; i += 3) {
      if (i + 2 < parts.length) {
        const heading = parts[i + 1].trim();
        const body = parts[i + 2].trim();
        qa.push({ question: heading, answer: body });
      }
    }
    return { overview: '', qa };
  }

  if (content.includes('Q:') && content.includes('A:')) {
    const lines = content.split('\n');
    let currentQ = '';
    let currentA = '';
    let foundFirstQ = false;
    for (const line of lines) {
      const isQuestion = line.startsWith('Q:') || line.match(/^\d+\.\s+(What|Who|How|When|Is )/);
      if (isQuestion) {
        foundFirstQ = true;
        if (currentQ && currentA) qa.push({ question: currentQ, answer: currentA });
        currentQ = line.replace(/^Q:\s*/, '').replace(/^\d+\.\s*/, '');
        currentA = '';
      } else if (line.startsWith('A:')) {
        currentA = line.replace(/^A:\s*/, '');
      } else if (!foundFirstQ) {
        if (line.trim()) overview += (overview ? '\n' : '') + line.trim();
      } else if (currentA && line.trim()) {
        currentA += ' ' + line.trim();
      }
    }
    if (currentQ && currentA) qa.push({ question: currentQ, answer: currentA });
    return { overview, qa };
  }

  const sections = content.split(/##\s+/).filter(s => s.trim().length > 10);
  if (sections.length > 0) {
    const parsedSections = sections.map(section => {
      const lines = section.split('\n').filter(l => l.trim());
      if (lines.length === 0) return null;
      const heading = lines[0].replace(/📌|💰|👥|🚫|📄|📝|⚠️|💡|❓|🌟/g, '').trim();
      const body = lines.slice(1).join('\n').replace(/\*\*/g, '').replace(/[-•]\s/g, '').trim();
      if (!body && heading.length > 50) return { question: 'Overview', answer: heading };
      const question = heading.includes('?') ? heading : `What is the ${heading.toLowerCase()} for this scheme?`;
      return { question, answer: body || heading };
    }).filter(Boolean) as { question: string; answer: string }[];
    return { overview: '', qa: parsedSections };
  }

  return { overview: content, qa: [] };
}

// ─── Main Component ──────────────────────────────────────────────────────
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
  schemeName = 'this scheme',
  initialLang = 'en'
}: SchemeContentProps) {
  // Read initial lang from server prop for SSR
  const [lang, setLang] = useState(initialLang);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang && urlLang !== lang) setLang(urlLang);
    }
  }, [lang]);

  const formatTextAsParagraphs = (text: string, baseClassName: string) => {
    if (!text) return null;
    return text.split(/\n+/).filter(p => p.trim()).map((p, i) => (
      <p key={i} className={`${baseClassName} mb-3`.trim()}>{p.trim()}</p>
    ));
  };

  const availableLangs: { code: string; label: string }[] = [];
  if (contentEn) availableLangs.push({ code: 'en', label: 'English' });
  if (contentHi) availableLangs.push({ code: 'hi', label: 'हिंदी' });
  if (contentLocal && localLanguage && localLanguage !== 'hi') {
    availableLangs.push({ code: localLanguage, label: LANG_LABELS[localLanguage] || localLanguage });
  }

  return (
    <div className="mb-8 scheme-seo-article">

      {/* Language switcher + WhatsApp share */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {availableLangs.length > 1 ? (
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {availableLangs.map(l => {
              // Build the href for this language variant:
              // - English → remove ?lang param (canonical URL)
              // - Others  → ?lang=hi / ?lang=te / etc.
              // The href is ALWAYS rendered in SSR HTML so Ahrefs/Googlebot
              // can discover and index ?lang=hi pages as real inbound links.
              const langHref = l.code === 'en'
                ? `?`
                : `?lang=${l.code}`;

              return (
                <a
                  key={l.code}
                  href={langHref}
                  onClick={(e) => {
                    // Progressive enhancement: prevent full page reload.
                    // JS handles the content switch inline; href stays crawlable.
                    e.preventDefault();
                    setLang(l.code);
                    if (typeof window !== 'undefined') {
                      const url = new URL(window.location.href);
                      if (l.code === 'en') {
                        url.searchParams.delete('lang');
                      } else {
                        url.searchParams.set('lang', l.code);
                      }
                      window.history.replaceState({}, '', url);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 no-underline ${
                    lang === l.code
                      ? 'bg-white text-brand-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {l.label}
                </a>
              );
            })}
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

      {/* Content per language */}
      {availableLangs.map(l => {
        const contentForLang = l.code === 'en' ? contentEn : l.code === 'hi' ? contentHi : contentLocal;
        const structured = tryParseStructured(contentForLang);

        return (
          <div key={l.code} className={lang === l.code ? 'block' : 'hidden'}>
            {structured ? (
              /* ── NEW: Money Guide premium renderer ── */
              <StructuredRenderer content={structured} lang={l.code} />
            ) : (
              /* ── LEGACY: plain-text Q&A renderer (backward compat) ── */
              (() => {
                const { overview, qa } = contentForLang
                  ? legacyParseQAContent(contentForLang)
                  : { overview: '', qa: [] };
                return (
                  <>
                    {overview && (
                      <section className="mb-12 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500" />
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
                          <span className="w-1.5 h-8 bg-brand-500 rounded-full" />
                          Scheme Overview
                        </h2>
                        <div className="text-slate-700 leading-relaxed text-lg sm:text-xl font-medium whitespace-pre-wrap">
                          {formatTextAsParagraphs(overview, 'mb-4')}
                        </div>
                      </section>
                    )}
                    {qa.length > 0 ? (
                      <article className="mt-8">
                        {qa.map((pair, index) => (
                          <div key={index}>
                            <section className="mb-10 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 relative group overflow-hidden">
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-500 transform origin-left transition-transform duration-300" />
                              <div className="flex-1">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 flex items-start gap-4">
                                  <span className="text-brand-500 font-extrabold mt-1 text-2xl leading-none">Q.</span>
                                  <span className="leading-snug">{pair.question}</span>
                                </h2>
                                <div className="text-slate-700 leading-relaxed pl-10 text-lg">
                                  {formatTextAsParagraphs(pair.answer, 'mb-4')}
                                </div>
                              </div>
                            </section>
                          </div>
                        ))}
                      </article>
                    ) : (
                      <article className="prose prose-slate max-w-none prose-h2:text-slate-900 prose-h2:text-xl prose-h2:font-bold prose-h2:mt-10 prose-h2:mb-4">
                        {fallbackWhatYouGet ? formatTextAsParagraphs(fallbackWhatYouGet, 'text-slate-700 mb-4') : null}
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
                  </>
                );
              })()
            )}
          </div>
        );
      })}
    </div>
  );
}
