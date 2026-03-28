'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';

const ALL_COUNTRIES = ['all', ...Object.keys(COUNTRIES)];

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filtered, setFiltered] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCountry, setActiveCountry] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    supabase
      .from('schemes')
      .select('*')
      .eq('is_published', true)
      .order('discovered_at', { ascending: false })
      .then(({ data }) => {
        setSchemes(data || []);
        setFiltered(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = schemes;
    if (activeCountry !== 'all') result = result.filter(s => s.country_code === activeCountry);
    if (activeCategory !== 'all') result = result.filter(s => s.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.what_you_get?.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [search, activeCountry, activeCategory, schemes]);

  const allCategories = ['all', ...Array.from(new Set(schemes.map(s => s.category)))];

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="page-container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-xl text-slate-900">ClaimIt</span>
          </Link>
          <Link href="/IN/check" className="btn-primary text-sm py-2 px-4">
            Check My Benefits →
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-slate-900 text-white py-12">
        <div className="page-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">All Government Schemes</h1>
          <p className="text-slate-400">
            {loading ? 'Loading...' : `${schemes.length} schemes across ${Object.keys(COUNTRIES).length} countries`}
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

          {/* Country filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-2">
            {ALL_COUNTRIES.map(code => {
              const c = COUNTRIES[code];
              return (
                <button
                  key={code}
                  id={`country-${code}`}
                  onClick={() => setActiveCountry(code)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeCountry === code
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c ? `${c.flag} ${c.name}` : '🌐 All Countries'}
                </button>
              );
            })}
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allCategories.map(cat => {
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
                  {catConfig ? `${catConfig.icon} ${cat}` : '📋 All'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-container py-8">
        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton" style={{ height: 20, width: '70%' }} />
                <div className="skeleton" style={{ height: 14, width: '50%' }} />
                <div className="skeleton" style={{ height: 60 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No schemes found</h2>
            <p className="text-slate-500 mb-4">Try adjusting your filters</p>
            <button
              onClick={() => { setSearch(''); setActiveCountry('all'); setActiveCategory('all'); }}
              className="btn-secondary"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-5">
              Showing <strong>{filtered.length}</strong> of {schemes.length} schemes
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {filtered.map(scheme => {
                const country = COUNTRIES[scheme.country_code];
                const cat = CATEGORIES[scheme.category];
                return (
                  <Link key={scheme.id} href={`/schemes/${scheme.slug}`}
                    className="card p-5 group flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      {cat && (
                        <span className={`badge ${cat.bgColor} ${cat.color}`}>
                          {cat.icon} {scheme.category}
                        </span>
                      )}
                      <span className="text-lg ml-auto">{country?.flag}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-brand-500
                                   transition-colors leading-snug flex-1 text-sm">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{scheme.what_you_get}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                      <span className="font-bold text-brand-500 text-sm">{scheme.benefit_amount}</span>
                      <span className="text-xs text-slate-400">{country?.name}</span>
                    </div>
                  </Link>
                );
              })}
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
