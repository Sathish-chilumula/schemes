'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';
import { SchemeCard } from '@/components/SchemeCard';
import { Navbar } from '@/components/Navbar';

export function generateStaticParams() {
  return Object.keys(COUNTRIES).map((country) => ({
    country: country.toLowerCase(),
  }));
}

export default function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = use(params);
  const countryCode = country.toUpperCase();
  const countryConfig = COUNTRIES[countryCode];

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filtered, setFiltered] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeTargetGroup, setActiveTargetGroup] = useState('all');
  const [activeState, setActiveState] = useState('all');
  const [activeType, setActiveType] = useState('all');

  // Parse URL params for initial filters 
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('category')) {
        const cat = urlParams.get('category');
        if (cat) setActiveTargetGroup(cat);
      }
      if (urlParams.has('state')) {
        const state = urlParams.get('state');
        if (state) setActiveState(state);
      }
    }
  }, []);

  useEffect(() => {
    if (!countryConfig) return;
    
    // Fetch all published and active schemes for the country
    supabase
      .from('schemes')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_published', true)
      .eq('is_active', true)
      .order('discovered_at', { ascending: false })
      .then(({ data }) => {
        setSchemes(data || []);
        setFiltered(data || []);
        setLoading(false);
      });
  }, [countryCode, countryConfig]);

  useEffect(() => {
    let result = schemes;
    
    // Sector Category
    if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory);
    }
    
    // Social Target Group (e.g., SC/ST)
    if (activeTargetGroup !== 'all') {
      result = result.filter(s => {
        if (!s.target_group || s.target_group.length === 0) return true; // If scheme applies to all
        return s.target_group.includes(activeTargetGroup) || s.target_group.includes('General');
      });
    }

    // State Filter
    if (activeState !== 'all') {
      result = result.filter(s => {
        if (!s.state_codes || s.state_codes.length === 0) return true;
        return s.state_codes.includes(activeState) || s.state_codes.includes('ALL');
      });
    }
    
    // Scheme Type Filter (Central vs State)
    if (activeType !== 'all') {
      result = result.filter(s => s.scheme_type === activeType || s.scheme_type === 'both');
    }

    // Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.what_you_get && s.what_you_get.toLowerCase().includes(q)) ||
        s.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, activeCategory, activeTargetGroup, activeState, activeType, schemes]);

  if (!countryConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-4xl mb-3">🌍</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Country not found</h1>
          <p className="text-slate-500 mb-4">We don&apos;t have schemes for this country yet.</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const sectors = ['all', ...countryConfig.categories];
  const targetGroups = countryConfig.targetGroups || [];
  const statesList = countryConfig.states || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── HEADER ── */}
      <div className="relative bg-slate-900 border-b border-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-animated-gradient opacity-20"></div>
        <div className="absolute inset-0 bg-grid-pattern-light opacity-30"></div>
        <div className="page-container relative z-10 py-16 md:py-24 animate-fade-in">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center md:text-left">
              <div className="inline-block px-3 py-1 mb-4 rounded-full bg-brand-500/20 text-brand-300 text-sm font-bold border border-brand-500/30">
                Active Schemes Only
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                {countryConfig.name} Government Schemes
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Discover financial aid, scholarships, housing subsidies, and welfare 
                programs available to citizens right now.
              </p>
              
              {/* Main Search Bar */}
              <div className="relative max-w-xl mx-auto md:mx-0 shadow-2xl">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search schemes, benefits, or keywords..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/50 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
                />
              </div>
            </div>
            <div className="hidden md:block text-9xl animate-fade-in-up">{countryConfig.flag}</div>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        
        {/* ── ADVANCED FILTERS ── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-8 animate-fade-in-up delay-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-slate-400">⚙️</span>
            <h3 className="font-bold text-slate-800 text-lg">Filter Results</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* State Filter */}
            {statesList.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">State / Region</label>
                <select 
                  value={activeState} 
                  onChange={e => setActiveState(e.target.value)}
                  className="form-select bg-slate-50 border-slate-200 py-2.5 font-medium"
                >
                  <option value="all">All States (Central + State)</option>
                  {statesList.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Target Group Filter */}
            {targetGroups.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Social Category</label>
                <select 
                  value={activeTargetGroup} 
                  onChange={e => setActiveTargetGroup(e.target.value)}
                  className="form-select bg-slate-50 border-slate-200 py-2.5 font-medium"
                >
                  <option value="all">Everyone</option>
                  {targetGroups.map(tg => (
                    <option key={tg} value={tg}>{tg}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Scheme Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Govt Level</label>
              <select 
                value={activeType} 
                onChange={e => setActiveType(e.target.value)}
                className="form-select bg-slate-50 border-slate-200 py-2.5 font-medium"
              >
                <option value="all">Any Level</option>
                <option value="central">Central Govt Only</option>
                <option value="state">State Govt Only</option>
              </select>
            </div>
            
            {/* Sector Category */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sector</label>
              <select 
                value={activeCategory} 
                onChange={e => setActiveCategory(e.target.value)}
                className="form-select bg-slate-50 border-slate-200 py-2.5 font-medium"
              >
                <option value="all">All Sectors</option>
                {sectors.filter(c => c !== 'all').map(cat => {
                  const cfg = CATEGORIES[cat];
                  return <option key={cat} value={cat}>{cfg ? `${cfg.icon} ${cfg.label || cat}` : cat}</option>;
                })}
              </select>
            </div>

          </div>
          
          {/* Active Filter Tags */}
          {(activeCategory !== 'all' || activeState !== 'all' || activeTargetGroup !== 'all' || activeType !== 'all') && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 mr-2">Active filters:</span>
              
              {activeState !== 'all' && (
                <span className="badge bg-blue-50 text-blue-700 border border-blue-200">
                  📍 {statesList.find(s => s.code === activeState)?.name || activeState}
                </span>
              )}
              {activeTargetGroup !== 'all' && (
                <span className="badge bg-purple-50 text-purple-700 border border-purple-200">
                  👥 {activeTargetGroup}
                </span>
              )}
              {activeCategory !== 'all' && (
                <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">
                  📋 {CATEGORIES[activeCategory]?.label || activeCategory}
                </span>
              )}
               {activeType !== 'all' && (
                <span className="badge bg-amber-50 text-amber-700 border border-amber-200">
                  🏛️ {activeType}
                </span>
              )}
              
              <button 
                onClick={() => {
                  setActiveState('all');
                  setActiveTargetGroup('all');
                  setActiveCategory('all');
                  setActiveType('all');
                  setSearch('');
                }}
                className="text-xs font-bold text-red-500 hover:text-red-700 underline ml-2 cursor-pointer"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── SCHEMES GRID ── */}
        <div className="animate-fade-in-up delay-200">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="skeleton" style={{ height: 24, width: '40%' }} />
                    <div className="skeleton" style={{ height: 24, width: '20%' }} />
                  </div>
                  <div className="skeleton" style={{ height: 20, width: '80%' }} />
                  <div className="skeleton" style={{ height: 16, width: '100%' }} />
                  <div className="skeleton" style={{ height: 16, width: '90%' }} />
                  <div className="pt-4 mt-auto border-t border-slate-100 flex justify-between">
                    <div className="skeleton" style={{ height: 24, width: '30%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="inline-flex w-24 h-24 bg-slate-50 rounded-full items-center justify-center mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">No matching schemes</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                Try adjusting your filters or search criteria. We are constantly adding new schemes.
              </p>
              <button
                onClick={() => { setSearch(''); setActiveCategory('all'); setActiveState('all'); setActiveTargetGroup('all'); setActiveType('all'); }}
                className="btn-secondary"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  Matching Schemes <span className="text-brand-500 bg-brand-50 px-3 py-1 rounded-full text-base ml-2">{filtered.length}</span>
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(scheme => (
                  <SchemeCard key={scheme.id} scheme={scheme} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <div className="bg-slate-900 border-t border-brand-500/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-pattern-light opacity-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-brand-500/20 blur-[100px] rounded-full"></div>
        
        <div className="page-container relative z-10 py-16 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">Are you missing out on benefits?</h2>
          <p className="text-blue-100/80 mb-8 max-w-xl mx-auto text-lg">
            Tell us your basic details and our AI will instantly check your eligibility 
            across all {countryConfig.name} schemes.
          </p>
          <Link href={`/${countryCode}/check`}
            className="btn-primary text-lg px-8 py-4 shadow-xl shadow-brand-500/20 inline-block !rounded-2xl">
            Check My Eligibility Now <span className="ml-2">⚡</span>
          </Link>
        </div>
      </div>

      {/* ── MOBILE NAVBAR ── */}
      <div className="fixed bottom-0 left-0 right-0 glass-card !rounded-none border-t border-slate-200/50 flex justify-around items-center py-2 z-50 md:hidden pb-safe">
        {[
          { href: '/', icon: '🏠', label: 'Home' },
          { href: `/${countryCode}/check`, icon: '⚡', label: 'Check' },
          { href: '/schemes', icon: '📋', label: 'Schemes' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="nav-link">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
