import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'US Government Benefits & Programs 2026 — Find What You Qualify For | SchemeAtlas',
  description: 'Discover 500+ federal and state benefit programs in the USA. SNAP, Medicaid, Section 8, FAFSA, SSDI and more. Free eligibility check in 2 minutes.',
  alternates: { canonical: 'https://schemeatlas.com/us' },
  openGraph: {
    title: 'US Government Benefits & Programs 2026 | SchemeAtlas',
    description: 'Discover 500+ federal and state benefit programs. SNAP, Medicaid, Section 8, FAFSA and more.',
    url: 'https://schemeatlas.com/us',
    siteName: 'SchemeAtlas',
  },
  other: {
    'hreflang': 'en-US',
  },
};

const US_STATES = [
  { code: 'CA', name: 'California', icon: '🌴' },
  { code: 'TX', name: 'Texas', icon: '⭐' },
  { code: 'NY', name: 'New York', icon: '🗽' },
  { code: 'FL', name: 'Florida', icon: '🌊' },
  { code: 'IL', name: 'Illinois', icon: '🏙️' },
  { code: 'PA', name: 'Pennsylvania', icon: '🔔' },
  { code: 'OH', name: 'Ohio', icon: '🌻' },
  { code: 'GA', name: 'Georgia', icon: '🍑' },
  { code: 'MI', name: 'Michigan', icon: '🚗' },
  { code: 'AZ', name: 'Arizona', icon: '🌵' },
  { code: 'NC', name: 'North Carolina', icon: '🌲' },
  { code: 'WA', name: 'Washington', icon: '☕' },
  { code: 'CO', name: 'Colorado', icon: '🏔️' },
  { code: 'TN', name: 'Tennessee', icon: '🎸' },
  { code: 'NJ', name: 'New Jersey', icon: '🏖️' },
];

const US_CATEGORIES = [
  { icon: '🏥', label: 'Healthcare', desc: 'Medicaid, Medicare, ACA subsidies', slug: 'health' },
  { icon: '🍎', label: 'Food & Nutrition', desc: 'SNAP, WIC, School Meals', slug: 'food' },
  { icon: '🏠', label: 'Housing', desc: 'Section 8, HUD, USDA Rural', slug: 'housing' },
  { icon: '🎓', label: 'Education', desc: 'FAFSA, Pell Grant, PLUS Loans', slug: 'education' },
  { icon: '💼', label: 'Employment', desc: 'Unemployment Insurance, PEUC', slug: 'employment' },
  { icon: '👴', label: 'Retirement', desc: 'Social Security, SSI, SSDI', slug: 'elderly' },
  { icon: '👶', label: 'Family & Children', desc: 'CHIP, TANF, Child Tax Credit', slug: 'family' },
  { icon: '⚡', label: 'Utilities', desc: 'LIHEAP, Lifeline, Broadband', slug: 'cash' },
  { icon: '💰', label: 'Small Business', desc: 'SBA loans, SBIR grants', slug: 'business' },
  { icon: '♿', label: 'Disability', desc: 'SSDI, SSI, Vocational Rehab', slug: 'disability' },
];

const TOP_PROGRAMS = [
  { name: 'SNAP (Food Stamps)', amount: 'Up to $1,756/month', url: '/schemes/snap-food-stamps-us' },
  { name: 'Medicaid', amount: 'Free health coverage', url: '/schemes/medicaid-us' },
  { name: 'Section 8 Housing Vouchers', amount: 'Up to 70% rent covered', url: '/schemes/section-8-housing-vouchers-us' },
  { name: 'SSDI Disability Benefits', amount: 'Avg $1,537/month', url: '/schemes/ssdi-disability-us' },
  { name: 'Pell Grant', amount: 'Up to $7,395/year', url: '/schemes/pell-grant-us' },
  { name: 'LIHEAP Energy Assistance', amount: 'Up to $2,000/year', url: '/schemes/liheap-energy-us' },
];

export default async function USHubPage() {
  // Server-side scheme fetch for SEO crawlability
  let schemeCount = 0;
  let recentSchemes: { slug: string; name: string }[] = [];
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    const { count, data } = await supabase
      .from('schemes')
      .select('slug, name', { count: 'exact' })
      .eq('country_code', 'US')
      .eq('is_published', true)
      .eq('is_active', true)
      .order('discovered_at', { ascending: false })
      .limit(20);
    schemeCount = count || 0;
    recentSchemes = data || [];
  } catch { /* edge fallback */ }

  const displayCount = schemeCount > 0 ? `${schemeCount}+` : '500+';

  return (
    <>
      {/* ── JSON-LD Schema ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'GovernmentService',
        name: 'US Government Benefits & Programs 2026',
        description: 'Comprehensive guide to federal and state benefit programs in the United States.',
        areaServed: { '@type': 'Country', name: 'United States', identifier: 'US' },
        provider: { '@type': 'Organization', name: 'SchemeAtlas', url: 'https://schemeatlas.com' },
        url: 'https://schemeatlas.com/us',
      }) }} />

      {/* ── SEO: Hidden crawlable scheme links ── */}
      <div className="sr-only" aria-hidden="true">
        <h1>US Government Benefits &amp; Programs 2026</h1>
        <p>Find federal and state benefit programs in the United States. SNAP, Medicaid, Section 8, FAFSA, SSDI, SSI and more.</p>
        <ul>
          {recentSchemes.map(s => (
            <li key={s.slug}><Link href={`/schemes/${s.slug}`}>{s.name}</Link></li>
          ))}
        </ul>
      </div>

      {/* ── HERO ── */}
      <section className="relative bg-slate-900 overflow-hidden" style={{ minHeight: 480 }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 60%, #1a2744 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%)' }} />

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-5" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.3)' }}>
                🇺🇸 {displayCount} Federal &amp; State Programs
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
                US Government Benefits &amp; Programs 2026
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-xl leading-relaxed">
                Find every federal and state benefit you qualify for — SNAP, Medicaid, Section 8, SSDI, FAFSA and hundreds more. Free eligibility check in 2 minutes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link href="/us/check" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#2563eb', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}>
                  Check My Eligibility →
                </Link>
                <Link href="/us?show=all" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-slate-300 text-lg border border-slate-600 hover:border-slate-400 hover:text-white transition-all">
                  Browse All Programs
                </Link>
              </div>
            </div>
            <div className="text-[120px] md:text-[160px] leading-none select-none" aria-hidden="true">🇺🇸</div>
          </div>

          {/* Stats Row */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { n: displayCount, l: 'Active Programs' },
              { n: '50', l: 'States Covered' },
              { n: 'Free', l: 'Eligibility Check' },
              { n: 'Daily', l: 'Updated' },
            ].map(s => (
              <div key={s.l} className="text-center p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-2xl font-extrabold text-blue-400">{s.n}</div>
                <div className="text-sm text-slate-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by Category</h2>
        <p className="text-slate-500 mb-8">Find benefits that match your situation</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {US_CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/us?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-2">{cat.icon}</span>
              <span className="font-bold text-slate-800 text-sm group-hover:text-blue-700">{cat.label}</span>
              <span className="text-xs text-slate-400 mt-1 leading-tight">{cat.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TOP PROGRAMS ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Most-Applied Federal Programs</h2>
          <p className="text-slate-500 mb-8">Programs millions of Americans rely on every month</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOP_PROGRAMS.map(prog => (
              <Link key={prog.name} href={prog.url}
                className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all">
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-blue-700">{prog.name}</div>
                  <div className="text-sm font-semibold text-blue-600 mt-1">{prog.amount}</div>
                </div>
                <span className="text-slate-300 group-hover:text-blue-400 text-xl">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATES GRID ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by State</h2>
        <p className="text-slate-500 mb-8">State-specific programs on top of federal benefits</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {US_STATES.map(state => (
            <Link key={state.code} href={`/us/${state.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group flex flex-col items-center p-4 rounded-xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50 hover:-translate-y-0.5 transition-all text-center">
              <span className="text-2xl mb-1">{state.icon}</span>
              <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700">{state.name}</span>
            </Link>
          ))}
          <Link href="/us?show=all" className="flex flex-col items-center p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-300 transition-all text-center">
            <span className="text-2xl mb-1">+</span>
            <span className="text-xs font-semibold text-slate-500">All 50 States</span>
          </Link>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Not Sure What You Qualify For?</h2>
          <p className="text-slate-300 mb-8 text-lg">Answer 5 quick questions and our AI will match you with every US benefit program you&apos;re eligible for — in under 2 minutes.</p>
          <Link href="/us/check" className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#2563eb', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}>
            Start Free Eligibility Check ⚡
          </Link>
          <p className="text-slate-500 text-sm mt-4">No signup required. 100% free. Results in 2 minutes.</p>
        </div>
      </section>
    </>
  );
}
