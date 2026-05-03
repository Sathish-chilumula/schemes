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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const validCategories = allCategories.filter(cat => cat === 'all' || CATEGORIES[cat]);
  const statesList = (activeCountry === 'all' || activeCountry === 'IN') ? COUNTRIES['IN']?.states || [] : COUNTRIES[activeCountry]?.states || [];

  const activeFiltersCount = [
    activeCountry !== 'all',
    activeCategory !== 'all',
    activeState !== 'all',
    search.trim() !== '',
  ].filter(Boolean).length;

  const clearAll = () => {
    setSearch('');
    setActiveCountry('all');
    setActiveCategory('all');
    setActiveState('all');
  };

  const Sidebar = () => (
    <aside className="w-full">
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            id="scheme-search"
            type="text"
            placeholder="Search schemes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Active filters badge */}
      {activeFiltersCount > 0 && (
        <div className="mb-4 flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
          <span className="text-xs font-bold text-indigo-700">{activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active</span>
          <button onClick={clearAll} className="text-xs text-indigo-600 font-semibold hover:underline">Clear all</button>
        </div>
      )}

      {/* ── Country ── */}
      <div className="mb-6">
        <div className="text-[11px] font-[800] text-slate-400 uppercase tracking-[1.5px] mb-3 flex items-center gap-2">
          <span>🌍</span> Country
        </div>
        <div className="flex flex-col gap-1">
          {ALL_COUNTRIES.map(code => {
            const c = COUNTRIES[code];
            const isActive = activeCountry === code;
            return (
              <button
                key={code}
                onClick={() => { setActiveCountry(code); setActiveState('all'); }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-all w-full ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{c ? c.flag : '🌐'}</span>
                <span>{c ? c.name : 'All Countries'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── State ── */}
      {statesList.length > 0 && (
        <div className="mb-6 border-t border-slate-100 pt-5">
          <div className="text-[11px] font-[800] text-slate-400 uppercase tracking-[1.5px] mb-3 flex items-center gap-2">
            <span>📍</span> State
          </div>
          <div className="flex flex-col gap-1 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
            <button
              onClick={() => setActiveState('all')}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-all w-full ${
                activeState === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📍 All States
            </button>
            {statesList.map(s => (
              <button
                key={s.code}
                onClick={() => setActiveState(s.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-all w-full ${
                  activeState === s.code ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{s.icon}</span>
                <span className="truncate">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Sector / Category ── */}
      <div className="border-t border-slate-100 pt-5">
        <div className="text-[11px] font-[800] text-slate-400 uppercase tracking-[1.5px] mb-3 flex items-center gap-2">
          <span>🗂️</span> Benefit Sector
        </div>
        <div className="flex flex-col gap-1">
          {validCategories.map(cat => {
            const catConfig = CATEGORIES[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-all w-full ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span className="text-base">{catConfig ? catConfig.icon : '📋'}</span>
                <span>{catConfig ? (catConfig.label || cat) : 'All Sectors'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── Header ── */}
      <div className="bg-slate-900 text-white py-10">
        <div className="page-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">All Government Schemes</h1>
          <p className="text-slate-400">
            {initialSchemes.length} schemes across {Object.keys(COUNTRIES).length} countries
          </p>
        </div>
      </div>

      {/* ── Main Layout: Sidebar + Content ── */}
      <div className="page-container py-8">
        <div className="flex gap-8 items-start">

          {/* ── LEFT SIDEBAR (desktop) ── */}
          <div className="hidden lg:block w-64 flex-shrink-0 sticky top-24 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="font-bold text-slate-800 text-sm mb-5 flex items-center justify-between">
              <span>🎯 Filters</span>
              {activeFiltersCount > 0 && (
                <button onClick={clearAll} className="text-xs text-indigo-600 font-semibold hover:underline">Clear</button>
              )}
            </div>
            <Sidebar />
          </div>

          {/* ── RIGHT CONTENT PANE ── */}
          <div className="flex-1 min-w-0">

            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4 flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm"
              >
                🎯 Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <span className="text-sm text-slate-500">
                {filtered.length} of {initialSchemes.length} schemes
              </span>
            </div>

            {/* Mobile sidebar drawer */}
            {mobileSidebarOpen && (
              <div className="lg:hidden mb-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <Sidebar />
              </div>
            )}

            {/* Results header */}
            <div className="hidden lg:flex items-center justify-between mb-5 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
              <p className="text-sm text-slate-600">
                Showing <strong className="text-slate-900">{filtered.length}</strong> of {initialSchemes.length} schemes
              </p>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {activeCountry !== 'all' && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-full font-semibold">
                    {COUNTRIES[activeCountry]?.flag} {COUNTRIES[activeCountry]?.name}
                  </span>
                )}
                {activeCategory !== 'all' && (
                  <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-full font-semibold">
                    {CATEGORIES[activeCategory]?.icon} {CATEGORIES[activeCategory]?.label || activeCategory}
                  </span>
                )}
                {activeState !== 'all' && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-full font-semibold">
                    📍 {statesList.find(s => s.code === activeState)?.name}
                  </span>
                )}
              </div>
            </div>

            {/* Scheme cards */}
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <p className="text-5xl mb-4">🔍</p>
                <h2 className="text-xl font-bold text-slate-900 mb-2">No schemes found</h2>
                <p className="text-slate-500 mb-5">Try adjusting your filters or search query</p>
                <button onClick={clearAll} className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(scheme => (
                  <SchemeCard key={scheme.id} scheme={scheme} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-2 z-50 md:hidden">
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
