'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Navbar } from '@/components/Navbar';
import { supabase, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';

// Language display names
const LANG_LABELS: Record<string, string> = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  ta: 'தமிழ்',
  ml: 'മലയാളം',
  mr: 'मराठी',
  bn: 'বাংলা',
  gu: 'ગુજરાતી',
  pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ',
  as: 'অসমীয়া',
  sw: 'Kiswahili',
  yo: 'Yorùbá',
  es: 'Español',
};

// Parse Q&A content into structured sections
function parseQAContent(content: string): { question: string; answer: string }[] {
  if (!content) return [];
  const sections: { question: string; answer: string }[] = [];
  // Split by numbered questions: "1.", "2.", etc.
  const parts = content.split(/(?=\d+\.\s)/);
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // Extract question (first line) and answer (rest)
    const lines = trimmed.split('\n');
    const questionLine = lines[0]?.trim() || '';
    const answerLines = lines.slice(1).join('\n').trim();
    if (questionLine && answerLines) {
      // Remove the number prefix like "1. "
      const question = questionLine.replace(/^\d+\.\s*/, '');
      sections.push({ question, answer: answerLines });
    }
  }
  return sections;
}

// Get country full name from code
function getCountryFullName(code: string): string {
  const map: Record<string, string> = {
    IN: 'India', GB: 'United Kingdom', US: 'United States',
    NG: 'Nigeria', KE: 'Kenya',
  };
  return map[code] || code;
}

export default function SchemeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [related, setRelated] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLang, setActiveLang] = useState<'en' | 'hi' | 'local'>('en');

  useEffect(() => {
    supabase
      .from('schemes')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        setScheme(data);
        setLoading(false);
        if (data) {
          // Increment views asynchronously
          supabase.rpc('increment_view_count', { scheme_id: data.id }).then();
          
          supabase
            .from('schemes')
            .select('*')
            .eq('country_code', data.country_code)
            .eq('category', data.category)
            .eq('is_published', true)
            .neq('id', data.id)
            .limit(3)
            .then(({ data: rel }) => setRelated(rel || []));
        }
      });
  }, [slug]);

  // Set page title dynamically
  useEffect(() => {
    if (scheme) {
      document.title = `${scheme.name} 2025 - Eligibility, Benefits & How to Apply | SchemeAtlas`;
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      const descContent = `Learn about ${scheme.name} - eligibility criteria, benefit amount, how to apply and required documents. Updated guide for 2025.`;
      if (metaDesc) {
        metaDesc.setAttribute('content', descContent);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = descContent;
        document.head.appendChild(meta);
      }
      // Set canonical
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `https://schemeatlas.com/schemes/${slug}`;
    }
  }, [scheme, slug]);

  const country = scheme ? COUNTRIES[scheme.country_code] : null;
  const cat = scheme ? CATEGORIES[scheme.category] : null;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.com';
  const shareText = scheme
    ? `Check out this government scheme: ${scheme.name} — ${scheme.benefit_amount}. Find schemes you qualify for free on SchemeAtlas 👉 ${siteUrl}/schemes/${slug}`
    : '';

  // Parse eligibility and how_to_apply (they may be JSON or plain string)
  const eligibilityList: string[] = scheme?.eligibility
    ? Array.isArray(scheme.eligibility)
      ? scheme.eligibility
      : typeof scheme.eligibility === 'object'
      ? Object.values(scheme.eligibility).filter(Boolean) as string[]
      : [String(scheme.eligibility)]
    : [];

  const howToApplyList: string[] = scheme?.how_to_apply
    ? Array.isArray(scheme.how_to_apply)
      ? scheme.how_to_apply
      : typeof scheme.how_to_apply === 'object'
      ? Object.values(scheme.how_to_apply).filter(Boolean) as string[]
      : [String(scheme.how_to_apply)]
    : [];

  const documents: string[] = scheme?.documents
    ? Array.isArray(scheme.documents)
      ? scheme.documents
      : typeof scheme.documents === 'string'
      ? JSON.parse(scheme.documents || '[]')
      : []
    : [];

  // Get the Q&A content for the active language
  const getActiveContent = () => {
    if (!scheme) return null;
    switch (activeLang) {
      case 'en': return scheme.content_en || null;
      case 'hi': return scheme.content_hi || null;
      case 'local': return scheme.content_local || null;
      default: return null;
    }
  };

  const activeContent = getActiveContent();
  const qaSections = activeContent ? parseQAContent(activeContent) : [];

  // Determine which language tabs to show
  const availableLangs: { key: 'en' | 'hi' | 'local'; label: string }[] = [];
  if (scheme) {
    if (scheme.content_en) availableLangs.push({ key: 'en', label: 'English' });
    if (scheme.content_hi) availableLangs.push({ key: 'hi', label: 'हिंदी' });
    if (scheme.content_local && scheme.local_language && scheme.local_language !== 'hi') {
      availableLangs.push({ key: 'local', label: LANG_LABELS[scheme.local_language] || scheme.local_language });
    }
  }

  // Format last_updated
  const lastUpdated = scheme?.last_updated
    ? new Date(scheme.last_updated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  // JSON-LD Structured Data
  const jsonLd = scheme ? {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: scheme.name,
    description: (scheme.content_en || scheme.what_you_get || '').substring(0, 160),
    provider: {
      '@type': 'GovernmentOrganization',
      name: scheme.ministry || scheme.category || 'Government',
    },
    areaServed: {
      '@type': 'Country',
      name: getCountryFullName(scheme.country_code),
    },
    audience: {
      '@type': 'Audience',
      audienceType: (typeof scheme.eligibility === 'string'
        ? scheme.eligibility
        : JSON.stringify(scheme.eligibility)
      ).substring(0, 100),
    },
    url: `https://schemeatlas.com/schemes/${scheme.slug}`,
  } : null;

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* JSON-LD Schema */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      {loading ? (
        <div className="page-container py-16 max-w-3xl mx-auto space-y-6">
          <div className="skeleton" style={{ height: 36, width: '60%' }} />
          <div className="skeleton" style={{ height: 20, width: '40%' }} />
          <div className="skeleton" style={{ height: 200 }} />
          <div className="skeleton" style={{ height: 150 }} />
        </div>
      ) : !scheme ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Scheme not found</h1>
          <p className="text-slate-500 mb-4">This scheme may have been removed or the URL is incorrect.</p>
          <Link href="/schemes" className="btn-primary">Browse All Schemes</Link>
        </div>
      ) : (
        <div className="page-container py-8 max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
            <Link href="/" className="hover:text-brand-500">Home</Link>
            <span>›</span>
            <Link href="/schemes" className="hover:text-brand-500">Schemes</Link>
            {country && (
              <>
                <span>›</span>
                <Link href={`/${scheme.country_code}`} className="hover:text-brand-500">
                  {country.flag} {country.name}
                </Link>
              </>
            )}
            <span>›</span>
            <span className="text-slate-600 truncate max-w-xs">{scheme.name}</span>
          </div>

          {/* Header */}
            <div className="relative rounded-xl overflow-hidden mb-6 bg-slate-900 border border-slate-100">
              {scheme.image_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                  style={{ backgroundImage: `url(${scheme.image_url})` }}
                />
              )}
              <div className="relative z-10 p-8 sm:p-10">
                <div className="flex items-start gap-3 mb-4 flex-wrap">
                  {cat && (
                    <span className={`badge ${cat.bgColor} ${cat.color} bg-white/90 backdrop-blur`}>
                      {cat.icon} {scheme.category}
                    </span>
                  )}
                  {country && (
                    <span className="badge bg-white/90 text-slate-800 backdrop-blur">
                      {country.flag} {country.name}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2 drop-shadow-md">
                  {scheme.name}
                </h1>
                {lastUpdated && (
                  <p className="text-slate-300 text-sm font-medium mt-1">
                    📅 Last Updated: {lastUpdated}
                  </p>
                )}
                <p className="text-slate-200 text-sm font-medium mt-1">Real-time AI Match Confidence: High</p>
              </div>
            </div>

            <div className="card p-8 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-3 w-full sm:w-auto">
                  <div className="text-xs text-green-600 font-semibold mb-0.5 uppercase tracking-wider">Benefit Amount</div>
                  <div className="text-2xl font-extrabold text-green-700">{scheme.benefit_amount}</div>
                </div>
              </div>

              {/* ══ Language Switcher + Q&A Content ══ */}
              {availableLangs.length > 0 ? (
                <div className="mb-8">
                  {/* Language Tabs */}
                  {availableLangs.length > 1 && (
                    <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                      {availableLangs.map(lang => (
                        <button
                          key={lang.key}
                          onClick={() => setActiveLang(lang.key)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                            activeLang === lang.key
                              ? 'bg-white text-brand-600 shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Q&A Sections */}
                  {qaSections.length > 0 ? (
                    <div className="space-y-6">
                      {qaSections.map((section, i) => (
                        <div key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                          <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-start gap-2">
                            <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                              {i + 1}
                            </span>
                            {section.question}
                          </h3>
                          <p className="text-slate-600 leading-relaxed pl-9">
                            {section.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : activeContent ? (
                    <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
                      {activeContent.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : scheme.article_content ? (
                <div 
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed mb-8 prose-h3:text-slate-900 prose-a:text-brand-500"
                  dangerouslySetInnerHTML={{ __html: scheme.article_content }}
                />
              ) : scheme.what_you_get ? (
                <p className="text-slate-700 text-lg leading-relaxed mb-8">{scheme.what_you_get}</p>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-center">
                  <p className="text-slate-500 text-sm">📄 Detailed guide coming soon</p>
                </div>
              )}

              {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {scheme.official_url && (
                <a
                  href={scheme.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="apply-official"
                  className="btn-primary flex-1 text-center"
                >
                  Apply on Official Site ↗
                </a>
              )}
              {country && (
                <Link
                  href={`/${scheme.country_code}/check`}
                  className="btn-secondary flex-1 text-center"
                >
                  Check If I Qualify →
                </Link>
              )}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                id="share-whatsapp-scheme"
                className="btn-secondary flex-1 text-center text-green-600 border-green-500"
              >
                📱 Share on WhatsApp
              </a>
            </div>
          </div>

          {/* Eligibility */}
          {eligibilityList.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">👤</span> Who Can Apply
              </h2>
              <ul className="space-y-2">
                {eligibilityList.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-700">
                    <span className="mt-1 w-5 h-5 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      ✓
                    </span>
                    {String(item)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* How to Apply */}
          {howToApplyList.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📝</span> How to Apply
              </h2>
              <ol className="space-y-4">
                {howToApplyList.map((step, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {i + 1}
                    </span>
                    <span className="text-slate-700 mt-0.5">{String(step)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Documents */}
          {documents.length > 0 && (
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📂</span> Documents Required
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {documents.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                    <span className="text-slate-400">📄</span>
                    <span className="text-slate-700 text-sm">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>⚠️ Important:</strong> Always verify scheme details on the official government website.
              Schemes may change eligibility criteria or close without notice. SchemeAtlas is not affiliated with any government.
            </p>
          </div>

          {/* Related Schemes */}
          {related.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Related Schemes</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map(r => {
                  const rCat = CATEGORIES[r.category];
                  return (
                    <Link key={r.id} href={`/schemes/${r.slug}`} className="card p-4 group">
                      {rCat && (
                        <span className={`badge ${rCat.bgColor} ${rCat.color} mb-2`}>
                          {rCat.icon} {r.category}
                        </span>
                      )}
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-brand-500
                                     transition-colors mb-1 leading-snug">
                        {r.name}
                      </h3>
                      <p className="text-xs font-bold text-brand-500">{r.benefit_amount}</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200
                      flex justify-around items-center py-2 z-50 md:hidden">
        {[
          { href: '/', icon: '🏠', label: 'Home' },
          { href: scheme ? `/${scheme.country_code}/check` : '/IN/check', icon: '🔍', label: 'Check' },
          { href: '/schemes', icon: '📋', label: 'Schemes' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="nav-link">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
