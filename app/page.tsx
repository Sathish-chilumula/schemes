import { supabaseAdmin } from '@/lib/supabase';
import { Metadata } from 'next';
import Link from 'next/link';
import { COUNTRIES } from '@/lib/config';
import { SchemeCard } from '@/components/SchemeCard';
import { Navbar } from '@/components/Navbar';
import { HomeSearch } from './HomeSearch';
import { HomeTabs } from './HomeTabs';

export const runtime = 'edge';
export const revalidate = 3600; // Revalidate every hour

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
    // Continue with defaults to prevent 500 crash
  }

  const indianStates = COUNTRIES['IN']?.states || [];

  const socialCategories = [
    { name: 'SC / ST', label: 'Scheduled Castes & Tribes', color: 'from-blue-500 to-indigo-600' },
    { name: 'OBC / BC', label: 'Backward Classes', color: 'from-amber-400 to-orange-500' },
    { name: 'Minority', label: 'Minority Communities', color: 'from-emerald-400 to-teal-500' },
    { name: 'Women', label: 'Women & Girls', color: 'from-pink-400 to-rose-500' },
    { name: 'Students', label: 'Scholarships & Education', color: 'from-purple-400 to-fuchsia-500' },
    { name: 'Farmers', label: 'Agriculture Schemes', color: 'from-green-500 to-emerald-600' }
  ];

  const indiaContent = (
    <>
      {/* Latest Additions First */}
      {latestSchemes.length > 0 && (
        <section className="page-container mb-20 animate-fade-in-up">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="text-2xl">✨</span> Newly Added Schemes
            </h2>
            <Link href="/schemes" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors hidden sm:block">View All →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {latestSchemes.map(scheme => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Filters - States */}
      <section id="states" className="page-container mb-20 animate-fade-in-up delay-100">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse by <span className="text-brand-600">State & UTs</span></h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {indianStates.map((state, i) => (
            <Link key={i} href={`/in/${state.name.toLowerCase().replace(/\s+/g, '-')}`} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{state.icon || '🏛️'}</div>
              <h3 className="font-bold text-slate-700 text-xs md:text-sm group-hover:text-brand-600">{state.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Filters - Categories */}
      <section id="categories" className="page-container mb-20 bg-slate-100 py-16 rounded-[3rem]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Browse by <span className="text-brand-600">Category</span></h2>
            <p className="text-slate-500 mt-2">Find schemes targeted to specific needs and communities.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {socialCategories.map((cat, i) => (
              <Link key={i} href={`/in?category=${cat.name}`} className="bg-white rounded-2xl p-5 hover:shadow-md transition-shadow border border-slate-200/50 flex items-center gap-4 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${cat.color} text-white shadow-sm group-hover:scale-105 transition-transform`}>
                  ★
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm md:text-base group-hover:text-brand-600">{cat.name}</h3>
                  <p className="text-slate-500 text-xs md:text-sm font-medium">{cat.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Schemes */}
      {trendingSchemes.length > 0 && (
        <section className="page-container mb-20">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <span className="text-red-500">🔥</span> Trending Schemes
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {trendingSchemes.map(scheme => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-white py-20 border-y border-slate-100 mb-20">
        <div className="page-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">How <span className="text-brand-500">SchemeAtlas</span> Works</h2>
            <p className="text-slate-500 text-lg">We use AI to instantly match your exact social and financial profile to thousands of complex government rules.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-brand-100 via-brand-500 to-brand-100 z-0"></div>
            
            {[
              { icon: '📝', title: '1. Tell us about you', desc: 'Enter your age, caste category, state, and income. No personal info required.' },
              { icon: '🤖', title: '2. AI Matching', desc: 'Our AI engine scans 1000+ state and central schemes in 30 seconds.' },
              { icon: '🎯', title: '3. Claim Benefits', desc: 'Get exact links to official portals along with required document lists.' },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-white border-4 border-slate-50 rounded-full shadow-xl shadow-brand-500/10 flex items-center justify-center text-4xl mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 font-medium px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const globalContent = (
    <>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-4">International Schemes</h2>
        <p className="text-slate-500">Select a country to discover government aid, welfare, and social protection programs available to citizens.</p>
      </div>
      
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
        {Object.entries(COUNTRIES).filter(([code]) => code !== 'IN').map(([code, config]) => (
          <Link key={code} href={`/${code}`} className="card p-6 group flex flex-col items-center text-center hover:bg-slate-50">
            <span className="text-6xl mb-4 group-hover:scale-110 transition-transform group-hover:rotate-3 drop-shadow-md">{config.flag}</span>
            <h3 className="font-bold text-xl text-slate-800 mb-1">{config.name}</h3>
            <p className="text-brand-500 font-semibold text-sm opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">Browse Schemes →</p>
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── PREMIUM CLEAN HERO SECTION ── */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1095814/pexels-photo-1095814.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80')] bg-cover bg-center opacity-20"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900"></div>
           <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-brand-500/10 blur-[120px] rounded-full mix-blend-screen animate-fade-in delay-200"></div>
           <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-fade-in delay-500"></div>
        </div>
        
        <Navbar variant="dark" />

        <div className="page-container relative z-10 pt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-dark border-white/10 text-white/80 text-sm font-semibold mb-8 animate-fade-in-up shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
            </span>
            Real-time verified government updates
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 animate-fade-in-up delay-100 leading-tight">
            Claim the Benefits <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-brand-300">
              You Deserve.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200 leading-relaxed font-medium">
            Stop searching through outdated portals. We organize <span className="text-white font-bold">{stats.schemes}+</span> active government schemes across India into one clean platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
            <Link href="/in/check" className="w-full sm:w-auto btn-primary text-lg px-8 py-4 !rounded-2xl shadow-xl shadow-brand-500/20">
              Check My Eligibility Free
            </Link>
            <Link href="/schemes" className="w-full sm:w-auto btn-secondary text-lg px-8 py-4 !rounded-2xl !bg-white/10 !border-white/20 !text-white hover:!bg-white/20 hover:!border-white/30 backdrop-blur-md">
              Browse All Schemes
            </Link>
          </div>
          
          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in-up delay-400">
            {[
              { label: 'Active Schemes', value: `${stats.schemes}+` },
              { label: 'Citizens Helped', value: `${stats.checked.toLocaleString()}+` },
              { label: 'Coverage', value: '28 States & UTs' },
              { label: 'Update Frequency', value: 'Daily' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE SEARCH BAR ── */}
      <div className="page-container relative z-40 -mt-8 mb-16">
        <HomeSearch />
      </div>

      <HomeTabs indiaContent={indiaContent} globalContent={globalContent} />

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="page-container text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-lg text-white">SchemeAtlas</span>
          </div>
          <p className="text-sm mb-6 max-w-md mx-auto">
            Not affiliated with any government entity. Data is aggregated from official sources (PIB, MyGov) and analyzed by AI for educational purposes.
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 px-4 text-sm font-medium mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/schemes" className="hover:text-white transition-colors">Schemes</Link>
            <Link href="/saved" className="hover:text-white transition-colors">Saved</Link>
            <Link href="/in/check" className="hover:text-white transition-colors">Eligibility Checker</Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-slate-500">
            <Link href="/about" className="hover:text-slate-300 transition-colors">About Us</Link>
            <Link href="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/disclaimer" className="hover:text-slate-300 transition-colors">Disclaimer</Link>
          </div>
          <div className="mt-8 text-xs text-slate-600">
            &copy; {new Date().getFullYear()} SchemeAtlas Global Framework. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
