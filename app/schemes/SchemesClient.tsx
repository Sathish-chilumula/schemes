'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';
import { SchemeCard } from '@/components/SchemeCard';

const ALL_COUNTRIES = ['all', ...Object.keys(COUNTRIES)];

export function SchemesClient({ initialSchemes }: { initialSchemes: Scheme[] }) {
  const [filtered, setFiltered] = useState<Scheme[]>(initialSchemes);
  const [search, setSearch] = useState('');
  const [activeCountry, setActiveCountry] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeState, setActiveState] = useState('all');

  useEffect(() => {
    let result = initialSchemes;
    if (activeCountry !== 'all') result = result.filter(s => s.country_code === activeCountry);
    if (activeCategory !== 'all') result = result.filter(s => s.category === activeCategory);
    if (activeState !== 'all') {
      result = result.filter(s => 
        (s.state_code === activeState) || 
        (s.state_codes && s.state_codes.includes(activeState))
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.what_you_get?.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, activeCountry, activeCategory, activeState, initialSchemes]);

  const allCategories = ['all', ...Array.from(new Set(initialSchemes.map(s => s.category)))].filter(c => c && c !== 'null' && c !== 'undefined');
  
  // Clean valid categories: Only show categories that we have in our config.ts 
  // or that are common enough, to avoid the "all all all" issue.
  const validCategories = allCategories.filter(cat => cat === 'all' || CATEGORIES[cat]);

  const statesList = (activeCountry === 'all' || activeCountry === 'IN') ? COUNTRIES['IN']?.states || [] : COUNTRIES[activeCountry]?.states || [];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="page-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">All Government Schemes</h1>
          <p className="text-slate-400">
             {initialSchemes.length} schemes across {Object.keys(COUNTRIES).length} countries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="page-container py-4">
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              id="scheme-search"
              type="text"
              placeholder="Search all schemes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-11"
            />
          </div>

          <div className="flex flex-col gap-[32px]">
            {/* Country filter */}
            <div>
              <div className="text-[12px] font-[800] text-slate-500 uppercase tracking-[2px] mb-[16px] flex items-center gap-2">
                <span className="w-8 h-[1px] bg-slate-200"></span>
                Select Country
                <span className="w-8 h-[1px] bg-slate-200"></span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-[12px]">
                {ALL_COUNTRIES.map(code => {
                  const c = COUNTRIES[code];
                  const isActive = activeCountry === code;
                  return (
                    <button
                      key={code}
                      onClick={() => { setActiveCountry(code); setActiveState('all'); }}
                      className={`flex flex-col items-center justify-center p-[16px] rounded-[var(--radius-md)] border transition-all duration-200 ${
                        isActive
                          ? 'bg-[var(--indigo-light)] border-[var(--indigo)] shadow-sm ring-1 ring-[var(--indigo)]'
                          : 'bg-white border-[var(--border)] hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[24px] mb-[8px]">{c ? c.flag : '🌐'}</span>
                      <span className={`text-[13px] font-[700] ${isActive ? 'text-[var(--indigo)]' : 'text-slate-600'}`}>
                        {c ? c.name : 'All Countries'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* State Filter (Visible for India or All) */}
            {statesList.length > 0 && (
              <div className="animate-fade-in border-t border-slate-100 pt-[32px]">
                <div className="text-[12px] font-[800] text-slate-500 uppercase tracking-[2px] mb-[16px] flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-slate-200"></span>
                  Filter by State
                  <span className="w-8 h-[1px] bg-slate-200"></span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-[10px]">
                  <button
                    onClick={() => setActiveState('all')}
                    className={`flex items-center gap-2 px-[14px] py-[10px] rounded-[var(--radius-sm)] border text-[13px] font-[600] transition-all ${
                      activeState === 'all'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-[var(--border)] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📍 All States
                  </button>
                  {statesList.map(s => (
                    <button
                      key={s.code}
                      onClick={() => setActiveState(s.code)}
                      className={`flex items-center gap-2 px-[14px] py-[10px] rounded-[var(--radius-sm)] border text-[13px] font-[600] transition-all ${
                        activeState === s.code
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-[var(--border)] text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category filter */}
            <div className="border-t border-slate-100 pt-[32px]">
               <div className="text-[12px] font-[800] text-slate-500 uppercase tracking-[2px] mb-[16px] flex items-center gap-2">
                <span className="w-8 h-[1px] bg-slate-200"></span>
                Benefit Sector
                <span className="w-8 h-[1px] bg-slate-200"></span>
              </div>
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[12px]">
                {validCategories.map(cat => {
                  const catConfig = CATEGORIES[cat];
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-[12px] p-[16px] rounded-[var(--radius-md)] border text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                          : 'bg-white border-[var(--border)] text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[20px] ${isActive ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        {catConfig ? catConfig.icon : '📋'}
                      </div>
                      <span className="text-[14px] font-[700] flex-1">
                        {catConfig ? (catConfig.label || cat) : 'All Sectors'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-container py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No schemes found</h2>
            <p className="text-slate-500 mb-4">Try adjusting your filters</p>
            <button
              onClick={() => { setSearch(''); setActiveCountry('all'); setActiveCategory('all'); setActiveState('all'); }}
              className="btn-secondary"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-slate-500">
                Showing <strong>{filtered.length}</strong> of {initialSchemes.length} schemes
              </p>
              {activeState !== 'all' && (
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 animate-fade-in">
                  Filtered by {statesList.find(s => s.code === activeState)?.name}
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {filtered.map(scheme => (
                <SchemeCard key={scheme.id} scheme={scheme} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200
                      flex justify-around items-center py-2 z-50 md:hidden">
        {[
          { href: '/', icon: '🏠', label: 'Home' },
          { href: '/IN/check', icon: '🔍', label: 'Check' },
          { href: '/schemes', icon: '📋', label: 'Schemes' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="nav-link">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
