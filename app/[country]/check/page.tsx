'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { COUNTRIES, PROFESSIONS, generateSessionId } from '@/lib/config';

const STEPS = ['Profile', 'Income & Work', 'Location', 'Done'];

export default function CheckPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = use(params);
  const countryCode = country.toUpperCase();
  const countryConfig = COUNTRIES[countryCode];
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    age: '',
    gender: '',
    language: countryConfig?.defaultLanguage || 'en',
    profession: '',
    annual_income: '',
    family_size: '',
    state_region: '',
  });

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  async function submit() {
    setLoading(true);
    const sessionId = generateSessionId();
    try {
      await supabase.from('user_profiles').insert({
        session_id: sessionId,
        country_code: countryCode,
        age: parseInt(form.age),
        gender: form.gender,
        language: form.language,
        profession: form.profession,
        annual_income: parseInt(form.annual_income),
        family_size: parseInt(form.family_size),
        state_region: form.state_region,
      });
      router.push(`/results/${sessionId}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (!countryConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🌍</p>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Country not supported.</h1>
          <Link href="/" className="btn-primary mt-4">Go Home</Link>
        </div>
      </div>
    );
  }

  const canProceed1 = form.age && parseInt(form.age) > 0 && form.gender;
  const canProceed2 = form.profession && form.annual_income && form.family_size;
  const canProceed3 = form.state_region;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100">
        <div className="page-container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-xl text-slate-900">ClaimIt</span>
          </Link>
          <span className="text-sm text-slate-500 flex items-center gap-1">
            {countryConfig.flag} {countryConfig.name}
          </span>
        </div>
      </nav>

      <div className="page-container py-10 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > i + 1
                    ? 'bg-green-500 text-white'
                    : step === i + 1
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-1 w-12 md:w-24 rounded-full transition-all ${
                    step > i + 1 ? 'bg-green-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Step {step} of {STEPS.length - 1} — {STEPS[step - 1]}
          </p>
        </div>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">About You</h2>
              <p className="text-slate-500 text-sm">We use this to match the right schemes for you</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="form-label" htmlFor="age">Your Age *</label>
                <input
                  id="age"
                  type="number"
                  min="0"
                  max="120"
                  placeholder="e.g. 35"
                  value={form.age}
                  onChange={e => update('age', e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Gender *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Male', 'Female', 'Other'].map(g => (
                    <button
                      key={g}
                      id={`gender-${g.toLowerCase()}`}
                      onClick={() => update('gender', g)}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        form.gender === g
                          ? 'border-brand-500 bg-brand-50 text-brand-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {g === 'Male' ? '👨' : g === 'Female' ? '👩' : '🧑'} {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label" htmlFor="language">Preferred Language</label>
                <select
                  id="language"
                  value={form.language}
                  onChange={e => update('language', e.target.value)}
                  className="form-input"
                >
                  {countryConfig.languages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'en' ? '🇬🇧 English'
                        : lang === 'hi' ? '🇮🇳 हिंदी'
                        : lang === 'te' ? 'తెలుగు'
                        : lang === 'ta' ? 'தமிழ்'
                        : lang === 'kn' ? 'ಕನ್ನಡ'
                        : lang === 'mr' ? 'मराठी'
                        : lang === 'es' ? '🇪🇸 Español'
                        : lang === 'yo' ? 'Yoruba'
                        : lang === 'ha' ? 'Hausa'
                        : lang === 'ig' ? 'Igbo'
                        : lang === 'sw' ? '🇰🇪 Kiswahili'
                        : lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              id="next-step-1"
              onClick={() => setStep(2)}
              disabled={!canProceed1}
              className="btn-primary w-full mt-8"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Income & Work */}
        {step === 2 && (
          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Work & Income</h2>
              <p className="text-slate-500 text-sm">Helps us find schemes based on your economic situation</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="form-label" htmlFor="profession">Profession *</label>
                <select
                  id="profession"
                  value={form.profession}
                  onChange={e => update('profession', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select your profession</option>
                  {PROFESSIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="income">Annual Income *</label>
                <select
                  id="income"
                  value={form.annual_income}
                  onChange={e => update('annual_income', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select income range</option>
                  {countryConfig.incomeRanges.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="family-size">Family Size *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8+'].map(n => (
                    <button
                      key={n}
                      id={`family-${n}`}
                      onClick={() => update('family_size', n === '8+' ? '8' : n)}
                      className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                        form.family_size === (n === '8+' ? '8' : n)
                          ? 'border-brand-500 bg-brand-50 text-brand-500'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button
                id="next-step-2"
                onClick={() => setStep(3)}
                disabled={!canProceed2}
                className="btn-primary flex-1"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Your Location</h2>
              <p className="text-slate-500 text-sm">Some schemes are state or region-specific</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="form-label" htmlFor="state">State / Region *</label>
                <select
                  id="state"
                  value={form.state_region}
                  onChange={e => update('state_region', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select your state / region</option>
                  {countryConfig.states.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-3">📋 Your Profile Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-slate-500">Age</div><div className="font-medium">{form.age} years</div>
                  <div className="text-slate-500">Gender</div><div className="font-medium">{form.gender}</div>
                  <div className="text-slate-500">Profession</div><div className="font-medium">{form.profession}</div>
                  <div className="text-slate-500">Family</div><div className="font-medium">{form.family_size} members</div>
                  <div className="text-slate-500">Country</div><div className="font-medium">{countryConfig.flag} {countryConfig.name}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button
                id="find-schemes"
                onClick={submit}
                disabled={!canProceed3 || loading}
                className="btn-primary flex-1"
              >
                {loading ? '🔍 Finding schemes...' : '🎯 Find My Benefits →'}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              Free. No account. No spam. Your data is not sold.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
