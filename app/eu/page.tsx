import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'EU Grants, Funds & Programs 2026 — Find Funding You Qualify For | SchemeAtlas',
  description: 'Explore Horizon Europe, Erasmus+, EIC Accelerator, Structural Funds and 200+ EU-wide programs for citizens, students, researchers, startups and businesses.',
  alternates: { canonical: 'https://schemeatlas.com/eu' },
  openGraph: { title: 'EU Grants & Funds 2026 | SchemeAtlas', url: 'https://schemeatlas.com/eu', siteName: 'SchemeAtlas' },
};

const EU_PROGRAMS = [
  { name: 'Horizon Europe', amount: '€95.5 billion (2021-2027)', desc: 'Research & innovation grants for scientists and companies', url: '/schemes/horizon-europe-eu' },
  { name: 'Erasmus+', amount: 'Up to €25,000/year', desc: 'Education, training, youth and sport exchanges', url: '/schemes/erasmus-plus-eu' },
  { name: 'EIC Accelerator', amount: 'Up to €2.5M grant + equity', desc: 'Deep tech startups and scale-ups', url: '/schemes/eic-accelerator-eu' },
  { name: 'European Social Fund+ (ESF+)', amount: '€99.3 billion total', desc: 'Employment, social inclusion, skills training', url: '/schemes/esf-plus-eu' },
  { name: 'ERDF (Regional Development)', amount: 'Varies by region', desc: 'Infrastructure, SME support, innovation', url: '/schemes/erdf-eu' },
  { name: 'LIFE Programme', amount: 'Up to €5M per project', desc: 'Climate, nature, circular economy', url: '/schemes/life-programme-eu' },
];

const EU_CATEGORIES = [
  { icon: '🔬', label: 'Research & Innovation', desc: 'Horizon Europe, ERC, EIC', slug: 'research' },
  { icon: '🎓', label: 'Education', desc: 'Erasmus+, EYE, Europass', slug: 'education' },
  { icon: '🌾', label: 'Agriculture (CAP)', desc: 'Direct payments, rural development', slug: 'agriculture' },
  { icon: '💼', label: 'SME & Business', desc: 'EIC, InvestEU, COSME', slug: 'business' },
  { icon: '🌍', label: 'Climate & Energy', desc: 'LIFE, Just Transition Fund', slug: 'climate' },
  { icon: '🤝', label: 'Employment', desc: 'ESF+, EURES, YEI', slug: 'employment' },
];

const EU_COUNTRIES = [
  { code: 'germany', name: 'Germany', icon: '🇩🇪' },
  { code: 'france', name: 'France', icon: '🇫🇷' },
  { code: 'italy', name: 'Italy', icon: '🇮🇹' },
  { code: 'spain', name: 'Spain', icon: '🇪🇸' },
  { code: 'poland', name: 'Poland', icon: '🇵🇱' },
  { code: 'netherlands', name: 'Netherlands', icon: '🇳🇱' },
  { code: 'ireland', name: 'Ireland', icon: '🇮🇪' },
  { code: 'sweden', name: 'Sweden', icon: '🇸🇪' },
];

export default async function EUHubPage() {
  let schemeCount = 0;
  let recentSchemes: { slug: string; name: string }[] = [];
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    const { count, data } = await supabase
      .from('schemes').select('slug, name', { count: 'exact' })
      .eq('country_code', 'EU').eq('is_published', true).eq('is_active', true)
      .order('discovered_at', { ascending: false }).limit(20);
    schemeCount = count || 0; recentSchemes = data || [];
  } catch { /* edge fallback */ }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'GovernmentService',
        name: 'EU Grants, Funds & Programs 2026',
        description: 'Comprehensive guide to EU funding programs for citizens, businesses and researchers.',
        areaServed: { '@type': 'Organization', name: 'European Union' },
        provider: { '@type': 'Organization', name: 'SchemeAtlas', url: 'https://schemeatlas.com' },
        url: 'https://schemeatlas.com/eu',
      }) }} />

      <div className="sr-only" aria-hidden="true">
        <h1>EU Grants, Funds &amp; Programs 2026</h1>
        <ul>{recentSchemes.map(s => <li key={s.slug}><Link href={`/schemes/${s.slug}`}>{s.name}</Link></li>)}</ul>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 60%, #0c1a40 100%)', minHeight: 420 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #fbbf24 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-5" style={{ background: 'rgba(251,191,36,0.15)', color: '#fde68a', border: '1px solid rgba(251,191,36,0.3)' }}>
              🇪🇺 {schemeCount > 0 ? `${schemeCount}+` : '200+'} EU Grants &amp; Funds
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              EU Grants, Funds &amp; Programs 2026
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-xl">
              Horizon Europe, Erasmus+, EIC Accelerator, Structural Funds and hundreds of EU-wide grants. For citizens, students, researchers, startups and businesses.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/eu/check" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#d97706', boxShadow: '0 4px 24px rgba(217,119,6,0.4)' }}>
                Find EU Funding I Qualify For →
              </Link>
              <Link href="/eu?show=all" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-slate-300 text-lg border border-slate-600 hover:border-slate-400 hover:text-white transition-all">
                Browse All EU Programs
              </Link>
            </div>
          </div>
          <div className="text-[120px] md:text-[160px] leading-none select-none">🇪🇺</div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by Programme Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {EU_CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/eu?category=${cat.slug}`}
              className="group flex items-center gap-3 p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-yellow-200 hover:-translate-y-0.5 transition-all">
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <div className="font-bold text-slate-800 group-hover:text-yellow-700">{cat.label}</div>
                <div className="text-xs text-slate-400">{cat.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TOP PROGRAMS */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Major EU Funding Programs</h2>
          <p className="text-slate-500 mb-8">2021–2027 Multiannual Financial Framework programs</p>
          <div className="grid md:grid-cols-2 gap-5">
            {EU_PROGRAMS.map(p => (
              <Link key={p.name} href={p.url}
                className="group flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-yellow-200 transition-all">
                <div className="flex-1">
                  <div className="font-bold text-slate-800 group-hover:text-yellow-700 text-lg">{p.name}</div>
                  <div className="text-sm font-semibold text-yellow-600 mt-1">{p.amount}</div>
                  <div className="text-sm text-slate-500 mt-2">{p.desc}</div>
                </div>
                <span className="text-slate-300 group-hover:text-yellow-400 text-xl">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBER STATES */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by Member State</h2>
        <p className="text-slate-500 mb-8">National contact points and country-specific EU fund allocations</p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {EU_COUNTRIES.map(c => (
            <Link key={c.code} href={`/eu/${c.code}`}
              className="group flex flex-col items-center p-3 rounded-xl border border-slate-100 bg-white hover:border-yellow-200 hover:bg-yellow-50 transition-all text-center">
              <span className="text-3xl mb-1">{c.icon}</span>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-yellow-700">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Find EU Funding for Your Project or Business</h2>
          <p className="text-slate-300 mb-8 text-lg">Over €1 trillion in EU funding is available for 2021–2027. Find grants, loans and programs you qualify for.</p>
          <Link href="/eu/check" className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#d97706' }}>
            Check EU Funding Eligibility ⚡
          </Link>
        </div>
      </section>
    </>
  );
}
