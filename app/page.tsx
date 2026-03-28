'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, type Scheme } from '@/lib/supabase';
import { COUNTRIES, CATEGORIES } from '@/lib/config';

export default function HomePage() {
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('schemes')
      .select('*')
      .eq('is_published', true)
      .order('discovered_at', { ascending: false })
      .limit(6)
      .then(({ data }) => { setSchemes(data || []); setLoading(false); });
  }, []);

  const countryList = Object.values(COUNTRIES);

  return (
    <div className="min-h-screen">

      {/* ── NAVBAR ── */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="page-container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-xl text-slate-900">ClaimIt</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/schemes" className="hidden md:block text-sm text-slate-500 hover:text-slate-900 font-medium">
              Browse Schemes
            </Link>
            <Link href="/IN/check" className="btn-primary text-sm py-2 px-4">
              Check My Benefits →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-brand-500 via-blue-700 to-blue-900 text-white">
        <div className="page-container py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20
                            rounded-full px-4 py-2 text-sm mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block" />
              Free · No login · 5 countries · Updated every 6 hours
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Find every government benefit
              <span className="text-yellow-300"> you qualify for</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Millions of people miss out on benefits worth thousands every year — simply because
              they don&apos;t know they exist. Check yours free in 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/IN/check"
                className="bg-white text-brand-500 hover:bg-blue-50 font-bold px-8 py-4
                           rounded-xl text-lg transition-colors text-center shadow-lg">
                Check My Benefits →
              </Link>
              <Link href="#countries"
                className="border-2 border-white/40 hover:border-white text-white font-semibold
                           px-8 py-4 rounded-xl text-lg transition-colors text-center">
                Browse Countries ↓
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="border-t border-white/10 bg-black/10">
          <div className="page-container py-5 grid grid-cols-3 gap-4 text-center">
            {[
              { v: '5+', l: 'Countries' },
              { v: '1,000+', l: 'Schemes' },
              { v: '100%', l: 'Free' },
            ].map(s => (
              <div key={s.l}>
                <div className="text-2xl md:text-3xl font-bold text-yellow-300">{s.v}</div>
                <div className="text-blue-200 text-sm">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COUNTRY SELECTOR ── */}
      <section id="countries" className="section page-container">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Select Your Country</h2>
          <p className="text-slate-500 text-lg">We show schemes in your country, in your language.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {countryList.map(c => (
            <Link key={c.code} href={`/${c.code}/check`}
              className="card p-6 flex flex-col items-center gap-3 hover:border-brand-500
                         hover:border-2 group cursor-pointer">
              <span className="text-5xl">{c.flag}</span>
              <span className="font-semibold text-slate-800 group-hover:text-brand-500
                               transition-colors text-center text-sm">
                {c.name}
              </span>
              <span className="text-xs text-slate-400">
                {c.languages.length} language{c.languages.length > 1 ? 's' : ''}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-white section">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-500 text-lg">Find your benefits in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: '01', icon: '👤', title: 'Tell Us About Yourself', desc: 'Share your age, profession, income, and location. Takes less than 2 minutes. No account needed.' },
              { n: '02', icon: '🤖', title: 'AI Finds Your Schemes', desc: 'Our AI checks 1,000+ government schemes and finds exactly which ones you qualify for.' },
              { n: '03', icon: '✅', title: 'Claim Your Benefits', desc: 'Get step-by-step guidance on how to apply with exact documents needed and official links.' },
            ].map(s => (
              <div key={s.n} className="text-center">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center
                                text-3xl mx-auto mb-4">{s.icon}</div>
                <div className="text-xs font-bold text-brand-500 mb-2 tracking-widest">STEP {s.n}</div>
                <h3 className="font-semibold text-xl text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RECENT SCHEMES ── */}
      <section className="section page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-1">Latest Schemes</h2>
            <p className="text-slate-500 text-sm">Auto-updated every 6 hours from official sources</p>
          </div>
          <Link href="/schemes" className="text-brand-500 font-semibold hover:underline text-sm">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-4 w-3/4" style={{ height: 16 }} />
                <div className="skeleton h-3 w-1/2" style={{ height: 12 }} />
                <div className="skeleton w-full" style={{ height: 48 }} />
              </div>
            ))}
          </div>
        ) : schemes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p>Schemes loading... Data is being populated automatically.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-5">
            {schemes.map(scheme => {
              const country = COUNTRIES[scheme.country_code];
              const cat = CATEGORIES[scheme.category];
              return (
                <Link key={scheme.id} href={`/schemes/${scheme.slug}`} className="card p-5 group flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    {cat && (
                      <span className={`badge ${cat.bgColor} ${cat.color}`}>
                        {cat.icon} {scheme.category}
                      </span>
                    )}
                    <span className="text-xl ml-2">{country?.flag}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-brand-500
                                 transition-colors leading-snug flex-1 text-sm">
                    {scheme.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{scheme.what_you_get}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-brand-500 text-sm">{scheme.benefit_amount}</span>
                    <span className="text-xs text-slate-400">{country?.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── WHY CLAIMIT ── */}
      <section className="bg-slate-900 text-white section">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Why ClaimIt?</h2>
            <p className="text-slate-400">Unlike government portals, we make it truly simple</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌍', t: 'Global Coverage', d: 'India, UK, USA, Nigeria, Kenya — all in one place. Growing to 50+ countries.' },
              { icon: '🗣️', t: 'Your Language', d: 'Telugu, Hindi, Swahili, Yoruba, Spanish and more. No English required.' },
              { icon: '⚡', t: 'Truly Personalized', d: 'Not a generic list. Only schemes YOU actually qualify for based on your profile.' },
            ].map(item => (
              <div key={item.t} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2">{item.t}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="section page-container text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Don&apos;t miss benefits you deserve
        </h2>
        <p className="text-slate-500 text-lg mb-8 max-w-xl mx-auto">
          Check in 2 minutes. Free. No account needed.
        </p>
        <Link href="/IN/check" className="btn-primary text-lg px-10 py-4">
          Find My Benefits Now →
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t border-slate-100 py-8">
        <div className="page-container text-center text-slate-400 text-sm">
          <div className="font-bold text-slate-900 text-lg mb-1">ClaimIt</div>
          <p>Free government scheme finder for everyone, everywhere.</p>
          <p className="mt-1">© {new Date().getFullYear()} ClaimIt · Not affiliated with any government</p>
          <div className="flex justify-center gap-6 mt-4 text-xs flex-wrap">
            {Object.values(COUNTRIES).map(c => (
              <Link key={c.code} href={`/${c.code}`} className="hover:text-brand-500 transition-colors">
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      {/* ── MOBILE BOTTOM NAV ── */}
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
