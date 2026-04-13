import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES, LANG_LABELS } from '@/lib/config';
import { Metadata } from 'next';
import { SchemeContent } from './SchemeContent';
import { slugify } from '@/lib/seo';

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

function generateFAQSchema(scheme: any) {
  const cleanContent = cleanMarkdown(scheme.content_en || '');
  const name = scheme.name;
  const location = scheme.state_name || COUNTRY_NAMES[scheme.country_code] || 'India';
  
  const faqs = [
    {
      question: `What is ${name}?`,
      answer: cleanContent.substring(0, 300) || `${name} is a government scheme that provides support to eligible citizens in ${location}.`
    },
    {
      question: `Who is eligible for ${name}?`,
      answer: typeof scheme.eligibility === 'string'
        ? scheme.eligibility
        : scheme.eligibility?.other || `Citizens of ${location} meeting the scheme criteria are eligible.`
    },
    {
      question: `How to apply for ${name}?`,
      answer: Array.isArray(scheme.how_to_apply)
        ? scheme.how_to_apply.flat().join(' ')
        : typeof scheme.how_to_apply === 'object'
          ? Object.values(scheme.how_to_apply || {}).filter(v => typeof v === 'string').join(' ')
          : scheme.how_to_apply || 'Visit the official government portal to apply online.'
    },
    {
      question: `What documents are needed for ${name}?`,
      answer: Array.isArray(scheme.documents)
        ? scheme.documents.join(', ')
        : typeof scheme.documents === 'object'
          ? Object.values(scheme.documents || {}).filter(v => typeof v === 'string').join(', ')
          : scheme.documents || 'Aadhaar card, income certificate and relevant identity proof.'
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
        'text': cleanMarkdown(faq.answer).substring(0, 400),
      }
    }))
  };
}

export const revalidate = 3600;
export const runtime = 'edge';

// Removed generateStaticParams to avoid 'Invalid string length' error from Cloudflare Pages
// when prerendering 15k+ routes statically. Let Next.js render on the Edge dynamically.

export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const resolvedParams = params;
  const supabase = supabaseAdmin();
  const { data: scheme } = await supabase
    .from('schemes')
    .select('name, content_en, state_name, country_code, ministry, slug, local_language')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!scheme) return {};

  const rawDesc = scheme.content_en || '';
  const cleanDesc = cleanMarkdown(rawDesc).substring(0, 160);

  const location = scheme.state_name || 'India';
  const title = `${scheme.name} ${new Date().getFullYear()} - Eligibility, Benefits & How to Apply | SchemeAtlas`;
  const description = cleanDesc.length > 50
    ? cleanDesc
    : `Learn about ${scheme.name} - who can apply, benefit amount and how to apply in ${location} ${new Date().getFullYear()}.`;

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
    keywords: `${scheme.name}, government scheme, ${location}, eligibility, how to apply, benefits ${new Date().getFullYear()}`,
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
}

export default async function SchemeDetailPage({ 
  params
}: { 
  params: { slug: string }
}) {
  const resolvedParams = params;
  
  const supabase = supabaseAdmin();
  const { data: scheme } = await supabase
    .from('schemes')
    .select('*')
    .eq('slug', resolvedParams.slug)
    .single();

  if (!scheme) notFound();

  const stateSlug = scheme.state_name ? slugify(scheme.state_name) : null;
  const categorySlug = scheme.category ? slugify(scheme.category) : 'general';

  // Async task to fetch related schemes
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

  const eligibilityList: string[] = scheme.eligibility ? (Array.isArray(scheme.eligibility) ? scheme.eligibility : typeof scheme.eligibility === 'object' ? Object.values(scheme.eligibility).filter(Boolean) as string[] : [String(scheme.eligibility)]) : [];
  const howToApplyList: string[] = scheme.how_to_apply ? (Array.isArray(scheme.how_to_apply) ? scheme.how_to_apply : typeof scheme.how_to_apply === 'object' ? Object.values(scheme.how_to_apply).filter(Boolean) as string[] : [String(scheme.how_to_apply)]) : [];
  const documents: string[] = scheme.documents ? (Array.isArray(scheme.documents) ? scheme.documents : typeof scheme.documents === 'string' ? JSON.parse(scheme.documents || '[]') : []) : [];

  const lastUpdated = scheme.last_updated
    ? new Date(scheme.last_updated).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentService',
    name: scheme.name,
    description: cleanMarkdown(scheme.content_en || '').substring(0, 250),
    provider: {
      '@type': 'GovernmentOrganization',
      name: scheme.ministry || 'Government of India',
    },
    areaServed: {
      '@type': scheme.state_name ? 'State' : 'Country',
      name: scheme.state_name || COUNTRY_NAMES[scheme.country_code] || scheme.country_code,
    },
    audience: {
      '@type': 'Audience',
      audienceType: typeof scheme.eligibility === 'string'
        ? scheme.eligibility.substring(0, 150)
        : scheme.eligibility?.other || 'Indian citizens',
    },
    serviceType: "Government Benefit",
    url: `https://schemeatlas.com/schemes/${scheme.slug}`,
  };

  const faqSchema = generateFAQSchema(scheme);

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/schemes" className="hover:text-blue-600 transition-colors">Schemes</Link>
            {stateSlug && (
              <>
                <span className="text-slate-300">/</span>
                <Link href={`/in/${stateSlug}`} className="hover:text-blue-600 transition-colors capitalize">
                  {scheme.state_name}
                </Link>
                <span className="text-slate-300">/</span>
                <Link 
                  href={`/in/${stateSlug}?category=${categorySlug}`} 
                  className="hover:text-blue-600 transition-colors capitalize"
                >
                  {scheme.category || 'General'}
                </Link>
              </>
            )}
            {!stateSlug && (
              <>
                <span className="text-slate-300">/</span>
                <Link href="/in/india" className="hover:text-blue-600 transition-colors capitalize">
                  Central
                </Link>
                <span className="text-slate-300">/</span>
                <Link 
                  href={`/in/india?category=${categorySlug}`} 
                  className="hover:text-blue-600 transition-colors capitalize"
                >
                  {scheme.category || 'General'}
                </Link>
              </>
            )}
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

          {/* New Hero Image Section */}
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
          {/* Main Content Area */}
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

          {/* Sidebar - SEO Authority & Intent */}
          <div className="lg:w-1/3 space-y-8">
            <div className="sticky top-24 space-y-8">
              {/* Intent Section: Who Should Definitely Apply */}
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
                      "Residents of {scheme.state_name || 'India'} looking for {scheme.category || 'government'} support."
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-emerald-500 mr-2 font-bold select-none text-xl leading-none">✓</span>
                    <span className="text-emerald-900 font-medium leading-relaxed italic">
                      "Families meeting the eligibility criteria for {scheme.category || 'this program'} for {new Date().getFullYear()}."
                    </span>
                  </li>
                </ul>
              </div>

              {/* Intent Section: Who Should NOT Apply */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-8 rounded-3xl border border-rose-100 shadow-sm group hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-rose-800 mb-5 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Who Should NOT Apply?
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-rose-500 mr-2 font-bold select-none text-xl leading-none">!</span>
                    <span className="text-rose-900 font-medium leading-relaxed opacity-80">
                      Individuals with an annual family income exceeding the threshold for these specific benefits.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-rose-500 mr-2 font-bold select-none text-xl leading-none">!</span>
                    <span className="text-rose-900 font-medium leading-relaxed opacity-80">
                      Those already receiving full aid from other similar government programs.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Related Schemes */}
              {related && related.length > 0 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50"></div>
                  <h3 className="text-xl font-bold text-slate-800 mb-6 relative z-10 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    Similar Programs
                  </h3>
                  <div className="space-y-6 relative z-10">
                    {related.map(r => (
                      <Link key={r.id} href={`/schemes/${r.slug}`} className="group flex gap-4 items-start">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                          {r.image_url ? (
                            <img src={r.image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-400 transition-colors">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-1 line-clamp-2 leading-snug">
                            {r.name}
                          </h4>
                          <p className="text-xs text-green-600 font-extrabold uppercase tracking-tight">{r.benefit_amount || 'View Details'}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/schemes" className="mt-8 block text-center py-3 rounded-2xl bg-slate-50 text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                    View All Schemes →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
