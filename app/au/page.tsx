import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Australian Government Benefits & Grants 2026 | SchemeAtlas',
  description: 'Discover Centrelink payments, Medicare, NDIS, state grants and federal benefits in Australia. JobSeeker, Age Pension, Family Tax Benefit and more. Free eligibility check.',
  alternates: { canonical: 'https://schemeatlas.com/au' },
  openGraph: { title: 'Australian Government Benefits 2026 | SchemeAtlas', url: 'https://schemeatlas.com/au', siteName: 'SchemeAtlas' },
};

const AU_PROGRAMS = [
  { name: 'JobSeeker Payment', amount: 'A$762.70/fortnight (single)', url: '/schemes/jobseeker-payment-au' },
  { name: 'Age Pension', amount: 'Up to A$1,116.30/fortnight', url: '/schemes/age-pension-au' },
  { name: 'Family Tax Benefit Part A', amount: 'Up to A$213.36/fortnight', url: '/schemes/family-tax-benefit-a-au' },
  { name: 'NDIS (Disability Support)', amount: 'Avg A$57,000/year', url: '/schemes/ndis-disability-au' },
  { name: 'First Home Owner Grant', amount: 'A$10,000–A$30,000', url: '/schemes/first-home-owner-grant-au' },
  { name: 'Youth Allowance', amount: 'A$677.70/fortnight', url: '/schemes/youth-allowance-au' },
];

const AU_STATES = [
  { code: 'new-south-wales', name: 'New South Wales', icon: '🌉' },
  { code: 'victoria', name: 'Victoria', icon: '☕' },
  { code: 'queensland', name: 'Queensland', icon: '🌞' },
  { code: 'western-australia', name: 'Western Australia', icon: '🦘' },
  { code: 'south-australia', name: 'South Australia', icon: '🍷' },
  { code: 'tasmania', name: 'Tasmania', icon: '🌿' },
  { code: 'act', name: 'ACT', icon: '🏛️' },
  { code: 'northern-territory', name: 'Northern Territory', icon: '🪨' },
];

export default async function AUHubPage() {
  let schemeCount = 0;
  let recentSchemes: { slug: string; name: string }[] = [];
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    const { count, data } = await supabase
      .from('schemes').select('slug, name', { count: 'exact' })
      .eq('country_code', 'AU').eq('is_published', true).eq('is_active', true)
      .order('discovered_at', { ascending: false }).limit(20);
    schemeCount = count || 0; recentSchemes = data || [];
  } catch { /* edge fallback */ }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'GovernmentService',
        name: 'Australian Government Benefits & Grants 2026',
        areaServed: { '@type': 'Country', name: 'Australia', identifier: 'AU' },
        provider: { '@type': 'Organization', name: 'SchemeAtlas', url: 'https://schemeatlas.com' },
        url: 'https://schemeatlas.com/au',
      }) }} />

      <div className="sr-only" aria-hidden="true">
        <h1>Australian Government Benefits &amp; Grants 2026</h1>
        <ul>{recentSchemes.map(s => <li key={s.slug}><Link href={`/schemes/${s.slug}`}>{s.name}</Link></li>)}</ul>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 60%, #052e16 100%)', minHeight: 420 }}>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-5" style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}>
              🇦🇺 {schemeCount > 0 ? `${schemeCount}+` : '200+'} Federal &amp; State Programs
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Australian Government Benefits &amp; Grants 2026
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-xl">
              Centrelink payments, NDIS, Medicare, state grants and federal benefits. Find your entitlements in minutes — free.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/au/check" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#059669', boxShadow: '0 4px 24px rgba(5,150,105,0.4)' }}>
                Check My Eligibility →
              </Link>
              <Link href="/au?show=all" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-slate-300 text-lg border border-slate-600 hover:border-slate-400 hover:text-white transition-all">
                Browse All Benefits
              </Link>
            </div>
          </div>
          <div className="text-[120px] md:text-[160px] leading-none select-none">🇦🇺</div>
        </div>
      </section>

      {/* TOP PROGRAMS */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Key Centrelink &amp; Federal Payments</h2>
        <p className="text-slate-500 mb-8">Payments managed by Services Australia (Centrelink)</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {AU_PROGRAMS.map(p => (
            <Link key={p.name} href={p.url}
              className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
              <div>
                <div className="font-bold text-slate-800 group-hover:text-emerald-700">{p.name}</div>
                <div className="text-sm font-semibold text-emerald-600 mt-1">{p.amount}</div>
              </div>
              <span className="text-slate-300 group-hover:text-emerald-400 text-xl">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* STATES */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by State &amp; Territory</h2>
          <p className="text-slate-500 mb-8">State grants and rebates on top of federal Centrelink payments</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {AU_STATES.map(s => (
              <Link key={s.code} href={`/au/${s.code}`}
                className="group flex flex-col items-center p-5 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:bg-emerald-50 transition-all text-center">
                <span className="text-3xl mb-2">{s.icon}</span>
                <span className="font-bold text-slate-800 group-hover:text-emerald-700 text-sm">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Are You Getting All Your Australian Entitlements?</h2>
          <p className="text-slate-300 mb-8 text-lg">Millions of Australians miss Centrelink payments and state grants they&apos;re fully entitled to. Check yours free.</p>
          <Link href="/au/check" className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#059669' }}>
            Check My Australian Benefits ⚡
          </Link>
        </div>
      </section>
    </>
  );
}
