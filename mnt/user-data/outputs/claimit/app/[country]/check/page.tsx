'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { COUNTRIES, LANGUAGE_NAMES, PROFESSIONS, generateSessionId } from '@/lib/config';

export default function CheckPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.country as string)?.toUpperCase();
  const country = COUNTRIES[code];

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    age: '',
    gender: '',
    language: country?.defaultLanguage || 'en',
    profession: '',
    annual_income: 0,
    family_size: 2,
    state_region: '',
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const sid = generateSessionId();
      const { error: err } = await supabase.from('user_profiles').insert({
        session_id: sid,
        country_code: code,
        age: parseInt(form.age),
        gender: form.gender,
        profession: form.profession,
        annual_income: form.annual_income,
        state_region: form.state_region,
        family_size: form.family_size,
        language: form.language,
      });
      if (err) throw err;
      if (typeof window !== 'undefined') localStorage.setItem('schemeatlas_session', sid);
      router.push(`/results/${sid}`);
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  if (!country) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-xl mb-4">Country not found</p>
        <Link href="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );

  const incomes = country.incomeRanges;
  const step1Valid = !!form.age && !!form.gender;
  const step2Valid = !!form.profession && form.annual_income > 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href={`/${code}`} className="text-slate-400 hover:text-slate-700 text-xl">←</Link>
          <span className="text-xl">{country.flag}</span>
          <span className="font-semibold text-slate-800 text-sm">Find {country.name} Benefits</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6">

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                               font-bold shrink-0 transition-all ${
                step > s ? 'bg-green-500 text-white' :
                step === s ? 'bg-brand-500 text-white' :
                'bg-slate-200 text-slate-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`h-1 flex-1 rounded-full transition-all ${step > s ? 'bg-green-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="card p-6 md:p-8">

          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Basic Information</h2>
                <p className="text-slate-500 text-sm">Tell us a bit about yourself</p>
              </div>

              {/* Age */}
              <div>
                <label className="form-label">Your Age *</label>
                <input type="number" className="form-input" placeholder="e.g. 35"
                  value={form.age} min="1" max="120"
                  onChange={e => set('age', e.target.value)} />
              </div>

              {/* Gender */}
              <div>
                <label className="form-label">Gender *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button key={g} onClick={() => set('gender', g)}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        form.gender === g
                          ? 'border-brand-500 bg-brand-50 text-brand-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language */}
              {country.languages.length > 1 && (
                <div>
                  <label className="form-label">Preferred Language</label>
                  <div className="grid grid-cols-2 gap-2">
                    {country.languages.map(lang => (
                      <button key={lang} onClick={() => set('language', lang)}
                        className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                          form.language === lang
                            ? 'border-brand-500 bg-brand-50 text-brand-500'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        {LANGUAGE_NAMES[lang] || lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setStep(2)} disabled={!step1Valid} className="btn-primary w-full">
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: Financial ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Your Situation</h2>
                <p className="text-slate-500 text-sm">Helps us find the right schemes</p>
              </div>

              {/* Profession */}
              <div>
                <label className="form-label">Profession *</label>
                <select className="form-input" value={form.profession} onChange={e => set('profession', e.target.value)}>
                  <option value="">Select your profession</option>
                  {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Income */}
              <div>
                <label className="form-label">Annual Income *</label>
                <div className="space-y-2">
                  {incomes.map(r => (
                    <button key={r.value} onClick={() => set('annual_income', r.value)}
                      className={`w-full text-left py-3 px-4 rounded-xl border-2 text-sm
                                  font-medium transition-all ${
                        form.annual_income === r.value
                          ? 'border-brand-500 bg-brand-50 text-brand-600'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Family Size */}
              <div>
                <label className="form-label">Family Size (including yourself)</label>
                <div className="flex items-center gap-5">
                  <button onClick={() => set('family_size', Math.max(1, form.family_size - 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 font-bold text-xl
                               hover:border-brand-500 transition-colors flex items-center justify-center">
                    −
                  </button>
                  <span className="text-3xl font-bold text-brand-500 w-8 text-center">
                    {form.family_size}
                  </span>
                  <button onClick={() => set('family_size', Math.min(15, form.family_size + 1))}
                    className="w-10 h-10 rounded-full border-2 border-slate-200 font-bold text-xl
                               hover:border-brand-500 transition-colors flex items-center justify-center">
                    +
                  </button>
                  <span className="text-slate-500 text-sm">members</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button onClick={() => setStep(3)} disabled={!step2Valid} className="btn-primary flex-1">
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Location + Summary ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">Your Location</h2>
                <p className="text-slate-500 text-sm">Some schemes are region-specific</p>
              </div>

              {/* State */}
              <div>
                <label className="form-label">
                  {code === 'IN' ? 'State' : code === 'US' ? 'State' : code === 'GB' ? 'Country/Region' : 'State / Region'}
                </label>
                {country.states.length > 0 ? (
                  <select className="form-input" value={form.state_region} onChange={e => set('state_region', e.target.value)}>
                    <option value="">Select {code === 'GB' ? 'region' : 'state'}</option>
                    {country.states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input type="text" className="form-input" placeholder="Your region or city"
                    value={form.state_region} onChange={e => set('state_region', e.target.value)} />
                )}
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="font-semibold text-slate-700 text-sm mb-3">Your Profile Summary</p>
                <div className="space-y-2">
                  {[
                    { l: 'Country', v: `${country.flag} ${country.name}` },
                    { l: 'Age', v: `${form.age} years old` },
                    { l: 'Gender', v: form.gender },
                    { l: 'Profession', v: form.profession },
                    { l: 'Family Size', v: `${form.family_size} members` },
                    { l: 'Language', v: LANGUAGE_NAMES[form.language] || form.language },
                  ].map(item => (
                    <div key={item.l} className="flex justify-between text-sm">
                      <span className="text-slate-500">{item.l}</span>
                      <span className="font-medium text-slate-800">{item.v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
                <button onClick={submit} disabled={saving} className="btn-primary flex-1">
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent
                                       rounded-full inline-block" style={{ animation: 'spin 1s linear infinite' }} />
                      Checking...
                    </span>
                  ) : 'Find My Schemes →'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          🔒 No login needed · Your data stays private · 100% Free forever
        </p>
      </div>
    </div>
  );
}
