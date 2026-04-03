import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';
import { Metadata } from 'next';

const LANG_LABELS: Record<string, string> = {
  en: 'English', hi: 'हिंदी', te: 'తెలుగు', kn: 'ಕನ್ನಡ', ta: 'தமிழ்',
  ml: 'മലയാളം', mr: 'मराठी', bn: 'বাংলা', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ',
  or: 'ଓଡ଼ିଆ', as: 'অসমীয়া', sw: 'Kiswahili', yo: 'Yorùbá', es: 'Español',
};

function parseQAContent(content: string): { question: string; answer: string }[] {
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
}

function getCountryFullName(code: string): string {
  const map: Record<string, string> = {
    IN: 'India', GB: 'United Kingdom', US: 'United States', NG: 'Nigeria', KE: 'Kenya',
  };
  return map[code] || code;
}

export async function generateStaticParams() {
  const supabase = supabaseAdmin();
  const { data: schemes } = await supabase
    .from('schemes')
    .select('slug')
    .not('slug', 'is', null)
    .eq('is_published', true);

  return schemes?.map((scheme) => ({
    slug: scheme.slug,
  })) ?? [];
}

export async function generateMetadata({ 
  params, searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams?: Promise<{ lang?: string }>
}): Promise<Metadata> {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams || Promise.resolve({} as { lang?: string })]);
  const supabase = supabaseAdmin();
  const { data: scheme } = await supabase
    .from('schemes')
    .select('name, content_en, what_you_get, country_code, ministry, local_language')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!scheme) return {};

  const description = scheme.content_en
    ? scheme.content_en.substring(0, 160).replace(/\n/g, ' ')
    : scheme.what_you_get?.substring(0, 160) || `Learn about ${scheme.name} - eligibility, benefits and how to apply.`;

  const baseUrl = `https://schemeatlas.com/schemes/${resolvedParams.slug}`;
  const lang = resolvedSearchParams.lang || 'en';
  const currentUrl = lang === 'en' ? baseUrl : `${baseUrl}?lang=${lang}`;

  const languages: Record<string, string> = {
    en: baseUrl,
    hi: `${baseUrl}?lang=hi`,
  };
  
  if (scheme.local_language && scheme.local_language !== 'hi') {
    languages[scheme.local_language] = `${baseUrl}?lang=${scheme.local_language}`;
  }

  return {
    title: `${scheme.name} 2025 - Eligibility, Benefits & How to Apply | SchemeAtlas`,
    description,
    openGraph: {
      title: `${scheme.name} 2025 | SchemeAtlas`,
      description,
      url: currentUrl,
      type: 'article',
    },
    alternates: {
      canonical: currentUrl,
      languages,
    },
  };
}

export default async function SchemeDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ lang?: string }>
}) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const lang = (resolvedSearchParams.lang || 'en') as 'en' | 'hi' | 'local';
  
  const supabase = supabaseAdmin();
  const { data: scheme } = await supabase
    .from('schemes')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!scheme) notFound();

  // Async task to fetch related schemes, without blocking main thread heavily if possible
  const { data: related } = await supabase
    .from('schemes')
    .select('*')
    .eq('country_code', scheme.country_code)
    .eq('category', scheme.category)
    .eq('is_published', true)
    .neq('id', scheme.id)
    .limit(3);

  // Increment view count via edge (fire and forget)
  supabase.rpc('increment_view_count', { scheme_id: scheme.id }).then();

  const country = COUNTRIES[scheme.country_code];
  const cat = CATEGORIES[scheme.category];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.com';
  const shareText = `Check out this government scheme: ${scheme.name} — ${scheme.benefit_amount}. Find schemes you qualify for free on SchemeAtlas 👉 ${siteUrl}/schemes/${scheme.slug}`;

  const eligibilityList: string[] = scheme.eligibility ? (Array.isArray(scheme.eligibility) ? scheme.eligibility : typeof scheme.eligibility === 'object' ? Object.values(scheme.eligibility).filter(Boolean) as string[] : [String(scheme.eligibility)]) : [];
  const howToApplyList: string[] = scheme.how_to_apply ? (Array.isArray(scheme.how_to_apply) ? scheme.how_to_apply : typeof scheme.how_to_apply === 'object' ? Object.values(scheme.how_to_apply).filter(Boolean) as string[] : [String(scheme.how_to_apply)]) : [];
  const documents: string[] = scheme.documents ? (Array.isArray(scheme.documents) ? scheme.documents : typeof scheme.documents === 'string' ? JSON.parse(scheme.documents || '[]') : []) : [];

  const getActiveContent = () => {
    let active = scheme.content_en;
    if (lang === 'hi' && scheme.content_hi) active = scheme.content_hi;
    if ((lang === scheme.local_language || lang === 'local') && scheme.content_local) active = scheme.content_local;
    return active || scheme.content_en || null;
  };

  const activeContent = getActiveContent();
  const qaSections = activeContent ? parseQAContent(activeContent) : [];

  const availableLangs: { key: string; label: string; code: string }[] = [];
  if (scheme.content_en) availableLangs.push({ key: 'en', code: 'en', label: 'English' });
  if (scheme.content_hi) availableLangs.push({ key: 'hindi', code: 'hi', label: 'हिंदी' });
  if (scheme.content_local && scheme.local_language && scheme.local_language !== 'hi') {
    availableLangs.push({ key: 'local', code: scheme.local_language, label: LANG_LABELS[scheme.local_language] || scheme.local_language });
  }

  const lastUpdated = scheme.last_updated
    ? new Date(scheme.last_updated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: scheme.name,
    description: (scheme.content_en || scheme.what_you_get || '').substring(0, 160).replace(/\n/g, ' '),
    provider: {
      '@type': 'GovernmentOrganization',
      name: scheme.ministry || scheme.category || 'Government',
    },
    areaServed: {
      '@type': scheme.state_name ? 'State' : 'Country',
      name: scheme.state_name || getCountryFullName(scheme.country_code) || scheme.country_code,
    },
    audience: {
      '@type': 'Audience',
      audienceType: (typeof scheme.eligibility === 'string' ? scheme.eligibility : JSON.stringify(scheme.eligibility)).substring(0, 100),
    },
    serviceType: "Government Benefit",
    url: `https://schemeatlas.com/schemes/${scheme.slug}`,
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="page-container py-8 max-w-3xl mx-auto">
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

          {availableLangs.length > 0 ? (
            <div className="mb-8">
              {availableLangs.length > 1 && (
                <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                  {availableLangs.map(l => (
                    <Link
                      key={l.code}
                      href={`/schemes/${scheme.slug}?lang=${l.code}`}
                      replace
                      scroll={false}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                        (lang === l.code || (lang === 'local' && l.key === 'local'))
                          ? 'bg-white text-brand-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {l.label}
                    </Link>
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
          ) : scheme.article_content ? (
            <div 
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed mb-8 prose-h3:text-slate-900 prose-a:text-brand-500"
              dangerouslySetInnerHTML={{ __html: scheme.article_content }}
            />
          ) : scheme.what_you_get ? (
            <p className="text-slate-700 text-lg leading-relaxed mb-8">{scheme.what_you_get}</p>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-center">
              <p className="text-slate-500 text-sm">📄 Detailed guide for this scheme is being prepared. Check back soon or visit the official site.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            {scheme.official_url && (
              <a href={scheme.official_url} target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 text-center">
                Apply on Official Site ↗
              </a>
            )}
            {country && (
              <Link href={`/${scheme.country_code}/check`} className="btn-secondary flex-1 text-center">
                Check If I Qualify →
              </Link>
            )}
          </div>
        </div>

        {eligibilityList.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">👤</span> Who Can Apply (Eligibility)
            </h2>
            <ul className="space-y-2">
              {eligibilityList.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700">
                  <span className="mt-1 w-5 h-5 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</span>
                  {String(item)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {howToApplyList.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span> How to Apply
            </h2>
            <ol className="space-y-4">
              {howToApplyList.map((step, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">{i + 1}</span>
                  <span className="text-slate-700 mt-0.5">{String(step)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

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

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="text-amber-800 text-sm">
            <strong>⚠️ Important Disclaimer:</strong> Always verify scheme details on the official government website.
            Schemes may change eligibility criteria or close without notice. SchemeAtlas is not affiliated with any government.
          </p>
        </div>

        {related && related.length > 0 && (
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
                    <h3 className="font-semibold text-sm text-slate-900 group-hover:text-brand-500 transition-colors mb-1 leading-snug">
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
