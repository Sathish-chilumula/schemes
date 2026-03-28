import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { COUNTRIES, CATEGORIES } from '@/lib/config';
import type { Metadata } from 'next';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await db.from('schemes').select('name,what_you_get,benefit_amount').eq('slug', params.slug).single();
  if (!data) return { title: 'Scheme Not Found | SchemeAtlas' };
  return {
    title: `${data.name} | SchemeAtlas`,
    description: `${data.what_you_get}. Benefit: ${data.benefit_amount}. Check eligibility free.`,
  };
}

export default async function SchemePage({ params }: { params: { slug: string } }) {
  const { data: scheme } = await db
    .from('schemes')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!scheme) notFound();

  const country = COUNTRIES[scheme.country_code];
  const cat = CATEGORIES[scheme.category];

  const { data: related } = await db
    .from('schemes')
    .select('id,name,slug,benefit_amount,category')
    .eq('country_code', scheme.country_code)
    .eq('is_published', true)
    .neq('id', scheme.id)
    .limit(3);

  const steps: string[] = scheme.how_to_apply?.steps || [];
  const docs: string[] = scheme.documents || [];
  const elig = scheme.eligibility || {};
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.vercel.app';
  const schemeUrl = `${siteUrl}/schemes/${scheme.slug}`;
  const waText = `Check out: ${scheme.name} — ${scheme.benefit_amount} → ${schemeUrl}`;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href={`/${scheme.country_code}`} className="text-slate-400 hover:text-slate-700 text-xl">←</Link>
          <span className="text-xl">{country?.flag}</span>
          <span className="font-semibold text-slate-700 text-sm line-clamp-1 flex-1">{scheme.name}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Hero */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            {cat && <span className={`badge ${cat.bgColor} ${cat.color}`}>{cat.icon} {scheme.category}</span>}
            <span className="text-slate-400 text-sm">{country?.flag} {country?.name}</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">
            {scheme.name}
          </h1>
          <p className="text-slate-600 mb-5 leading-relaxed text-sm">{scheme.what_you_get}</p>

          {/* Benefit highlight */}
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-5">
            <p className="text-xs font-bold text-brand-500 mb-1 uppercase tracking-wide">💰 Financial Benefit</p>
            <p className="text-2xl font-bold text-brand-600">{scheme.benefit_amount}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/${scheme.country_code}/check`} className="btn-primary flex-1">
              Check If I Qualify →
            </Link>
            {scheme.official_url && (
              <a href={scheme.official_url} target="_blank" rel="noopener noreferrer"
                className="btn-secondary flex-1 flex items-center justify-center gap-1">
                Apply Now ↗
              </a>
            )}
          </div>

          {/* WhatsApp share */}
          <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-3 w-full flex items-center justify-center gap-2 bg-green-500
                       hover:bg-green-600 text-white font-semibold py-3 rounded-xl
                       transition-colors text-sm">
            📱 Share with Family on WhatsApp
          </a>
        </div>

        {/* Eligibility */}
        {Object.keys(elig).length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              ✅ Who Can Apply
            </h2>
            <div className="divide-y divide-slate-100">
              {elig.age_min && <ERow label="Minimum Age" value={`${elig.age_min} years`} />}
              {elig.age_max && <ERow label="Maximum Age" value={`${elig.age_max} years`} />}
              {elig.income_max && <ERow label="Max Income" value={String(elig.income_max)} />}
              {elig.profession?.length > 0 && <ERow label="Profession" value={elig.profession.join(', ')} />}
              {elig.residence && <ERow label="Residence" value={elig.residence} />}
              {elig.categories?.length > 0 && <ERow label="Categories" value={elig.categories.join(', ')} />}
              {elig.other && <ERow label="Other" value={elig.other} />}
              {elig.excluded?.length > 0 && <ERow label="Not Eligible" value={elig.excluded.join(', ')} danger />}
            </div>
          </div>
        )}

        {/* How to Apply */}
        {steps.length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">📋 How to Apply</h2>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center
                                  justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed pt-0.5">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Documents */}
        {docs.length > 0 && (
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 mb-4">📄 Documents Required</h2>
            <div className="space-y-2">
              {docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-slate-700 text-sm">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        {related && related.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-700 mb-3 text-sm">Related Schemes</h2>
            <div className="space-y-2">
              {related.map(s => {
                const rc = CATEGORIES[s.category];
                return (
                  <Link key={s.id} href={`/schemes/${s.slug}`}
                    className="card p-4 flex items-center justify-between group">
                    <div>
                      <p className="font-semibold text-slate-800 group-hover:text-brand-500
                                    transition-colors text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{rc?.icon} {s.benefit_amount}</p>
                    </div>
                    <span className="text-slate-300 group-hover:text-brand-500 transition-colors">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="bg-brand-500 rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-lg mb-2">Check Your Full Eligibility</h3>
          <p className="text-blue-100 text-sm mb-4">
            Find all {country?.name} schemes you qualify for in 2 minutes
          </p>
          <Link href={`/${scheme.country_code}/check`}
            className="bg-white text-brand-500 font-bold px-6 py-3 rounded-xl
                       hover:bg-blue-50 transition-colors inline-block">
            Check All My Benefits →
          </Link>
        </div>
      </div>
    </div>
  );
}

function ERow({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="flex justify-between py-2.5 gap-3">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className={`text-sm font-medium text-right ${danger ? 'text-red-500' : 'text-slate-800'}`}>
        {value}
      </span>
    </div>
  );
}
