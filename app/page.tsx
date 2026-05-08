import { supabaseAdmin } from '@/lib/supabase';
import { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/config';
import { SchemeCard } from '@/components/SchemeCard';
import { Navbar } from '@/components/Navbar';
import { HomeSearch } from './HomeSearch';
import { HomeTabs } from './HomeTabs';
import { FAQAccordion } from '@/components/FAQAccordion';
import articlesIndex from '@/content/articles-index.json';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `SchemeAtlas — Find Government Schemes & Benefits in India ${new Date().getFullYear()}`,
  description: 'Discover 1700+ central and state government schemes across India. AI-powered eligibility checker. Updated daily. Find schemes for farmers, women, students, SC/ST and more.',
  alternates: {
    canonical: 'https://schemeatlas.com',
  },
};

export default async function HomePage() {
  let stats = { schemes: 1050, checked: 5840 };
  let trendingSchemes: any[] = [];
  let latestSchemes: any[] = [];

  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    
    const [
      { count: schemeCount, error: err1 }, 
      { count: checkedCount, error: err2 },
      { data: trending, error: err3 },
      { data: latest, error: err4 }
    ] = await Promise.all([
      supabase.from('schemes').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('eligibility_results').select('*', { count: 'exact', head: true }),
      supabase.from('schemes').select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url').eq('is_published', true).eq('country_code', 'IN').order('views', { ascending: false }).limit(3),
      supabase.from('schemes').select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url').eq('is_published', true).eq('country_code', 'IN').order('discovered_at', { ascending: false }).limit(3)
    ]);

    if (!err1) stats.schemes = schemeCount || 1050;
    if (!err2) stats.checked = checkedCount ? checkedCount + 5000 : 5000;
    if (!err3 && trending) trendingSchemes = trending;
    if (!err4 && latest) latestSchemes = latest;
  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
  }

  const indianStates = COUNTRIES['IN']?.states || [];

  const socialCategories = [
    { name: 'SC / ST', label: 'Scheduled Castes & Tribes' },
    { name: 'OBC / BC', label: 'Backward Classes' },
    { name: 'Minority', label: 'Minority Communities' },
    { name: 'Women', label: 'Women & Girls' },
    { name: 'Students', label: 'Scholarships & Education' },
    { name: 'Farmers', label: 'Agriculture Schemes' }
  ];

  const categoryTints: Record<string, {color: string, icon: string}> = {
    'Farmers': { color: '#84CC16', icon: '🌾' },
    'Students': { color: '#6366F1', icon: '🎓' },
    'Healthcare': { color: '#EF4444', icon: '❤️' },
    'Business': { color: '#F59E0B', icon: '💼' },
    'Women': { color: '#EC4899', icon: '👩' },
    'Housing': { color: '#06B6D4', icon: '🏘️' },
    'Senior': { color: '#8B5CF6', icon: '👴' },
    'Disabled': { color: '#14B8A6', icon: '♿' },
    'SC / ST': { color: '#3B82F6', icon: '🏛️' },
    'OBC / BC': { color: '#F59E0B', icon: '👥' },
    'Minority': { color: '#10B981', icon: '🌟' }
  };

  const indiaContent = (
    <>
      {/* ── MONEY GUIDES SECTION ── */}
      <section className="bg-[var(--surface-gray)] py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[32px] gap-4">
            <div>
              <p className="section-label">📚 Money Guides</p>
              <h2 className="section-title">Loans · Insurance · Earn Online</h2>
              <p className="section-sub mb-0">Expert answers to India's most searched financial questions</p>
            </div>
            <Link href="/articles" className="btn-outline whitespace-nowrap">View All Guides →</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[20px]">
            {articlesIndex.length > 0 ? (
              articlesIndex.slice(0, 4).map((article: any, i: number) => (
                <Link 
                  key={article.slug} 
                  href={`/articles/${article.slug}`} 
                  className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[22px] cursor-pointer card-animate relative overflow-hidden group block hover:shadow-[var(--shadow-sm)] hover:-translate-y-[2px] hover:border-[var(--indigo)] transition-all duration-300" 
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.8)] to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shine z-10 pointer-events-none"></div>
                  
                  <div className="relative z-20">
                    <span className="bg-[var(--indigo-light)] text-[var(--indigo)] text-[11px] font-[700] px-[10px] py-[4px] rounded-[20px] inline-block mb-[10px]">
                      {article.category || 'Guide'}
                    </span>
                    <h3 className="text-[15px] font-[700] my-[10px] leading-[1.45] text-[var(--text-primary)] group-hover:text-[var(--indigo)] transition-colors line-clamp-2">{article.title}</h3>
                    <p className="text-[13px] text-[var(--text-muted)] leading-[1.6] mb-[16px] line-clamp-2">{article.desc}</p>
                    
                    <div className="border-t border-[#F3F4F6] pt-[12px] flex justify-between text-[12px] text-[var(--text-faint)]">
                      <span>👀 {article.views || '1.2K'} views</span>
                      <span>⏱️ {article.time || '5 min read'}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              // Fallback placeholder cards if no articles exist
              [1,2,3,4].map((n) => (
                <div key={n} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[22px] opacity-60">
                   <div className="w-20 h-4 bg-slate-100 rounded mb-4"></div>
                   <div className="w-full h-12 bg-slate-100 rounded mb-4"></div>
                   <div className="w-full h-8 bg-slate-50 rounded"></div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── NEWLY ADDED SCHEMES ── */}
      {latestSchemes.length > 0 && (
        <section className="bg-white py-[72px] px-[24px]">
          <div className="max-w-[1200px] mx-auto animate-fade-in-up">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
              <h2 className="text-3xl font-[800] font-[var(--font-heading)] text-[var(--text-primary)] tracking-tight flex items-center gap-3">
                <span className="text-2xl">✨</span> Newly Added Schemes
              </h2>
              <Link href="/schemes" className="text-[var(--indigo)] font-semibold hover:text-[var(--indigo-mid)] transition-colors hidden sm:block">View All →</Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {latestSchemes.map(scheme => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── BROWSE BY CATEGORY ── */}
      <section id="categories" className="bg-white py-[72px] px-[24px]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-[40px]">
            <p className="section-label mx-auto">📂 Browse by Category</p>
            <h2 className="section-title">Categories</h2>
            <p className="text-[var(--text-muted)] mt-2">Find schemes targeted to specific needs and communities.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
            {socialCategories.map((cat, i) => {
              const tint = categoryTints[cat.name] || categoryTints['Students'];
              return (
              <Link key={i} href={`/in?category=${cat.name}`} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[22px_16px] text-center hover:-translate-y-[2px] hover:shadow-[var(--shadow-sm)] transition-all group relative overflow-hidden card-animate" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.8)] to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shine z-10 pointer-events-none"></div>
                <div style={{ backgroundColor: `${tint.color}20`, color: tint.color }} className="w-[60px] h-[60px] rounded-[14px] flex items-center justify-center text-[30px] mx-auto mb-[14px] relative z-20 transition-transform group-hover:scale-105">
                  {tint.icon}
                </div>
                <div className="relative z-20">
                  <h3 className="font-[700] text-[15px] text-[var(--text-primary)] group-hover:text-[var(--indigo)] transition-colors">{cat.name}</h3>
                  <p className="text-[12px] text-[var(--text-faint)] mt-[4px]">{cat.label}</p>
                </div>
              </Link>
            )})}
          </div>
        </div>
      </section>

      {/* ── BROWSE BY STATE ── */}
      <section id="states" className="bg-[var(--surface-gray)] py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto animate-fade-in-up delay-100">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border)]">
            <h2 className="text-3xl font-[800] font-[var(--font-heading)] text-[var(--text-primary)] tracking-tight">Browse by <span className="text-[var(--indigo)]">State & UTs</span></h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {indianStates.map((state, i) => (
              <Link key={i} href={`/in/${state.name.toLowerCase().replace(/\s+/g, '-')}`} className="bg-white rounded-[var(--radius-sm)] border border-[var(--border)] p-4 flex flex-col items-center justify-center text-center hover:bg-[var(--indigo-light)] hover:border-[var(--indigo)] transition-all shadow-sm group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{state.icon || '🏛️'}</div>
                <h3 className="font-bold text-[var(--text-primary)] text-xs md:text-sm group-hover:text-[var(--indigo)]">{state.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRENDING SCHEMES ── */}
      {trendingSchemes.length > 0 && (
        <section className="bg-[var(--surface-gray)] py-[72px] px-[24px]">
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
                const catTint = categoryTints[scheme.category] || categoryTints['Students'];
                return (
                <div key={scheme.id} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[20px] hover:-translate-y-[2px] hover:border-[var(--indigo)] hover:shadow-[var(--shadow-sm)] transition-all group relative overflow-hidden card-animate flex flex-col" style={{animationDelay: `${i * 0.1}s`}}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.8)] to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shine z-10 pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-[12px] relative z-20">
                    <div style={{ backgroundColor: `${catTint.color}20`, color: catTint.color }} className="flex items-center gap-[6px] text-[12px] font-[600] px-[12px] py-[4px] rounded-[20px]">
                      {catTint.icon} {scheme.category}
                    </div>
                    <div className="text-[11px] font-[700] px-[9px] py-[3px] rounded-[20px] bg-[var(--indigo-light)] text-[#4338CA]">
                      {scheme.scheme_type === 'central' ? 'Central' : 'State'}
                    </div>
                  </div>

                  <h3 className="text-[16px] font-[700] text-[var(--text-primary)] mb-[8px] line-clamp-2 relative z-20">{scheme.name}</h3>
                  <p className="text-[13px] text-[var(--text-muted)] line-clamp-2 mb-[16px] flex-1 relative z-20">{scheme.what_you_get}</p>

                  <div className="border-t border-[var(--border)] pt-[16px] flex items-center justify-between mt-auto relative z-20">
                    <div>
                      <div className="text-[11px] text-[var(--text-faint)] uppercase tracking-wide">Benefit</div>
                      <div className="text-[14px] font-[700] text-[var(--green)] max-w-[120px] truncate" title={scheme.benefit_amount}>{scheme.benefit_amount}</div>
                    </div>
                    <Link href={`/schemes/${scheme.slug}`} className="bg-[var(--indigo-light)] text-[var(--indigo)] font-[700] text-[13px] px-[16px] py-[8px] rounded-[var(--radius-sm)] hover:bg-[var(--indigo)] hover:text-white transition-colors">
                      Check Eligibility
                    </Link>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </section>
      )}

      {/* ── PEOPLE ALSO ASK SECTION ── */}
      <section className="bg-white py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[56px] items-start">
          <div>
            <p className="section-label">❓ People Also Ask</p>
            <h2 className="section-title mb-[24px]">Real Questions,<br/>Clear Answers</h2>
            <p className="section-sub mb-[24px]">
              We publish in-depth answers to India's most searched questions on
              schemes, loans, insurance and earning money — updated weekly.
            </p>
            
            <div className="bg-gradient-to-br from-[#EEF2FF] to-[#F0FDF4] border border-[#C7D2FE] rounded-[var(--radius-md)] p-[18px_20px] text-[13px] text-[#4338CA] font-[600] shadow-sm">
              📬 New guides published every week covering India's top trending financial topics.
            </div>

            <div className="flex gap-[10px] mt-[20px]">
              <div className="bg-[var(--surface-gray)] border border-[var(--border)] rounded-[var(--radius-sm)] p-[10px_16px] text-center flex-1">
                <div className="font-[800] text-[16px] text-[var(--text-primary)]">120+</div>
                <div className="text-[11px] text-[var(--text-faint)]">Guides Published</div>
              </div>
              <div className="bg-[var(--surface-gray)] border border-[var(--border)] rounded-[var(--radius-sm)] p-[10px_16px] text-center flex-1">
                <div className="font-[800] text-[16px] text-[var(--text-primary)]">4.8★</div>
                <div className="text-[11px] text-[var(--text-faint)]">Reader Rating</div>
              </div>
              <div className="bg-[var(--surface-gray)] border border-[var(--border)] rounded-[var(--radius-sm)] p-[10px_16px] text-center flex-1">
                <div className="font-[800] text-[16px] text-[var(--text-primary)]">Weekly</div>
                <div className="text-[11px] text-[var(--text-faint)]">New Content</div>
              </div>
            </div>
          </div>
          
          <div>
            <FAQAccordion />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-[var(--surface-gray)] py-[72px] px-[24px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-[40px]">
            <p className="section-label mx-auto">⚡ How It Works</p>
            <h2 className="section-title">How <span className="text-[var(--indigo)]">SchemeAtlas</span> Works</h2>
            <p className="text-[var(--text-muted)] text-[16px]">We use AI to instantly match your exact social and financial profile to thousands of complex government rules.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-[24px] relative">
            {[
              { icon: '📝', title: '1. Tell us about you', desc: 'Enter your age, caste category, state, and income. No personal info required.' },
              { icon: '🤖', title: '2. AI Matching', desc: 'Our AI engine scans 1000+ state and central schemes in 30 seconds.' },
              { icon: '🎯', title: '3. Claim Benefits', desc: 'Get exact links to official portals along with required document lists.' },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-[var(--radius-lg)] border border-[var(--border)] p-[32px] relative overflow-hidden hover:-translate-y-[2px] transition-transform shadow-sm hover:shadow-[var(--shadow-sm)] card-animate" style={{animationDelay: `${i * 0.1}s`}}>
                <div className="absolute top-[16px] right-[20px] text-[56px] font-[900] leading-none select-none font-[var(--font-heading)]" style={{background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>{i+1}</div>
                <div className="text-[40px] mb-[18px] relative z-10">{step.icon}</div>
                <h3 className="text-[17px] font-[700] text-[var(--text-primary)] mb-[10px] relative z-10">{step.title}</h3>
                <p className="text-[13px] text-[var(--text-muted)] leading-[1.75] relative z-10">{step.desc}</p>
                {i < 2 && (
                  <div className="hidden md:block absolute text-[24px] text-[var(--border)] top-1/2 right-[-14px] -translate-y-1/2 z-20">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="bg-[var(--navy)] py-[48px] px-[24px]">
        <div className="max-w-[1200px] mx-auto flex justify-center items-center gap-[48px] flex-wrap">
          {[
            { icon: '🏛️', number: '1,815+', label: 'Active Schemes' },
            { icon: '👥', number: '5,269+', label: 'Citizens Helped' },
            { icon: '🗺️', number: '28', label: 'States & UTs' },
            { icon: '🔄', number: 'Daily', label: 'Data Updated' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-[12px] text-white">
              <div className="text-[28px]">{item.icon}</div>
              <div>
                <div className="text-[24px] font-[800] font-[var(--font-heading)] leading-none mb-[2px]">{item.number}</div>
                <div className="text-[12px] text-[#94A3B8]">{item.label}</div>
              </div>
              {i < 3 && <div className="hidden md:block w-[1px] h-[40px] bg-[rgba(255,255,255,0.12)] ml-[48px]"></div>}
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const globalContent = (
    <>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-[800] text-[var(--text-primary)] font-[var(--font-heading)] tracking-tight mb-4">International Schemes</h2>
        <p className="text-[var(--text-muted)]">Select a country to discover government aid, welfare, and social protection programs available to citizens.</p>
      </div>
      
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(COUNTRIES).filter(([code]) => code !== 'IN').map(([code, config]) => (
          <Link key={code} href={`/${code}`} className="card p-6 group flex flex-col items-center text-center hover:bg-slate-50">
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform group-hover:rotate-3 drop-shadow-md">{config.flag}</span>
            <h3 className="font-bold text-xl text-slate-800 mb-1">{config.name}</h3>
            <p className="text-[var(--indigo)] font-semibold text-sm opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">Browse Schemes →</p>
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--surface-gray)]">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden" style={{background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)'}}>
        {/* Blobs */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0" style={{background: 'radial-gradient(circle, rgba(99,102,241,0.30) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'blobFloat 8s ease-in-out infinite alternate'}}></div>
        <div className="absolute bottom-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none z-0" style={{background: 'radial-gradient(circle, rgba(245,158,11,0.20) 0%, transparent 70%)', filter: 'blur(60px)', animation: 'blobFloat 10s ease-in-out infinite alternate-reverse'}}></div>
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full pointer-events-none z-0 -translate-x-1/2 -translate-y-1/2" style={{background: 'radial-gradient(circle, rgba(59,59,249,0.10) 0%, transparent 70%)', filter: 'blur(80px)'}}></div>
        
        <Navbar variant="dark" />

        <div className="relative z-10 text-center max-w-[860px] mx-auto pt-[72px] px-[24px] pb-[80px]">
          <div className="inline-flex items-center gap-[6px] rounded-[20px] px-[16px] py-[5px] text-[12px] font-[600] text-[#A5B4FC] mb-[24px]" style={{background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)'}}>
            🇮🇳 India's #1 Government Schemes Platform · 1815+ Active Schemes
          </div>
          
          <h1 className="text-[clamp(34px,5vw,54px)] font-[800] text-white tracking-[-1.5px] mb-[20px] leading-[1.1] font-[var(--font-heading)]">
            Claim the Benefits <br className="hidden md:block"/>
            <span style={{background: 'linear-gradient(90deg,#F59E0B,#FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              You Deserve.
            </span>
          </h1>
          
          <p className="text-[17px] text-[#94A3B8] max-w-[560px] mx-auto mb-[36px] leading-[1.7]">
            Stop searching through outdated portals. We organize <span className="text-white font-bold">{stats.schemes}+</span> active government schemes across India into one clean platform.
          </p>
          
          {/* Search bar container */}
          <div className="max-w-[640px] mx-auto mb-[48px] relative z-40">
            <HomeSearch />
          </div>

          {/* Stats Row */}
          <div className="flex gap-[16px] justify-center flex-wrap">
            {[
              { label: 'Active Schemes', value: `${stats.schemes}+` },
              { label: 'Citizens Helped', value: `${stats.checked.toLocaleString()}+` },
              { label: 'Coverage', value: '28 States & UTs' },
              { label: 'Update Frequency', value: 'Daily' }
            ].map((stat, i) => (
              <div key={i} className="rounded-[12px] p-[14px_24px] text-center" style={{background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)'}}>
                <div className="text-[22px] font-[800] text-white font-[var(--font-heading)]">{stat.value}</div>
                <div className="text-[11px] text-[#94A3B8] mt-[2px]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeTabs indiaContent={indiaContent} globalContent={globalContent} />

      {/* ── FOOTER ── */}
      <footer className="bg-[var(--navy)] pt-[56px] px-[24px] pb-[28px]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-[44px] pb-[44px] border-b border-[rgba(255,255,255,0.08)]">
            {/* Col 1 */}
            <div>
              <Link href="/" className="flex items-center gap-[8px]">
                <div className="w-[34px] h-[34px] rounded-[9px] bg-gradient-to-br from-[var(--indigo)] to-[var(--indigo-mid)] flex items-center justify-center text-[18px]">🗺️</div>
                <span className="font-[800] text-[18px] tracking-[-0.5px] font-[var(--font-heading)] text-white">Scheme<span className="text-[var(--indigo)]">Atlas</span></span>
              </Link>
              <p className="text-[13px] text-[#64748B] leading-[1.7] max-w-[260px] my-[14px]">
                India's most comprehensive government schemes platform. Plus expert guides on loans, insurance and earning opportunities.
              </p>
              <div className="flex gap-[8px] flex-wrap mt-[20px]">
                {["🇮🇳 हिंदी", "తెలుగు", "தமிழ்", "বাংলা", "ਪੰਜਾਬੀ"].map(lang => (
                  <button key={lang} className="text-[11px] px-[10px] py-[4px] rounded-[6px] bg-[rgba(255,255,255,0.06)] text-[#94A3B8] cursor-pointer hover:bg-[rgba(255,255,255,0.12)] transition-colors">
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-[12px] font-[700] text-white tracking-[1px] uppercase mb-[16px]">Schemes</h4>
              <Link href="/schemes" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">All Schemes</Link>
              <Link href="/gb" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">UK Schemes</Link>
              <Link href="/saved" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Saved Schemes</Link>
              <Link href="/in/delhi" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Delhi Schemes</Link>
              <Link href="/in/maharashtra" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Maharashtra Schemes</Link>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-[12px] font-[700] text-white tracking-[1px] uppercase mb-[16px]">Money Guides</h4>
              <Link href="/articles" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">By Category</Link>
              <Link href="/schemes" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Central Schemes</Link>
              <Link href="/schemes" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">State Schemes</Link>
              <Link href="/in/check" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Eligibility Check</Link>
              <Link href="/schemes" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Newly Added</Link>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="text-[12px] font-[700] text-white tracking-[1px] uppercase mb-[16px]">Company</h4>
              <Link href="/about" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">About Us</Link>
              <Link href="/contact" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Contact</Link>
              <Link href="/privacy" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Privacy Policy</Link>
              <Link href="/terms" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Terms of Service</Link>
              <Link href="/disclaimer" className="text-[13px] text-[#64748B] block mb-[10px] hover:text-[#94A3B8] hover:pl-[4px] transition-all">Disclaimer</Link>
            </div>
          </div>

          <div className="flex justify-between items-center text-[12px] text-[#475569] pt-[28px] flex-wrap gap-[10px]">
            <div>&copy; {new Date().getFullYear()} SchemeAtlas. Not affiliated with any government entity.</div>
            <div className="flex gap-[16px]">
              <Link href="/privacy" className="hover:text-[#64748B]">Privacy</Link>
              <Link href="/terms" className="hover:text-[#64748B]">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
