'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { COUNTRIES, CATEGORIES } from '@/lib/config';
import { Navbar } from '@/components/Navbar';

export type EligibilityResult = {
  scheme_id: string;
  scheme_name: string;
  scheme_slug: string;
  category: string;
  benefit_amount: string;
  what_you_get: string;
  official_url: string;
  is_eligible: boolean;
  confidence: string;
  reason: string;
  benefit_amount_personal: string;
  next_step: string;
  priority: string;
};

export type Profile = {
  country_code: string;
  age: number;
  gender: string;
  profession: string;
  annual_income: number;
  state_region: string;
  family_size: number;
};

interface ResultsClientProps {
  initialResults: EligibilityResult[];
  initialProfile: Profile | null;
  sessionId: string;
}

export function ResultsClient({ initialResults, initialProfile, sessionId }: ResultsClientProps) {
  const router = useRouter();
  const [results, setResults] = useState<EligibilityResult[]>(initialResults);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile || initialResults.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading) return;

    let timer: NodeJS.Timeout;
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/eligibility?session_id=${sessionId}`);
        if (res.status === 202) {
          // Still processing, retry later
          setRetryCount(prev => prev + 1);
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setProfile(data.profile || null);
          setLoading(false);
        } else {
          const errData = await res.json();
          setError(errData.error || 'Failed to load results');
          setLoading(false);
        }
      } catch (err) {
        console.error('Polling error:', err);
        setRetryCount(prev => prev + 1);
      }
    };

    if (retryCount < 10) {
      timer = setTimeout(fetchResults, 2000);
    } else {
      setError('Taking longer than usual. Please refresh the page.');
      setLoading(false);
    }

    return () => clearTimeout(timer);
  }, [sessionId, loading, retryCount]);

  const eligible = results.filter(r => r.is_eligible);
  const notEligible = results.filter(r => !r.is_eligible);
  const country = profile ? COUNTRIES[profile.country_code] : null;

  const shareText = eligible.length > 0
    ? `I found ${eligible.length} government schemes I qualify for on SchemeAtlas! Check yours free 👉 ${process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.com'}`
    : `Check which government schemes you qualify for free on SchemeAtlas! 👉 ${process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.com'}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="page-container py-8 max-w-4xl mx-auto">
        <>
            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Analyzing Your Eligibility...</h2>
                <p className="text-slate-500 max-w-md">
                  We&apos;re matching your profile against hundreds of government schemes. This usually takes 5-10 seconds.
                </p>
                <p className="text-xs text-slate-400 mt-4 italic">Attempt {retryCount + 1} of 10</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-100 p-8 rounded-3xl text-center">
                <p className="text-4xl mb-4">⚠️</p>
                <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
                <p className="text-red-700 mb-6">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-red-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-red-700 transition"
                >
                  Refresh Page
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Summary Card */}
                <div className={`rounded-2xl p-8 text-white mb-8 ${
                  eligible.length > 0
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-slate-500 to-slate-700'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-5xl font-bold mb-1">{eligible.length}</div>
                      <div className="text-xl font-semibold mb-1">
                        scheme{eligible.length !== 1 ? 's' : ''} you qualify for
                      </div>
                      {profile && country && (
                        <p className="text-white/80 text-sm">
                          {country.flag} {country.name} · Age {profile.age} · {profile.profession}
                        </p>
                      )}
                    </div>
                    <div className="text-5xl">{eligible.length > 0 ? '🎉' : '📋'}</div>
                  </div>

                  {eligible.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="share-whatsapp"
                        className="bg-white text-green-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors text-center"
                      >
                        📱 Share on WhatsApp
                      </a>
                      {profile && (
                        <Link
                          href={`/${profile.country_code}`}
                          className="bg-white/20 border border-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/30 transition-colors text-center"
                        >
                          Browse All {country?.name} Schemes →
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Eligible Schemes */}
                {eligible.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</span>
                      You Qualify For ({eligible.length})
                    </h2>
                    <div className="space-y-4">
                      {eligible.map(r => {
                        const cat = CATEGORIES[r.category];
                        return (
                          <div key={r.scheme_id} className="card p-6 eligible-card">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                {cat && (
                                  <span className={`badge ${cat.bgColor} ${cat.color}`}>
                                    {cat.icon} {r.category}
                                  </span>
                                )}
                                <span className={`badge text-xs px-2 py-0.5 rounded-full ${
                                  r.confidence === 'high'
                                    ? 'bg-green-100 text-green-800'
                                    : r.confidence === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {r.confidence} confidence
                                </span>
                              </div>
                              <span className="font-bold text-green-600 text-sm whitespace-nowrap ml-2">
                                {r.benefit_amount_personal || r.benefit_amount}
                              </span>
                            </div>

                            <h3 className="font-bold text-lg text-slate-900 mb-2">{r.scheme_name}</h3>
                            <p className="text-sm text-slate-600 mb-3">{r.reason}</p>

                            {r.next_step && (
                              <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-4">
                                <p className="text-sm font-semibold text-green-800">
                                  👉 Next Step: {r.next_step}
                                </p>
                              </div>
                            )}

                            <div className="flex gap-3 flex-wrap">
                              <Link href={`/schemes/${r.scheme_slug}`}
                                className="text-sm font-semibold text-brand-500 hover:underline">
                                Full Details →
                              </Link>
                              {r.official_url && (
                                <a href={r.official_url} target="_blank" rel="noopener noreferrer"
                                  className="text-sm font-semibold text-green-600 hover:underline">
                                  Apply Now ↗
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Not Eligible */}
                {notEligible.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-white text-xs">✗</span>
                      Doesn&apos;t Match ({notEligible.length})
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {notEligible.map(r => {
                        const cat = CATEGORIES[r.category];
                        return (
                          <div key={r.scheme_id} className="card p-4 opacity-70">
                            <div className="flex items-center gap-2 mb-2">
                              {cat && (
                                <span className={`badge ${cat.bgColor} ${cat.color}`}>
                                  {cat.icon} {r.category}
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-slate-800 text-sm mb-1">{r.scheme_name}</h3>
                            <p className="text-xs text-slate-500">{r.reason}</p>
                            <Link href={`/schemes/${r.scheme_slug}`}
                              className="text-xs text-slate-400 hover:text-brand-500 mt-2 block">
                              View details →
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {results.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-5xl mb-4">📋</p>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No schemes checked yet</h2>
                    <p className="text-slate-500 mb-4">No schemes available for your country yet. Check back soon.</p>
                    <Link href="/" className="btn-primary">Go Home</Link>
                  </div>
                )}

                {/* Try again */}
                {profile && (
                  <div className="text-center mt-6">
                    <Link href={`/${profile.country_code}/check`}
                      className="text-sm text-slate-500 hover:text-brand-500 transition-colors">
                      ← Try with different profile
                    </Link>
                  </div>
                )}
              </>
            )}
          </>
      </div>
    </div>
  );
}
