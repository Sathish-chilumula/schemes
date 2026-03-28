import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { COUNTRIES, CATEGORIES } from '@/lib/config';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Government Schemes | SchemeAtlas',
  description: 'Browse 1000+ government schemes from India, UK, USA, Nigeria, Kenya. Find what you qualify for.',
};

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function SchemesPage() {
  const { data: schemes } = await db
    .from('schemes')
    .select('*')
    .eq('is_published', true)
    .order('discovered_at', { ascending: false });

  const countries = Object.values(COUNTRIES);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="page-container py-8">
          <Link href="/" className="text-brand-500 text-sm font-semibold mb-4 block">← Home</Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">All Schemes</h1>
          <p className="text-slate-500">{schemes?.length || 0} schemes across {countries.length} countries</p>
        </div>
      </div>

      <div className="page-container py-8">
        {/* Country Filter */}
        <div className="flex gap-3 overflow-x-auto pb-3 mb-8" style={{ scrollbarWidth: 'none' }}>
          {countries.map(c => (
            <Link key={c.code} href={`/${c.code}`}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border
                         border-slate-200 font-semibold text-sm whitespace-nowrap
                         hover:border-brand-500 transition-colors">
              {c.flag} {c.name}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {(!schemes || schemes.length === 0) ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-5xl mb-4">📋</p>
            <p className="text-xl font-semibold mb-2">No schemes yet</p>
            <p className="text-sm">Run the agent to populate scheme data from APIs.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {schemes.map(s => {
              const country = COUNTRIES[s.country_code];
              const cat = CATEGORIES[s.category];
              return (
                <Link key={s.id} href={`/schemes/${s.slug}`} className="card p-5 group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    {cat && (
                      <span className={`badge ${cat.bgColor} ${cat.color} text-xs`}>
                        {cat.icon} {s.category}
                      </span>
                    )}
                    <span className="text-lg">{country?.flag}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-brand-500
                                 transition-colors leading-snug flex-1 text-sm">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{s.what_you_get}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-brand-500 text-sm">{s.benefit_amount}</span>
                    <span className="text-xs text-slate-400">{country?.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
