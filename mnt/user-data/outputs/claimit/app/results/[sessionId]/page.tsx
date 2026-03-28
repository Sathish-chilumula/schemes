'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, CATEGORIES } from '@/lib/config';

type Result = {
  scheme_id: string;
  scheme_name: string;
  scheme_slug: string;
  category: string;
  benefit_amount: string;
  benefit_amount_personal: string;
  what_you_get: string;
  official_url: string;
  image_keyword: string;
  is_eligible: boolean;
  confidence: string;
  reason: string;
  next_step: string;
  priority: string;
};

type Profile = {
  country_code: string;
  age: number;
  profession: string;
  language: string;
};

const LOADING_MSGS = [
  '🔍 Finding your schemes...',
  '🤖 Checking eligibility rules...',
  '📋 Matching your profile...',
  '✅ Almost ready...',
];

export default function ResultsPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<Result[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgIndex, setMsgIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setMsgIndex(i => (i + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    fetch('/api/eligibility', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErrorMsg(data.error); }
        setResults(data.results || []);
        setProfile(data.profile || null);
      })
      .catch(e => setErrorMsg(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const eligible = results.filter(r => r.is_eligible);
  const others = results.filter(r => !r.is_eligible);
  const country = profile ? COUNTRIES[profile.country_code] : null;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const waText = `I found ${eligible.length} government schemes I qualify for! Check yours free → ${siteUrl}`;

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-6"
          style={{ animation: 'spin 1s linear infinite' }} />
        <p className="text-lg font-semibold text-slate-700 mb-2">{LOADING_MSGS[msgIndex]}</p>
        <p className="text-slate-400 text-sm">Checking all available schemes for you...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (errorMsg) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="card p-8 max-w-md text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="font-bold text-xl mb-2">Something went wrong</h2>
        <p className="text-slate-500 text-sm mb-6">{errorMsg}</p>
        <Link href="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href={country ? `/${profile?.country_code}` : '/'} className="text-slate-400 hover:text-slate-700 text-xl">←</Link>
          <span className="font-semibold text-slate-800">Your Results</span>
          {country && <span className="text-xl">{country.flag}</span>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Summary Card */}
        <div className={`rounded-2xl p-6 text-white ${
          eligible.length > 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-brand-500 to-blue-700'
        }`}>
          <p className="text-white/70 text-sm mb-2">
            {country?.flag} {country?.name} · {profile?.profession}
          </p>
          <h1 className="text-3xl font-bold mb-2">
            {eligible.length > 0 ? `✅ ${eligible.length} scheme${eligible.length !== 1 ? 's' : ''} found!` : 'Results ready'}
          </h1>
          {eligible.length > 0 && (
            <p className="text-white/90 text-sm mb-4">
              You may qualify for {eligible.length} government scheme{eligible.length !== 1 ? 's' : ''}.
              Start claiming your benefits today.
            </p>
          )}
          <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30
                       text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
            📱 Share with Family on WhatsApp
          </a>
        </div>

        {/* Eligible Schemes */}
        {eligible.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <span className="text-green-500">✅</span> You Qualify For ({eligible.length})
            </h2>
            <div className="space-y-4">
              {eligible.map(r => <ResultCard key={r.scheme_id} r={r} eligible siteUrl={siteUrl} />)}
            </div>
          </div>
        )}

        {/* Other Schemes */}
        {others.length > 0 && (
          <div>
            <h2 className="font-semibold text-slate-500 mb-3 flex items-center gap-2">
              <span>ℹ️</span> Other Available Schemes ({others.length})
            </h2>
            <div className="space-y-3">
              {others.map(r => <ResultCard key={r.scheme_id} r={r} eligible={false} siteUrl={siteUrl} />)}
            </div>
          </div>
        )}

        {results.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-4">📋</p>
            <p className="text-lg font-semibold mb-2">No schemes found yet</p>
            <p className="text-sm mb-6">Our agents are still discovering schemes for {country?.name}. Check back soon!</p>
            <Link href="/" className="btn-primary">Go Home</Link>
          </div>
        )}

        {/* Try Another Country */}
        <div className="card p-5 text-center">
          <p className="text-slate-500 text-sm mb-3">Want to check another country?</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {Object.values(COUNTRIES).map(c => (
              <Link key={c.code} href={`/${c.code}/check`}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-sm
                           hover:border-brand-500 transition-colors">
                {c.flag} {c.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ r, eligible, siteUrl }: { r: Result; eligible: boolean; siteUrl: string }) {
  const cat = CATEGORIES[r.category];
  const schemeUrl = `${siteUrl}/schemes/${r.scheme_slug}`;
  const waText = `Check out this government scheme: ${r.scheme_name} — ${r.benefit_amount} → ${schemeUrl}`;

  return (
    <div className={`card p-5 ${eligible ? 'eligible-card' : 'opacity-80'}`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        {cat && (
          <span className={`badge ${cat.bgColor} ${cat.color} shrink-0`}>
            {cat.icon} {r.category}
          </span>
        )}
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
          eligible ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          {eligible ? '✅ Eligible' : 'Not eligible'}
        </span>
      </div>

      <h3 className="font-semibold text-slate-900 mb-1 leading-snug">{r.scheme_name}</h3>
      <p className="text-xs text-slate-500 mb-3">{r.reason}</p>

      {eligible && (
        <>
          <div className="bg-brand-50 rounded-xl p-3 mb-2">
            <p className="text-xs font-semibold text-brand-500 mb-0.5">💰 Your Benefit</p>
            <p className="font-bold text-brand-600">{r.benefit_amount_personal || r.benefit_amount}</p>
          </div>
          {r.next_step && (
            <div className="bg-green-50 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-green-700 mb-0.5">👉 Next Step</p>
              <p className="text-sm text-green-800">{r.next_step}</p>
            </div>
          )}
        </>
      )}

      <div className="flex gap-2 flex-wrap">
        <Link href={`/schemes/${r.scheme_slug}`}
          className="flex-1 py-2.5 rounded-xl border-2 border-brand-500 text-brand-500
                     font-semibold text-sm hover:bg-brand-50 transition-colors text-center min-w-0">
          View Details
        </Link>
        {eligible && r.official_url && (
          <a href={r.official_url} target="_blank" rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-brand-500 text-white font-semibold text-sm
                       hover:bg-brand-600 transition-colors">
            Apply ↗
          </a>
        )}
        {eligible && (
          <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`}
            target="_blank" rel="noopener noreferrer"
            className="px-3 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold transition-colors">
            📱
          </a>
        )}
      </div>
    </div>
  );
}
