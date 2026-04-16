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

          <div className="flex flex-col gap-4">
            {/* Country filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Country</span>
              {ALL_COUNTRIES.map(code => {
                const c = COUNTRIES[code];
                return (
                  <button
                    key={code}
                    id={`country-${code}`}
                    onClick={() => { setActiveCountry(code); setActiveState('all'); }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      activeCountry === code
                        ? 'bg-brand-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {c ? `${c.flag} ${c.name}` : '🌐 All Countries'}
                  </button>
                );
              })}
            </div>

            {/* State Filter (Visible for India or All) */}
            {statesList.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center animate-fade-in border-y border-slate-50 py-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">State</span>
                <button
                  onClick={() => setActiveState('all')}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeState === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  📍 All States
                </button>
                {statesList.map(s => (
                  <button
                    key={s.code}
                    onClick={() => setActiveState(s.code)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeState === s.code
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.icon} {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">Sector</span>
              {validCategories.map(cat => {
                const catConfig = CATEGORIES[cat];
                return (
                  <button
                    key={cat}
                    id={`cat-${cat}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeCategory === cat
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {catConfig ? `${catConfig.icon} ${catConfig.label || cat}` : '📋 All Sectors'}
                  </button>
                );
              })}
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
