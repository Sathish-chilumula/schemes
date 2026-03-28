'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';

const ALL_CATS = ['all','cash','housing','health','education','agriculture','women','elderly','disability','business','food','employment','family'];

export default function CountryPage() {
  const params = useParams();
  const code = (params.country as string)?.toUpperCase();
  const country = COUNTRIES[code];

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [filtered, setFiltered] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!code) return;
    supabase
      .from('schemes')
      .select('*')
      .eq('country_code', code)
      .eq('is_published', true)
      .order('discovered_at', { ascending: false })
      .then(({ data }) => { setSchemes(data || []); setFiltered(data || []); setLoading(false); });
  }, [code]);

  useEffect(() => {
    let res = schemes;
    if (cat !== 'all') res = res.filter(s => s.category === cat);
    if (search.trim()) res = res.filter(s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.what_you_get || '').toLowerCase().includes(search.toLowerCase())
    );
    setFiltered(res);
  }, [cat, search, schemes]);

  if (!country) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl mb-4">Country not found</p>
        <Link href="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );

  const available = ALL_CATS.filter(c => c === 'all' || schemes.some(s => s.category === c));

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="page-container h-16 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-700 text-xl">←</Link>
          <span className="text-2xl">{country.flag}</span>
          <span className="font-bold text-lg text-slate-900">{country.name}</span>
          <span className="ml-auto text-sm text-slate-400 font-medium">{filtered.length} schemes</span>
        </div>
      </div>

      <div className="page-container py-6">
        {/* CTA Banner */}
        <div className="bg-brand-500 rounded-2xl p-5 text-white mb-6 flex flex-col sm:flex-row
                        items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-xl mb-1">Which schemes do YOU qualify for?</h2>
            <p className="text-blue-100 text-sm">Tell us about yourself — AI finds your personal matches</p>
          </div>
          <Link href={`/${code}/check`}
            className="bg-white text-brand-500 font-bold px-5 py-2.5 rounded-xl
                       whitespace-nowrap hover:bg-blue-50 transition-colors text-sm shrink-0">
            Check Eligibility →
          </Link>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            className="form-input pl-10"
            placeholder="Search schemes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {available.map(c => {
            const cfg = CATEGORIES[c];
            return (
              <button key={c} onClick={() => setCat(c)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold
                            transition-colors border shrink-0 ${
                  cat === c
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-500'
                }`}>
                {c !== 'all' && cfg?.icon} {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton" style={{ height: 16, width: '75%' }} />
                <div className="skeleton" style={{ height: 12, width: '50%' }} />
                <div className="skeleton" style={{ height: 48 }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl font-semibold">No schemes found</p>
            <p className="text-sm mt-2">Try a different category or search term</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {filtered.map(s => {
              const cfg = CATEGORIES[s.category];
              return (
                <Link key={s.id} href={`/schemes/${s.slug}`} className="card p-5 group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    {cfg && (
                      <span className={`badge ${cfg.bgColor} ${cfg.color}`}>
                        {cfg.icon} {s.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-brand-500
                                 transition-colors leading-snug flex-1 text-sm">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{s.what_you_get}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-brand-500 text-sm">{s.benefit_amount}</span>
                    <span className="text-xs text-brand-500 font-semibold">View →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200
                      flex justify-around items-center py-2 z-50 md:hidden">
        <Link href="/" className="nav-link"><span className="text-xl">🏠</span><span className="text-xs">Home</span></Link>
        <Link href={`/${code}/check`} className="nav-link"><span className="text-xl">🔍</span><span className="text-xs">Check</span></Link>
        <Link href="/schemes" className="nav-link"><span className="text-xl">📋</span><span className="text-xs">All</span></Link>
      </div>
    </div>
  );
}
