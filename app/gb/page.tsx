import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "UK Government Benefits & Grants 2026 — Find What You're Entitled To | SchemeAtlas",
  description: "Discover 300+ UK government benefits, grants and support schemes. Universal Credit, PIP, NHS, housing support, student finance and more. Free eligibility check.",
  alternates: { canonical: 'https://schemeatlas.com/gb' },
  openGraph: {
    title: "UK Government Benefits & Grants 2026 | SchemeAtlas",
    description: "Universal Credit, PIP, Housing Benefit, Child Benefit, Pension Credit and 300+ more UK benefits.",
    url: 'https://schemeatlas.com/gb',
    siteName: 'SchemeAtlas',
  },
};

const UK_CATEGORIES = [
  { icon: '💷', label: 'Universal Credit', desc: 'Income support for working age', slug: 'cash' },
  { icon: '🏥', label: 'NHS Support', desc: 'Free prescriptions, dental, glasses', slug: 'health' },
  { icon: '🎓', label: 'Student Finance', desc: 'Tuition loans, maintenance grants', slug: 'education' },
  { icon: '🏠', label: 'Housing Benefit', desc: 'Rent support, Council Tax Reduction', slug: 'housing' },
  { icon: '♿', label: 'Disability (PIP/DLA)', desc: 'PIP, DLA, ESA, blue badge', slug: 'disability' },
  { icon: '👴', label: 'Pension & Retirement', desc: 'State Pension, Pension Credit', slug: 'elderly' },
  { icon: '👶', label: 'Child & Family', desc: 'Child Benefit, Tax Credits, free childcare', slug: 'family' },
  { icon: '🌱', label: 'Business Grants', desc: 'Innovate UK, Start Up Loans', slug: 'business' },
];

const TOP_BENEFITS = [
  { name: 'Universal Credit', amount: 'Up to £1,229/month', url: '/schemes/universal-credit-gb' },
  { name: 'Personal Independence Payment (PIP)', amount: '£28.70–£184.30/week', url: '/schemes/pip-disability-gb' },
  { name: 'Child Benefit', amount: '£25.60/week (first child)', url: '/schemes/child-benefit-gb' },
  { name: 'State Pension', amount: '£221.20/week (full)', url: '/schemes/state-pension-gb' },
  { name: 'Housing Benefit', amount: 'Up to £1,000+/month', url: '/schemes/housing-benefit-gb' },
  { name: 'Free Childcare (30 hours)', amount: 'Worth £6,000+/year', url: '/schemes/free-childcare-gb' },
];

const UK_NATIONS = [
  { code: 'england', name: 'England', icon: '🌹', note: 'GOV.UK benefits' },
  { code: 'scotland', name: 'Scotland', icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', note: 'Social Security Scotland' },
  { code: 'wales', name: 'Wales', icon: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', note: 'Some devolved benefits' },
  { code: 'northern-ireland', name: 'Northern Ireland', icon: '☘️', note: 'NIDirect benefits' },
];

export default async function GBHubPage() {
  let schemeCount = 0;
  let recentSchemes: { slug: string; name: string }[] = [];
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    const { count, data } = await supabase
      .from('schemes')
      .select('slug, name', { count: 'exact' })
      .eq('country_code', 'GB')
      .eq('is_published', true)
      .eq('is_active', true)
      .order('discovered_at', { ascending: false })
      .limit(20);
    schemeCount = count || 0;
    recentSchemes = data || [];
  } catch { /* edge fallback */ }

  const displayCount = schemeCount > 0 ? `${schemeCount}+` : '300+';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'GovernmentService',
        name: 'UK Government Benefits & Grants 2026',
        description: 'Comprehensive guide to UK government benefits, grants and entitlements.',
        areaServed: { '@type': 'Country', name: 'United Kingdom', identifier: 'GB' },
        provider: { '@type': 'Organization', name: 'SchemeAtlas', url: 'https://schemeatlas.com' },
        url: 'https://schemeatlas.com/gb',
      }) }} />

      <div className="sr-only" aria-hidden="true">
        <h1>UK Government Benefits &amp; Grants 2026</h1>
        <p>Find all UK government benefits, grants and entitlements. Universal Credit, PIP, Housing Benefit, Child Benefit and more.</p>
        <ul>{recentSchemes.map(s => <li key={s.slug}><Link href={`/schemes/${s.slug}`}>{s.name}</Link></li>)}</ul>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0f172a 60%, #0d1f3c 100%)', minHeight: 460 }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #7c3aed 0%, transparent 50%)' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 md:py-28 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-5" style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,58,237,0.3)' }}>
              🇬🇧 {displayCount} Benefits &amp; Entitlements
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              UK Government Benefits &amp; Grants 2026
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-xl leading-relaxed">
              Find every benefit, grant and entitlement you&apos;re eligible for — Universal Credit, PIP, Housing Benefit, Child Benefit and hundreds more. Free eligibility check.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/gb/check" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#7c3aed', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
                Check What You&apos;re Entitled To →
              </Link>
              <Link href="/gb?show=all" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-slate-300 text-lg border border-slate-600 hover:border-slate-400 hover:text-white transition-all">
                Browse All Benefits
              </Link>
            </div>
          </div>
          <div className="text-[120px] md:text-[160px] leading-none select-none" aria-hidden="true">🇬🇧</div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by Benefit Type</h2>
        <p className="text-slate-500 mb-8">Find support that matches your circumstances</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {UK_CATEGORIES.map(cat => (
            <Link key={cat.slug} href={`/gb?category=${cat.slug}`}
              className="group flex flex-col items-center text-center p-5 rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all">
              <span className="text-3xl mb-2">{cat.icon}</span>
              <span className="font-bold text-slate-800 text-sm group-hover:text-purple-700">{cat.label}</span>
              <span className="text-xs text-slate-400 mt-1">{cat.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* TOP BENEFITS */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Most Claimed UK Benefits</h2>
          <p className="text-slate-500 mb-8">Benefits millions of UK residents are entitled to</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOP_BENEFITS.map(b => (
              <Link key={b.name} href={b.url}
                className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all">
                <div>
                  <div className="font-bold text-slate-800 group-hover:text-purple-700">{b.name}</div>
                  <div className="text-sm font-semibold text-purple-600 mt-1">{b.amount}</div>
                </div>
                <span className="text-slate-300 group-hover:text-purple-400 text-xl">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* UK NATIONS */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by Nation</h2>
        <p className="text-slate-500 mb-8">Some benefits are devolved — different rules apply in different nations</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {UK_NATIONS.map(n => (
            <Link key={n.code} href={`/gb/${n.code}`}
              className="group flex flex-col items-center p-6 rounded-2xl border border-slate-100 bg-white hover:border-purple-200 hover:bg-purple-50 hover:-translate-y-0.5 transition-all text-center">
              <span className="text-4xl mb-2">{n.icon}</span>
              <span className="font-bold text-slate-800 group-hover:text-purple-700">{n.name}</span>
              <span className="text-xs text-slate-400 mt-1">{n.note}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0f172a 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Are You Claiming Everything You&apos;re Owed?</h2>
          <p className="text-slate-300 mb-8 text-lg">An estimated £19 billion in UK benefits goes unclaimed every year. Answer 5 quick questions to find out what you&apos;re entitled to.</p>
          <Link href="/gb/check" className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#7c3aed', boxShadow: '0 4px 24px rgba(124,58,237,0.4)' }}>
            Check My UK Entitlements ⚡
          </Link>
          <p className="text-slate-500 text-sm mt-4">No signup. Free. Based on official GOV.UK eligibility rules.</p>
        </div>
      </section>
    </>
  );
}
