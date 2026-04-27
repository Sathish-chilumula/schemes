import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { supabaseAdmin } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';
import { Metadata } from 'next';
import { SchemeContent } from './SchemeContent';
import { slugify } from '@/lib/seo';
import { ViewCounter } from '@/components/ViewCounter';
import React from 'react';

const COUNTRY_NAMES: Record<string, string> = {
  'IN': 'India',
  'GB': 'United Kingdom', 
  'US': 'United States',
  'NG': 'Nigeria',
  'KE': 'Kenya',
};

function cleanMarkdown(text: any): string {
  if (!text) return '';
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  return str
    .replace(/#{1,6}\s/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/[-•]\s/g, '')
    .replace(/📌|💰|👥|🚫|📄|📝|⚠️|💡|❓|🌟/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

function safeString(value: any, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const flat: string[] = [];
    const flatten = (v: any) => {
      if (typeof v === 'string') flat.push(v);
      else if (Array.isArray(v)) v.forEach(flatten);
      else if (v && typeof v === 'object') Object.values(v).forEach(flatten);
    };
    flatten(value);
    return flat.join(' ') || fallback;
  }
  if (typeof value === 'object') {
    if (value.other) return String(value.other);
    if (value.steps) return safeString(value.steps, fallback);
    const vals = Object.values(value).filter(v => v && typeof v === 'string');
    if (vals.length > 0) return vals.join(' ');
    const allVals = Object.values(value);
    return safeString(allVals.find(v => v) || null, fallback);
  }
  return String(value) || fallback;
}

function generateFAQSchema(scheme: any) {
  try {
    const cleanContent = cleanMarkdown(scheme.content_en || '');
    const name = scheme.name || 'This Scheme';
    const location = (scheme.state_name || '').replace(/^null\s+/i, '') || COUNTRY_NAMES[scheme.country_code] || 'India';
    
    const faqs = [
      {
        question: `What is ${name}?`,
        answer: cleanContent.substring(0, 300) || `${name} is a government scheme that provides support to eligible citizens in ${location}.`
      },
      {
        question: `Who is eligible for ${name}?`,
        answer: safeString(scheme.eligibility, `Citizens of ${location} meeting the scheme criteria are eligible.`)
      },
      {
        question: `How to apply for ${name}?`,
        answer: safeString(scheme.how_to_apply, 'Visit the official government portal to apply online.')
      },
      {
        question: `What documents are needed for ${name}?`,
        answer: safeString(scheme.documents, 'Aadhaar card, income certificate and relevant identity proof.')
      },
      {
        question: `Is ${name} available in ${new Date().getFullYear()}?`,
        answer: `Yes, ${name} is currently active and accepting applications in ${new Date().getFullYear()}. Visit the official portal for the latest updates and deadlines.`
      },
    ];

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': cleanMarkdown(faq.answer || '').substring(0, 400),
        }
      }))
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const resolvedParams = params;
  
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

    const { data: scheme } = await supabase
      .from('schemes')
      .select('name, content_en, state_name, country_code, slug, local_language, benefit_amount, canonical_slug')
      .eq('slug', resolvedParams.slug)
      .single();

    if (!scheme) return { title: 'Scheme Not Found' };

    const rawDesc = scheme.content_en || '';
    const cleanDesc = cleanMarkdown(rawDesc).substring(0, 160);

    const location = scheme.state_name || 'India';
    const currentYear = new Date().getFullYear();
    const title = `${scheme.name} — Eligibility, Benefits & How to Apply ${currentYear} | SchemeAtlas`;
    const benefitText = scheme.benefit_amount || 'government benefits';
    const description = `${scheme.name} provides ${benefitText} for eligible citizens in ${location}. Check eligibility and apply online.`;

    const baseUrl = `https://schemeatlas.com/schemes/${resolvedParams.slug}`;

    const languages: Record<string, string> = {
      en: baseUrl,
      hi: `${baseUrl}?lang=hi`,
    };
    
    if (scheme.local_language && scheme.local_language !== 'hi') {
      languages[scheme.local_language] = `${baseUrl}?lang=${scheme.local_language}`;
    }

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: baseUrl,
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
      alternates: {
        canonical: baseUrl,
        languages,
      },
    };
  } catch (error) {
    return {
      title: 'Scheme Details | SchemeAtlas',
      description: 'View government scheme details, eligibility, and application process.',
    };
  }
}

export default async function SchemeDetailPage({ 
  params
}: { 
  params: { slug: string }
}) {
  const resolvedParams = params;
  
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

    const { data: scheme } = await supabase
      .from('schemes')
      .select('*')
      .eq('slug', resolvedParams.slug)
      .single();

    if (!scheme) notFound();

    // Canonical Slug Redirect Logic: If this is a duplicate slug, 301 redirect to the primary one
    if (scheme.canonical_slug && scheme.canonical_slug !== resolvedParams.slug) {
      const { redirect } = await import('next/navigation');
      redirect(`/schemes/${scheme.canonical_slug}`);
    }

    const rawState = (scheme.state_name || '').replace(/^null\s+/i, '');
    const stateSlug = rawState ? slugify(rawState) : null;
    const categorySlug = scheme.category ? slugify(scheme.category) : 'general';

    const { data: related } = await supabase
      .from('schemes')
      .select('id, name, slug, image_url, benefit_amount')
      .eq('country_code', scheme.country_code)
      .eq('category', scheme.category)
      .eq('is_published', true)
      .neq('id', scheme.id)
      .limit(3);

    const relatedSchemes = (related || []) as any[];

    const country = COUNTRIES[scheme.country_code];
    const cat = CATEGORIES[scheme.category];

    const flattenToStrings = (value: any): string[] => {
      if (!value) return [];
      if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
      if (Array.isArray(value)) return value.flatMap(flattenToStrings);
      if (typeof value === 'object') return Object.values(value).flatMap(flattenToStrings);
      return [String(value)].filter(Boolean);
    };

    const eligibilityList: string[] = flattenToStrings(scheme.eligibility);
    const howToApplyList: string[] = flattenToStrings(scheme.how_to_apply);
    
    let documents: string[] = [];
    try {
      if (scheme.documents) {
        if (Array.isArray(scheme.documents)) {
          documents = flattenToStrings(scheme.documents);
        } else if (typeof scheme.documents === 'string') {
          const parsed = JSON.parse(scheme.documents || '[]');
          documents = flattenToStrings(parsed);
        } else {
          documents = flattenToStrings(scheme.documents);
        }
      }
    } catch { documents = []; }

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: scheme.name,
      description: cleanMarkdown(scheme.content_en || '').substring(0, 250),
      provider: {
        '@type': 'GovernmentOrganization',
        name: scheme.ministry || 'Government',
      },
      areaServed: {
        '@type': scheme.state_name ? 'State' : 'Country',
        name: rawState || COUNTRY_NAMES[scheme.country_code] || scheme.country_code,
      },
      audience: {
        '@type': 'Audience',
        audienceType: typeof scheme.eligibility === 'string'
          ? scheme.eligibility.substring(0, 150)
          : scheme.eligibility?.other || 'Eligible citizens',
      },
      serviceType: "Government Benefit",
      url: `https://schemeatlas.com/schemes/${scheme.slug}`,
    };

    const isCentral = !stateSlug || scheme.scheme_type === 'central';

    const breadcrumbs = isCentral 
      ? [
          { name: 'Home', item: 'https://schemeatlas.com' },
          { name: 'Schemes', item: 'https://schemeatlas.com/schemes' },
          { name: scheme.category || 'General', item: `https://schemeatlas.com/schemes?category=${categorySlug}` },
          { name: scheme.name, item: `https://schemeatlas.com/schemes/${scheme.slug}` }
        ]
      : [
          { name: 'Home', item: 'https://schemeatlas.com' },
          { name: 'India', item: 'https://schemeatlas.com/in/india' },
          { name: rawState, item: `https://schemeatlas.com/in/${stateSlug}` },
          { name: scheme.category || 'General', item: `https://schemeatlas.com/in/${stateSlug}?category=${categorySlug}` },
          { name: scheme.name, item: `https://schemeatlas.com/schemes/${scheme.slug}` }
        ];

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': breadcrumbs.map((b, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'name': b.name,
        'item': b.item
      }))
    };

    const faqSchema = generateFAQSchema(scheme);

    return (
      <main className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <ViewCounter schemeId={scheme.id} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
        {faqSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        )}

        {/* SEO Breadcrumbs & Header */}
        <div className="bg-white border-b border-slate-200 py-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <nav className="flex items-center space-x-2 text-sm text-slate-500 mb-8 font-medium">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-slate-300">/</span>}
                  {i === breadcrumbs.length - 1 ? (
                    <span className="text-slate-900 font-bold truncate max-w-[200px]">{b.name}</span>
                  ) : (
                    <Link href={b.item.replace('https://schemeatlas.com', '')} className="hover:text-blue-600 transition-colors whitespace-nowrap">
                      {b.name}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>

            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
              {scheme.name}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-slate-600 mb-8">
              <div className="flex items-center bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                <span className="flex h-3 w-3 mr-3 items-center justify-center rounded-full bg-blue-100">
                  <span className="h-2 w-2 animate-ping rounded-full bg-blue-600"></span>
                </span>
                <span className="text-blue-700 font-bold">Live Status: Active & Open</span>
              </div>
              <div className="flex items-center text-sm font-semibold text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div className="w-full h-[300px] md:h-[450px] relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white mb-4 group">
              {scheme.image_url ? (
                 <img 
                   src={scheme.image_url} 
                   alt={scheme.name}
                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                 />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-12 text-center">
                   <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                   <div className="relative">
                      <h2 className="text-white text-3xl md:text-5xl font-black opacity-30 tracking-tighter uppercase italic select-none">
                        {scheme.name}
                      </h2>
                      <div className="mt-4 text-blue-400 font-bold tracking-[0.3em] uppercase text-xs">Official Portal</div>
                   </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
                <div className="hidden md:block">
                  <span className="bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
                    {scheme.category || 'General'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-2/3">
              <SchemeContent 
                contentEn={scheme.content_en}
                contentHi={scheme.content_hi}
                contentLocal={scheme.content_local}
                localLanguage={scheme.local_language}
                fallbackWhatYouGet={scheme.what_you_get}
                fallbackBenefitAmount={scheme.benefit_amount}
                eligibilityList={eligibilityList}
                howToApplyList={howToApplyList}
                documents={documents}
                schemeName={scheme.name}
              />

              <div className="flex flex-col sm:flex-row gap-4 mt-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                {scheme.official_url && (
                  <a 
                    href={scheme.official_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg text-center hover:bg-blue-700 hover:scale-[1.02] transform transition-all shadow-lg hover:shadow-blue-200/50 flex-1"
                  >
                    Apply on Official Site ↗
                  </a>
                )}
                {country && (
                  <Link 
                    href={`/${scheme.country_code.toLowerCase()}/check`} 
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg text-center hover:bg-black transition-all flex-1"
                  >
                    Check If I Qualify →
                  </Link>
                )}
              </div>
              
              <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6">
                <p className="text-amber-800 text-sm leading-relaxed">
                  <strong>⚠️ Note:</strong> SchemeAtlas provides information to help you find and understand benefits. We are not a government agency. Always verify current details on the <strong>official website</strong> before applying.
                </p>
              </div>
            </div>

            <div className="lg:w-1/3 space-y-8">
              <div className="sticky top-24 space-y-8">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-3xl border border-emerald-100 shadow-sm group hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-emerald-800 mb-5 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Who Should Apply?
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <span className="text-emerald-500 mr-2 font-bold select-none text-xl leading-none">✓</span>
                      <span className="text-emerald-900 font-medium leading-relaxed italic">
                        "Residents of {rawState || country?.name || 'India'} looking for {scheme.category || 'government'} support."
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-8 rounded-3xl border border-rose-100 shadow-sm group hover:shadow-md transition-shadow">
                  <h3 className="text-xl font-bold text-rose-800 mb-5 flex items-center">
                    <svg className="w-6 h-6 mr-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Who Should NOT Apply?
                  </h3>
                  <p className="text-rose-900 font-medium leading-relaxed opacity-80">
                    Individuals with an annual family income exceeding the threshold for these specific benefits.
                  </p>
                </div>

                {relatedSchemes && relatedSchemes.length > 0 && (
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 relative z-10 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      Similar Programs
                    </h3>
                    <div className="space-y-6 relative z-10">
                      {relatedSchemes.map(r => (
                        <Link key={r.id} href={`/schemes/${r.slug}`} className="group flex gap-4 items-start">
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200">
                             {r.image_url ? (
                               <img src={r.image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             ) : (
                               <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">SA</div>
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2">
                              {r.name}
                            </h4>
                            <p className="text-xs text-green-600 font-extrabold">{r.benefit_amount || 'View Details'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans flex items-center justify-center p-8">
        <div className="text-center max-w-lg">
          <Navbar />
          <h1 className="text-5xl font-black text-slate-900 mb-6 mt-20">Error</h1>
          <h2 className="text-2xl font-bold text-slate-700 mb-4">Error loading scheme details</h2>
          <p className="text-slate-500 mb-8">
            This government scheme information is currently undergoing an update or contains malformed data.
          </p>
          <Link href="/schemes" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold">
            Browse Other Schemes
          </Link>
        </div>
      </main>
    );
  }
}

export const dynamicParams = true;

export async function generateStaticParams() {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from('schemes')
    .select('slug')
    .order('views', { ascending: false })
    .limit(200);

  if (!data) return [];
  return data.map((s) => ({ slug: s.slug }));
}
