'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Scheme } from '@/lib/supabase';
import { COUNTRIES } from '@/lib/config';
import { SchemeCard } from '@/components/SchemeCard';
import { Navbar } from '@/components/Navbar';

export function HomeClient({ 
  stats, 
  trendingSchemes, 
  latestSchemes 
}: { 
  stats: { schemes: number, checked: number },
  trendingSchemes: Scheme[],
  latestSchemes: Scheme[]
}) {
  const [activeTab, setActiveTab] = useState<'INDIA' | 'GLOBAL'>('INDIA');
  
  // Live Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Scheme[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Live Search Effect
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('schemes')
        .select('*')
        .eq('is_published', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
        
      if (data) setSearchResults(data);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const indianStates = COUNTRIES['IN']?.states || [];

  const socialCategories = [
    { name: 'SC / ST', label: 'Scheduled Castes & Tribes', color: 'from-blue-500 to-indigo-600' },
    { name: 'OBC / BC', label: 'Backward Classes', color: 'from-amber-400 to-orange-500' },
    { name: 'Minority', label: 'Minority Communities', color: 'from-emerald-400 to-teal-500' },
    { name: 'Women', label: 'Women & Girls', color: 'from-pink-400 to-rose-500' },
    { name: 'Students', label: 'Scholarships & Education', color: 'from-purple-400 to-fuchsia-500' },
    { name: 'Farmers', label: 'Agriculture Schemes', color: 'from-green-500 to-emerald-600' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* ── PREMIUM CLEAN HERO SECTION ── */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-slate-900">
        {/* Beautiful Professional Background */}
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1095814/pexels-photo-1095814.jpeg?auto=compress&cs=tinysrgb&w=1920&q=80')] bg-cover bg-center opacity-20"></div>
           <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-900"></div>
           <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-brand-500/10 blur-[120px] rounded-full mix-blend-screen animate-fade-in delay-200"></div>
           <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen animate-fade-in delay-500"></div>
        </div>
        
        {/* Navbar */}
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

      {/* ── LIVE SEARCH BAR (overlaps hero) ── */}
      <div className="page-container relative z-40 -mt-8 mb-16">
        <div className="bg-white rounded-2xl p-2 max-w-3xl mx-auto flex items-center shadow-xl relative border border-slate-100">
          <span className="pl-4 text-slate-400 text-xl">🔍</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-slate-800 px-4 py-3 placeholder-slate-400 font-medium text-lg leading-none" 
            placeholder="Search for PM Kisan, Scholarships, Housing..." 
          />
          <button className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-colors relative min-w-[100px]">
            {isSearching ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin absolute inset-0 m-auto"></span>
            ) : 'Search'}
          </button>

          {/* Search Suggestions Dropdown */}
          {searchQuery.length >= 2 && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in-up">
              <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                Suggested Schemes
              </div>
              <ul>
                {searchResults.map((result) => (
                  <li key={result.id}>
                    <Link 
                      href={`/schemes/${result.slug}`}
                      className="block px-4 py-3 hover:bg-brand-50 hover:text-brand-700 transition-colors border-b border-slate-50 last:border-0"
                    >
                      <div className="font-bold text-slate-800 mb-0.5">{result.name}</div>
                      <div className="text-xs text-slate-500 truncate">{result.what_you_get}</div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="p-3 text-center bg-slate-50 border-t border-slate-100">
                <Link href={`/schemes?q=${encodeURIComponent(searchQuery)}`} className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
                  View all results →
                </Link>
              </div>
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
             <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-6 text-center text-slate-500 font-medium">
               No schemes found matching "{searchQuery}"
             </div>
          )}
        </div>
      </div>

      {/* ── INDIA VS GLOBAL TOGGLE ── */}
      <div className="page-container mb-12 flex justify-center">
        <div className="inline-flex bg-slate-200/60 p-1.5 rounded-2xl backdrop-blur-sm">
          <button 
            onClick={() => setActiveTab('INDIA')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'INDIA' ? 'bg-white text-slate-900 shadow-sm transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🇮🇳 Indian Schemes
          </button>
          <button 
            onClick={() => setActiveTab('GLOBAL')}
            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeTab === 'GLOBAL' ? 'bg-white text-slate-900 shadow-sm transform scale-105' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🌍 Global Schemes
          </button>
        </div>
      </div>

      {/* ── INDIA CONTENT ── */}
      {activeTab === 'INDIA' && (
        <div className="animate-fade-in">

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
        </div>
      )}

      {/* ── GLOBAL CONTENT ── */}
      {activeTab === 'GLOBAL' && (
        <div className="page-container mb-24 animate-fade-in">
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
        </div>
      )}

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
