import { supabaseAdmin } from '@/lib/supabase';
import { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/config';
import { Navbar } from '@/components/Navbar';

import { HomeSearch } from './HomeSearch';
import { FAQAccordion } from '@/components/FAQAccordion';
import articlesIndex from '@/content/articles-index.json';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `SchemeAtlas — Find Every Government Scheme You Qualify For | India ${new Date().getFullYear()}`,
  description: 'Discover 1,815+ central and state government schemes across India. AI-powered eligibility checker. Updated daily. Find schemes for farmers, women, students, SC/ST and more.',
  alternates: {
    canonical: 'https://schemeatlas.com',
  },
};

// ─── Category colour system ───────────────────────────────────────────────
const CATEGORY_CONFIG = [
  {
    name: 'Farmers',
    label: 'Agriculture Schemes',
    color: '#2D7A3A',
    href: '/in?category=Farmers',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-8 2C20 6 17 8 17 8z"/>
      </svg>
    ),
  },
  {
    name: 'Students',
    label: 'Scholarships & Education',
    color: '#1B5FA8',
    href: '/in?category=Students',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
      </svg>
    ),
  },
  {
    name: 'Women',
    label: 'Women Empowerment',
    color: '#C2185B',
    href: '/in?category=Women',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M13 11.5V14h2v2h-2v2h-2v-2H9v-2h2v-2.5C8.47 10.78 7 9.02 7 7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.02-1.47 3.78-4 4.5zM12 4C10.35 4 9 5.35 9 7s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
      </svg>
    ),
  },
  {
    name: 'Healthcare',
    label: 'Health & Insurance',
    color: '#C62828',
    href: '/in?category=Healthcare',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>
    ),
  },
  {
    name: 'Business',
    label: 'MSME & Business',
    color: '#E65100',
    href: '/in?category=Business',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H4V9h16v10zM12 3c-2.76 0-5 2.24-5 5h2c0-1.66 1.34-3 3-3s3 1.34 3 3h2c0-2.76-2.24-5-5-5z"/>
      </svg>
    ),
  },
  {
    name: 'SC / ST',
    label: 'SC, ST & OBC',
    color: '#4527A0',
    href: '/in?category=SC / ST',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
      </svg>
    ),
  },
];

// ─── India Map SVG — interactive hotspots ────────────────────────────────
function IndiaMapSVG() {
  const states = [
    { id: 'jammu-kashmir', cx: 155, cy: 68, r: 18, label: 'J&K' },
    { id: 'himachal-pradesh', cx: 175, cy: 100, r: 14, label: 'HP' },
    { id: 'punjab', cx: 148, cy: 108, r: 14, label: 'PB' },
    { id: 'uttarakhand', cx: 200, cy: 115, r: 14, label: 'UK' },
    { id: 'haryana', cx: 163, cy: 128, r: 13, label: 'HR' },
    { id: 'delhi', cx: 178, cy: 138, r: 11, label: 'DL' },
    { id: 'rajasthan', cx: 140, cy: 175, r: 22, label: 'RJ' },
    { id: 'uttar-pradesh', cx: 210, cy: 160, r: 22, label: 'UP' },
    { id: 'bihar', cx: 250, cy: 165, r: 16, label: 'BR' },
    { id: 'sikkim', cx: 285, cy: 135, r: 10, label: 'SK' },
    { id: 'west-bengal', cx: 278, cy: 185, r: 16, label: 'WB' },
    { id: 'gujarat', cx: 118, cy: 210, r: 20, label: 'GJ' },
    { id: 'madhya-pradesh', cx: 185, cy: 210, r: 24, label: 'MP' },
    { id: 'jharkhand', cx: 258, cy: 195, r: 14, label: 'JH' },
    { id: 'odisha', cx: 258, cy: 225, r: 16, label: 'OR' },
    { id: 'chhattisgarh', cx: 225, cy: 228, r: 16, label: 'CG' },
    { id: 'maharashtra', cx: 162, cy: 255, r: 24, label: 'MH' },
    { id: 'telangana', cx: 205, cy: 270, r: 16, label: 'TS' },
    { id: 'andhra-pradesh', cx: 218, cy: 305, r: 18, label: 'AP' },
    { id: 'karnataka', cx: 176, cy: 305, r: 20, label: 'KA' },
    { id: 'goa', cx: 148, cy: 290, r: 9, label: 'GA' },
    { id: 'kerala', cx: 173, cy: 348, r: 16, label: 'KL' },
    { id: 'tamil-nadu', cx: 210, cy: 345, r: 18, label: 'TN' },
    { id: 'assam', cx: 305, cy: 155, r: 16, label: 'AS' },
    { id: 'arunachal-pradesh', cx: 330, cy: 130, r: 14, label: 'AR' },
    { id: 'nagaland', cx: 332, cy: 162, r: 10, label: 'NL' },
    { id: 'manipur', cx: 330, cy: 180, r: 10, label: 'MN' },
    { id: 'mizoram', cx: 320, cy: 200, r: 10, label: 'MZ' },
    { id: 'tripura', cx: 308, cy: 195, r: 10, label: 'TR' },
    { id: 'meghalaya', cx: 305, cy: 170, r: 11, label: 'ML' },
  ];

  return (
    <div className="relative w-full flex items-center justify-center" style={{ minHeight: '380px' }}>
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div style={{ width: 320, height: 320, background: 'radial-gradient(circle, rgba(255,107,0,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <svg
        viewBox="80 50 290 330"
        style={{ width: '100%', maxWidth: 360, filter: 'drop-shadow(0 8px 24px rgba(255,107,0,0.12))' }}
        aria-label="Interactive map of India — click a state to browse its schemes"
      >
        {/* Outline of India — simplified polygon */}
        <path
          d="M155,68 L178,60 L208,65 L235,72 L260,90 L280,110 L310,120 L335,125 L345,140 L330,155 L340,175 L330,200 L315,210 L308,198 L295,205 L275,218 L270,240 L255,260 L240,280 L225,300 L218,320 L212,345 L200,360 L185,368 L170,358 L160,345 L158,325 L148,310 L138,295 L145,285 L148,272 L140,255 L128,245 L118,228 L110,210 L105,195 L108,178 L115,160 L120,145 L130,135 L140,125 L148,110 L148,95 L155,80 Z"
          fill="rgba(255,107,0,0.04)"
          stroke="rgba(255,107,0,0.18)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* State hotspots */}
        {states.map((s) => (
          <a key={s.id} href={`/in/${s.id}`} aria-label={`${s.label} schemes`}>
            <g className="state-hotspot" style={{ cursor: 'pointer' }}>
              <circle
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill="rgba(255,107,0,0.12)"
                stroke="rgba(255,107,0,0.35)"
                strokeWidth="1"
                style={{ transition: 'all 0.2s' }}
              />
              <circle
                cx={s.cx}
                cy={s.cy}
                r={s.r - 4}
                fill="rgba(255,107,0,0.20)"
                className="inner-dot"
              />
              <text
                x={s.cx}
                y={s.cy + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={s.r < 12 ? 7 : 8}
                fontWeight="700"
                fill="#CC4400"
                style={{ pointerEvents: 'none', fontFamily: 'DM Sans, sans-serif' }}
              >
                {s.label}
              </text>
            </g>
          </a>
        ))}
      </svg>

      <style>{`
        .state-hotspot:hover circle { fill: rgba(255,107,0,0.28); stroke: #FF6B00; stroke-width: 2; }
        .state-hotspot:hover .inner-dot { fill: rgba(255,107,0,0.45); }
        .state-hotspot:hover text { fill: #FF6B00; }
      `}</style>

      {/* Map caption */}
      <div className="absolute bottom-0 left-0 right-0 text-center">
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>Click any state to browse its schemes</span>
      </div>
    </div>
  );
}

export default async function HomePage() {
  let trendingSchemes: any[] = [];
  let latestSchemes: any[] = [];

  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

    const [
      { data: trending, error: err3 },
      { data: latest, error: err4 }
    ] = await Promise.all([
      supabase
        .from('schemes')
        .select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url')
        .eq('is_published', true)
        .eq('country_code', 'IN')
        .order('views', { ascending: false })
        .limit(3),
      supabase
        .from('schemes')
        .select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url')
        .eq('is_published', true)
        .eq('country_code', 'IN')
        .not('ministry', 'is', null)
        .not('official_url', 'is', null)
        .order('discovered_at', { ascending: false })
        .limit(3),
    ]);

    if (!err3 && trending) trendingSchemes = trending;
    if (!err4 && latest) latestSchemes = latest;
  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
  }

  const indianStates = COUNTRIES['IN']?.states || [];

  const CATEGORY_COLOURS: Record<string, string> = {
    'Farmers': '#2D7A3A',
    'Students': '#1B5FA8',
    'Women': '#C2185B',
    'Healthcare': '#C62828',
    'Business': '#E65100',
    'SC / ST': '#4527A0',
    'Housing': '#06B6D4',
  };

  // Filter out language variant articles from homepage
  const displayArticles = (articlesIndex as any[])
    .filter((a) => !/-(hi|te|ta|mr|gu|kn|ml|pa|or|yo|sw)$/.test(a.slug || ''))
    .slice(0, 3);

  const CATEGORY_ARTICLE_COLORS: Record<string, string> = {
    'Loans': '#1B5FA8',
    'Insurance': '#4527A0',
    'Earn Money': '#2D7A3A',
    'Investment': '#E65100',
    'Tax': '#C62828',
    'Schemes': '#FF6B00',
  };

  const testimonials = [
    {
      quote: 'A farmer from Maharashtra discovered PM-Kisan through SchemeAtlas and enrolled in under 10 minutes — without visiting any government office.',
      location: 'Maharashtra',
      category: 'Farmers',
      saved: '₹6,000/year',
      icon: '🌾',
    },
    {
      quote: 'A student from Bihar used SchemeAtlas to find a state scholarship she didn\'t know she qualified for, covering her full college fees.',
      location: 'Bihar',
      category: 'Students',
      saved: '₹40,000',
      icon: '🎓',
    },
    {
      quote: 'A woman entrepreneur from Rajasthan applied for a MSME loan scheme through SchemeAtlas and got approved in 3 weeks.',
      location: 'Rajasthan',
      category: 'Business',
      saved: '₹2L loan',
      icon: '💼',
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--warm-bg)' }}>

      {/* ── HERO SECTION ─────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(105deg, rgba(255,153,51,0.07) 0%, #FAFAF8 55%, rgba(19,136,8,0.04) 100%)', minHeight: 520 }}
      >
        {/* Subtle top border in saffron */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #FF6B00, #FF9933, #138808)', position: 'absolute', top: 0, left: 0, right: 0 }} />

        <Navbar variant="light" />

        <div className="max-w-[1200px] mx-auto px-[24px] pt-[56px] pb-[64px]">
          <div className="flex flex-col lg:flex-row items-center gap-[48px]">

            {/* Left column — 60% */}
            <div className="flex-1 lg:w-[60%]">
              {/* Badge */}
              <div
                className="inline-flex items-center gap-[8px] rounded-[20px] px-[14px] py-[6px] text-[12px] font-[700] mb-[24px]"
                style={{ background: 'rgba(255,107,0,0.10)', border: '1px solid rgba(255,107,0,0.25)', color: '#CC4400' }}
              >
                🇮🇳 India's #1 Government Schemes Platform · 1,815+ Active Schemes
              </div>

              <h1
                className="font-[800] tracking-[-0.01em] mb-[20px] leading-[1.1]"
                style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}
              >
                Find Every Government Scheme{' '}
                <span style={{ color: 'var(--saffron)' }}>You Qualify For</span>
              </h1>

              <p
                className="mb-[36px] leading-[1.7]"
                style={{ fontSize: 17, color: 'var(--text-muted)', maxWidth: 520 }}
              >
                1,815+ active central &amp; state schemes. AI-powered eligibility check in 2 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-[12px] mb-[40px]">
                <Link href="/in/check" className="btn-saffron text-[15px]">
                  Check My Eligibility Free →
                </Link>
                <Link href="/schemes" className="btn-outline text-[14px]">
                  Browse All 1,815 Schemes
                </Link>
              </div>

              {/* Search */}
              <div className="max-w-[540px]">
                <HomeSearch />
              </div>
            </div>

            {/* Right column — 40% */}
            <div className="lg:w-[40%] w-full flex justify-center">
              <IndiaMapSVG />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────── */}
      <section style={{ background: '#1a1a1a' }} className="py-[20px] px-[24px]">
        <div className="max-w-[1200px] mx-auto flex justify-center items-center gap-[48px] flex-wrap">
          {[
            { number: '1,815+', label: 'Active Schemes' },
            { number: '28', label: 'States Covered' },
            { number: '5,500+', label: 'Citizens Helped' },
            { number: 'Daily', label: 'Updated' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-[12px] text-white">
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{item.number}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{item.label}</div>
              </div>
              {i < 3 && <div className="hidden md:block" style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.12)', marginLeft: 48 }} />}
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY CARDS (3×2 grid) ────────────────────────────────── */}
      <section id="categories" className="bg-white py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-[40px]">
            <p className="section-label mx-auto">Browse by Category</p>
            <h2 className="section-title">What Are You Looking For?</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 15 }}>Find schemes targeted to your specific situation and needs.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-[16px]">
            {CATEGORY_CONFIG.map((cat, i) => (
              <Link
                key={cat.name}
                href={cat.href}
                className="block rounded-[var(--radius-md)] p-[22px_20px] cat-border-card scheme-card-hover transition-all group relative overflow-hidden"
                style={{
                  background: `${cat.color}14`,
                  borderLeftColor: cat.color,
                  borderTop: `1px solid ${cat.color}22`,
                  borderRight: `1px solid ${cat.color}22`,
                  borderBottom: `1px solid ${cat.color}22`,
                  animationDelay: `${i * 0.07}s`,
                }}
              >
                <div
                  className="w-[52px] h-[52px] rounded-[12px] flex items-center justify-center mb-[14px] transition-transform group-hover:scale-105"
                  style={{ background: `${cat.color}20`, color: cat.color }}
                >
                  {cat.icon}
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{cat.name}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{cat.label}</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>Browse schemes →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MONEY GUIDES / ARTICLES ──────────────────────────────────── */}
      <section style={{ background: 'var(--surface-gray)' }} className="py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[32px] gap-4">
            <div>
              <p className="section-label">Money Guides</p>
              <h2 className="section-title">Loans · Insurance · Earn Online</h2>
              <p className="section-sub mb-0">Expert answers to India's most searched financial questions</p>
            </div>
            <Link href="/articles" className="btn-outline whitespace-nowrap">View All Guides →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
            {displayArticles.length > 0 ? (
              displayArticles.map((article: any, i: number) => {
                const catColor = CATEGORY_ARTICLE_COLORS[article.category] || '#3B3BF9';
                return (
                  <Link
                    key={article.slug}
                    href={`/articles/${article.slug}`}
                    className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden hover:-translate-y-[2px] hover:shadow-[var(--shadow-sm)] transition-all duration-300 group block cat-border-card"
                    style={{ borderLeftColor: catColor, animationDelay: `${i * 0.1}s` }}
                  >
                    {/* Category gradient header */}
                    <div
                      className="h-[6px] w-full"
                      style={{ background: catColor }}
                    />
                    <div className="p-[20px]">
                      <span
                        className="text-[11px] font-[700] px-[10px] py-[4px] rounded-[20px] inline-block mb-[10px]"
                        style={{ background: `${catColor}18`, color: catColor }}
                      >
                        {article.category || 'Guide'}
                      </span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, color: 'var(--text-primary)', marginBottom: 8 }} className="line-clamp-2 group-hover:text-[var(--saffron)] transition-colors">
                        {article.title}
                      </h3>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }} className="line-clamp-2">
                        {article.desc}
                      </p>
                      <div className="flex justify-between items-center" style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12, color: 'var(--text-faint)' }}>
                        <span>⏱️ {article.time || article.readTime || '5 min read'}</span>
                        <span style={{ color: catColor, fontWeight: 700 }}>Read →</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // Coming Soon placeholders when no articles
              ['Loans Guide', 'Insurance Guide', 'Earn Money'].map((title, i) => (
                <div key={i} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[20px] opacity-70">
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, marginBottom: 16 }} />
                  <span className="text-[11px] font-[700] px-[10px] py-[4px] rounded-[20px] inline-block mb-[10px]" style={{ background: '#F3F4F6', color: '#9CA3AF' }}>Coming Soon</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-faint)', marginBottom: 8 }}>{title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-faint)' }}>New guide publishing soon — check back!</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── MOST VIEWED SCHEMES ──────────────────────────────────────── */}
      {trendingSchemes.length > 0 && (
        <section className="bg-white py-[72px] px-[24px]">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[32px] gap-4">
              <div>
                <p className="section-label">🔥 Trending Right Now</p>
                <h2 className="section-title">Most Viewed Schemes</h2>
              </div>
              <Link href="/schemes" className="btn-outline whitespace-nowrap">View All 1,815 →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {trendingSchemes.map((scheme, i) => {
                const catColor = CATEGORY_COLOURS[scheme.category] || '#3B3BF9';
                return (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[20px] hover:-translate-y-[2px] hover:shadow-[var(--shadow-sm)] transition-all flex flex-col cat-border-card card-animate"
                    style={{ borderLeftColor: catColor, animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-center justify-between mb-[12px]">
                      <div
                        className="flex items-center gap-[6px] text-[12px] font-[600] px-[12px] py-[4px] rounded-[20px]"
                        style={{ background: `${catColor}18`, color: catColor }}
                      >
                        {scheme.category}
                      </div>
                      <div
                        className="text-[11px] font-[700] px-[9px] py-[3px] rounded-[20px]"
                        style={{ background: '#F3F4F6', color: '#5C5C5C' }}
                      >
                        {scheme.scheme_type === 'central' ? 'Central' : 'State'}
                      </div>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.4 }} className="line-clamp-2">{scheme.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16, flex: 1 }} className="line-clamp-2">{scheme.what_you_get}</p>

                    <div className="flex items-center justify-between mt-auto" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Benefit</div>
                        <span className="benefit-badge">{scheme.benefit_amount || 'View Details'}</span>
                      </div>
                      <Link
                        href={`/schemes/${scheme.slug}`}
                        className="btn-saffron"
                        style={{ padding: '8px 14px', fontSize: 13 }}
                      >
                        Check Eligibility
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── NEWLY ADDED SCHEMES ──────────────────────────────────────── */}
      {latestSchemes.length > 0 && (
        <section style={{ background: 'var(--surface-gray)' }} className="py-[72px] px-[24px]">
          <div className="max-w-[1200px] mx-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
              <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', letterSpacing: '-0.01em' }} className="flex items-center gap-3">
                <span style={{ fontSize: 22 }}>✨</span> Newly Added Schemes
              </h2>
              <Link href="/schemes" style={{ color: 'var(--saffron)', fontWeight: 700 }} className="hidden sm:block hover:underline">View All →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {latestSchemes.map((scheme) => {
                const catColor = CATEGORY_COLOURS[scheme.category] || '#3B3BF9';
                return (
                  <div
                    key={scheme.id}
                    className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[20px] hover:-translate-y-[2px] hover:shadow-[var(--shadow-sm)] transition-all flex flex-col cat-border-card"
                    style={{ borderLeftColor: catColor }}
                  >
                    <div className="flex items-center gap-[6px] text-[12px] font-[600] px-[12px] py-[4px] rounded-[20px] w-fit mb-[12px]" style={{ background: `${catColor}18`, color: catColor }}>
                      {scheme.category}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.4 }} className="line-clamp-2">{scheme.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16, flex: 1 }} className="line-clamp-2">{scheme.what_you_get}</p>
                    <div className="flex items-center justify-between mt-auto" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <span className="benefit-badge">{scheme.benefit_amount || 'View Details'}</span>
                      <Link href={`/schemes/${scheme.slug}`} className="btn-saffron" style={{ padding: '7px 12px', fontSize: 12 }}>View →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── BROWSE BY STATE ──────────────────────────────────────────── */}
      <section id="states" className="bg-white py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto animate-fade-in-up delay-100">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
            <h2 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Browse by <span style={{ color: 'var(--saffron)' }}>State & UTs</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {indianStates.map((state: any, i: number) => (
              <Link
                key={i}
                href={`/in/${state.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="bg-white rounded-[var(--radius-sm)] border border-[var(--border)] p-4 flex flex-col items-center justify-center text-center hover:border-[var(--saffron)] hover:bg-[var(--saffron-light)] transition-all shadow-sm group"
              >
                <div style={{ fontSize: 22, marginBottom: 6 }} className="group-hover:scale-110 transition-transform">{state.icon || '🏛️'}</div>
                <h3 style={{ fontWeight: 700, fontSize: 11, color: 'var(--text-primary)' }} className="group-hover:text-[var(--saffron)] transition-colors">{state.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ background: 'var(--surface-gray)' }} className="py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-[40px]">
            <p className="section-label mx-auto">⚡ How It Works</p>
            <h2 className="section-title">How <span style={{ color: 'var(--saffron)' }}>SchemeAtlas</span> Works</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 16 }}>We use AI to instantly match your profile to thousands of complex government rules.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-[24px] relative">
            {[
              { icon: '📝', title: '1. Tell us about you', desc: 'Enter your age, caste category, state, and income. No personal info required.' },
              { icon: '🤖', title: '2. AI Matching', desc: 'Our AI engine scans 1,815+ state and central schemes in 30 seconds.' },
              { icon: '🎯', title: '3. Claim Benefits', desc: 'Get exact links to official portals along with required document lists.' },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-[32px] relative overflow-hidden hover:-translate-y-[2px] transition-transform shadow-sm card-animate" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="absolute top-[16px] right-[20px] text-[56px] font-[900] leading-none select-none" style={{ background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{i + 1}</div>
                <div style={{ fontSize: 40, marginBottom: 18 }}>{step.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.75 }}>{step.desc}</p>
                {i < 2 && <div className="hidden md:block absolute text-[24px] text-[var(--border)] top-1/2 right-[-14px] -translate-y-1/2 z-20">→</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="bg-white py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-[40px]">
            <p className="section-label mx-auto">Real Outcomes</p>
            <h2 className="section-title">Citizens Who Found Their Benefits</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-[20px]">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-md)] p-[24px] cat-border-card"
                style={{
                  background: 'var(--surface-gray)',
                  border: `1px solid var(--border)`,
                  borderLeftColor: CATEGORY_COLOURS[t.category] || 'var(--saffron)',
                  borderLeftWidth: 3,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 14 }}>{t.icon}</div>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75, marginBottom: 16, fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>📍 {t.location}</span>
                  <span className="benefit-badge">{t.saved}</span>
                </div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', marginTop: 20 }}>
            * Anonymised composite outcomes based on real scheme benefits.
          </p>
        </div>
      </section>

      {/* ── PEOPLE ALSO ASK ──────────────────────────────────────────── */}
      <section style={{ background: 'var(--surface-gray)' }} className="py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[56px] items-start">
          <div>
            <p className="section-label">❓ People Also Ask</p>
            <h2 className="section-title mb-[24px]">Real Questions,<br />Clear Answers</h2>
            <p className="section-sub mb-[24px]">
              We publish in-depth answers to India's most searched questions on
              schemes, loans, insurance and earning money — updated weekly.
            </p>
            <div className="flex gap-[10px] mt-[20px]">
              {[
                { number: '120+', label: 'Guides Published' },
                { number: '4.8★', label: 'Reader Rating' },
                { number: 'Weekly', label: 'New Content' },
              ].map((item, i) => (
                <div key={i} className="bg-white border border-[var(--border)] rounded-[var(--radius-sm)] p-[10px_16px] text-center flex-1">
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{item.number}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <FAQAccordion />
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
    </div>
  );
}
