import { Metadata } from 'next';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Canadian Government Benefits & Programs 2026 | SchemeAtlas',
  description: 'Find federal and provincial benefit programs in Canada. CPP, OAS, CCB, Employment Insurance, CERB and provincial assistance. Free eligibility check.',
  alternates: { canonical: 'https://schemeatlas.com/ca' },
  openGraph: { title: 'Canadian Government Benefits 2026 | SchemeAtlas', url: 'https://schemeatlas.com/ca', siteName: 'SchemeAtlas' },
};

const CA_PROGRAMS = [
  { name: 'Canada Child Benefit (CCB)', amount: 'Up to CA$7,787/year per child', url: '/schemes/canada-child-benefit-ca' },
  { name: 'Employment Insurance (EI)', amount: '55% of insurable earnings', url: '/schemes/employment-insurance-ca' },
  { name: 'Old Age Security (OAS)', amount: 'CA$718.33/month (65+)', url: '/schemes/old-age-security-ca' },
  { name: 'Canada Pension Plan (CPP)', amount: 'Avg CA$831.92/month', url: '/schemes/canada-pension-plan-ca' },
  { name: 'GST/HST Credit', amount: 'Up to CA$519/year', url: '/schemes/gst-hst-credit-ca' },
  { name: 'Canada Workers Benefit', amount: 'Up to CA$1,518/year', url: '/schemes/canada-workers-benefit-ca' },
];

const CA_PROVINCES = [
  { code: 'ontario', name: 'Ontario', icon: '🏙️' },
  { code: 'british-columbia', name: 'British Columbia', icon: '🌲' },
  { code: 'quebec', name: 'Quebec', icon: '⚜️' },
  { code: 'alberta', name: 'Alberta', icon: '🏔️' },
  { code: 'manitoba', name: 'Manitoba', icon: '🌾' },
  { code: 'nova-scotia', name: 'Nova Scotia', icon: '🦞' },
];

export default async function CAHubPage() {
  let schemeCount = 0;
  let recentSchemes: { slug: string; name: string }[] = [];
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    const { count, data } = await supabase
      .from('schemes').select('slug, name', { count: 'exact' })
      .eq('country_code', 'CA').eq('is_published', true).eq('is_active', true)
      .order('discovered_at', { ascending: false }).limit(20);
    schemeCount = count || 0; recentSchemes = data || [];
  } catch { /* edge fallback */ }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'GovernmentService',
        name: 'Canadian Government Benefits & Programs 2026',
        areaServed: { '@type': 'Country', name: 'Canada', identifier: 'CA' },
        provider: { '@type': 'Organization', name: 'SchemeAtlas', url: 'https://schemeatlas.com' },
        url: 'https://schemeatlas.com/ca',
      }) }} />

      <div className="sr-only" aria-hidden="true">
        <h1>Canadian Government Benefits &amp; Programs 2026</h1>
        <ul>{recentSchemes.map(s => <li key={s.slug}><Link href={`/schemes/${s.slug}`}>{s.name}</Link></li>)}</ul>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 60%, #1a0a0a 100%)', minHeight: 420 }}>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-5" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
              🇨🇦 {schemeCount > 0 ? `${schemeCount}+` : '200+'} Federal &amp; Provincial Programs
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Canadian Government Benefits &amp; Programs 2026
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-xl">
              CPP, OAS, EI, CCB, GST Credit and 200+ federal and provincial programs. Find what you qualify for in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/ca/check" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#dc2626', boxShadow: '0 4px 24px rgba(220,38,38,0.4)' }}>
                Check My Eligibility →
              </Link>
              <Link href="/ca?show=all" className="inline-flex items-center justify-center px-7 py-4 rounded-xl font-bold text-slate-300 text-lg border border-slate-600 hover:border-slate-400 hover:text-white transition-all">
                Browse All Programs
              </Link>
            </div>
          </div>
          <div className="text-[120px] md:text-[160px] leading-none select-none">🇨🇦</div>
        </div>
      </section>

      {/* TOP PROGRAMS */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Key Federal Benefits</h2>
        <p className="text-slate-500 mb-8">Programs administered by the Government of Canada</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CA_PROGRAMS.map(p => (
            <Link key={p.name} href={p.url}
              className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-red-200 transition-all">
              <div>
                <div className="font-bold text-slate-800 group-hover:text-red-700">{p.name}</div>
                <div className="text-sm font-semibold text-red-600 mt-1">{p.amount}</div>
              </div>
              <span className="text-slate-300 group-hover:text-red-400 text-xl">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* PROVINCES */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Browse by Province</h2>
          <p className="text-slate-500 mb-8">Each province has additional programs on top of federal benefits</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CA_PROVINCES.map(p => (
              <Link key={p.code} href={`/ca/${p.code}`}
                className="group flex items-center gap-3 p-5 rounded-2xl border border-slate-100 bg-white hover:border-red-200 hover:bg-red-50 transition-all">
                <span className="text-3xl">{p.icon}</span>
                <span className="font-bold text-slate-800 group-hover:text-red-700">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #0f172a 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Are You Getting All Your Canadian Benefits?</h2>
          <p className="text-slate-300 mb-8 text-lg">Many Canadians miss out on benefits they&apos;re fully entitled to. Check your eligibility for free in 2 minutes.</p>
          <Link href="/ca/check" className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105" style={{ background: '#dc2626' }}>
            Check My Canadian Benefits ⚡
          </Link>
        </div>
      </section>
    </>
  );
}
