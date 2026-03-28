'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { supabase, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';

export default function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = use(params);
  const countryCode = country.toUpperCase();
  const countryConfig = COUNTRIES[countryCode];

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filtered, setFiltered] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    if (!countryConfig) return;
    supabase
      .from('schemes')
      .select('*')
      .eq('country_code', countryCode)
      .eq('is_published', true)
      .order('discovered_at', { ascending: false })
      .then(({ data }) => {
        setSchemes(data || []);
        setFiltered(data || []);
        setLoading(false);
      });
  }, [countryCode, countryConfig]);

  useEffect(() => {
    let result = schemes;
    if (activeCategory !== 'all') {
      result = result.filter(s => s.category === activeCategory);
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
  }, [search, activeCategory, schemes]);

  if (!countryConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🌍</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Country not found</h1>
          <p className="text-slate-500 mb-4">We don&apos;t have schemes for this country yet.</p>
          <Link href="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const categories = ['all', ...countryConfig.categories];

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
          <Link href={`/${countryCode}/check`} className="btn-primary text-sm py-2 px-4">
            Check My Eligibility →
          </Link>
        </div>
      </nav>

      {/* Header */}
      <div className="bg-gradient-to-r from-brand-500 to-blue-700 text-white py-12">
        <div className="page-container">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{countryConfig.flag}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{countryConfig.name} Schemes</h1>
              <p className="text-blue-100 mt-1">All government benefits and welfare programmes</p>
            </div>
          </div>
          <Link href={`/${countryCode}/check`}
            className="inline-flex items-center gap-2 bg-white text-brand-500 font-bold
                       px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors mt-2">
            ✨ Check What I Qualify For →
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40">
        <div className="page-container py-4">
          {/* Search */}
          <div className="relative mb-4">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder={`Search ${countryConfig.name} schemes...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-11"
              id="scheme-search"
            />
          </div>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(cat => {
              const catConfig = CATEGORIES[cat];
              return (
                <button
                  key={cat}
                  id={`filter-${cat}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeCategory === cat
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {catConfig ? `${catConfig.icon} ${cat}` : '🌐 All'}
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
            {[...Array(9)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton" style={{ height: 20, width: '75%' }} />
                <div className="skeleton" style={{ height: 14, width: '50%' }} />
                <div className="skeleton" style={{ height: 60 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">{schemes.length === 0 ? '📋' : '🔍'}</p>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {schemes.length === 0 ? 'No schemes yet' : 'No matching schemes'}
            </h2>
            <p className="text-slate-500">
              {schemes.length === 0
                ? 'Our agents are discovering schemes. Check back soon.'
                : 'Try a different search or category.'}
            </p>
            {search || activeCategory !== 'all' ? (
              <button
                onClick={() => { setSearch(''); setActiveCategory('all'); }}
                className="mt-4 btn-secondary"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-5">
              Showing <strong>{filtered.length}</strong> scheme{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'all' && ` in ${activeCategory}`}
              {search && ` matching "${search}"`}
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {filtered.map(scheme => {
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
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-brand-500
                                   transition-colors leading-snug flex-1">
                      {scheme.name}
                    </h3>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{scheme.what_you_get}</p>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                      <span className="font-bold text-brand-500">{scheme.benefit_amount}</span>
                      <span className="text-xs text-slate-400 group-hover:text-brand-500 transition-colors">
                        View details →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="bg-brand-500 text-white py-12 mt-8">
        <div className="page-container text-center">
          <h2 className="text-2xl font-bold mb-2">Find Out Which You Qualify For</h2>
          <p className="text-blue-100 mb-6">Answer 6 quick questions — get your personal matches</p>
          <Link href={`/${countryCode}/check`}
            className="bg-white text-brand-500 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors">
            Check My Eligibility Free →
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200
                      flex justify-around items-center py-2 z-50 md:hidden">
        {[
          { href: '/', icon: '🏠', label: 'Home' },
          { href: `/${countryCode}/check`, icon: '🔍', label: 'Check' },
          { href: '/schemes', icon: '📋', label: 'All' },
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
