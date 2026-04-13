'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { COUNTRIES, PROFESSIONS, generateSessionId } from '@/lib/config';
import { Navbar } from '@/components/Navbar';

const STEPS = ['Profile', 'Income & Work', 'Location', 'Done'];

export default function CheckPageClient({ params }: { params: { country: string } }) {
  const { country } = params;
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
    categories: [] as string[], // Social Categories (SC/ST/OBC etc)
  });

  const update = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryToggle = (cat: string) => {
    setForm(prev => {
      if (prev.categories.includes(cat)) {
        return { ...prev, categories: prev.categories.filter(c => c !== cat) };
      }
      return { ...prev, categories: [...prev.categories, cat] };
    });
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
        categories: form.categories,
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
      <Navbar />

      <div className="page-container py-10 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div 
              className="absolute top-1/2 left-0 h-1 bg-brand-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>
            
            {STEPS.map((label, i) => (
              <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                  step > i + 1
                    ? 'bg-brand-500 text-white ring-4 ring-brand-50'
                    : step === i + 1
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100 scale-110'
                    : 'bg-white text-slate-400 border-2 border-slate-200'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-bold absolute -bottom-6 whitespace-nowrap hidden sm:block ${step === i + 1 ? 'text-brand-600' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm font-bold text-brand-600 mt-8 sm:hidden">
            Step {step} of {STEPS.length - 1} — {STEPS[step - 1]}
          </p>
        </div>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="card p-8 animate-fade-in-up">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-100 shadow-sm">👤</div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">About You</h2>
              <p className="text-slate-500 text-sm">We use this to match the right schemes for you</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
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
                    className="form-input text-center text-xl font-bold font-mono py-4"
                  />
                </div>
                <div>
                  <label className="form-label">Gender *</label>
                  <select
                    value={form.gender}
                    onChange={e => update('gender', e.target.value)}
                    className="form-select py-4 font-semibold"
                  >
                    <option value="">Select</option>
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                    <option value="Other">🧑 Other</option>
                  </select>
                </div>
              </div>

              {countryConfig.targetGroups && countryConfig.targetGroups.length > 0 && (
                <div>
                  <label className="form-label">Social Category / Community</label>
                  <p className="text-xs text-slate-500 mb-3">Many schemes are dedicated to specific communities.</p>
                  <div className="flex flex-wrap gap-2">
                    {countryConfig.targetGroups.map(group => {
                      const isSelected = form.categories.includes(group);
                      return (
                        <button
                          key={group}
                          onClick={() => handleCategoryToggle(group)}
                          className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                            isSelected 
                              ? 'bg-brand-50 border-brand-500 text-brand-600 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected && <span className="mr-1.5">✓</span>}
                          {group}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="form-label" htmlFor="language">Preferred Scheme Language</label>
                <select
                  id="language"
                  value={form.language}
                  onChange={e => update('language', e.target.value)}
                  className="form-select"
                >
                  {countryConfig.languages.map(lang => (
                    <option key={lang} value={lang}>
                      {lang === 'en' ? '🇬🇧 English'
                        : lang === 'hi' ? '🇮🇳 हिंदी (Hindi)'
                        : lang === 'te' ? 'తెలుగు (Telugu)'
                        : lang === 'ta' ? 'தமிழ் (Tamil)'
                        : lang === 'kn' ? 'ಕನ್ನಡ (Kannada)'
                        : lang === 'mr' ? 'मराठी (Marathi)'
                        : lang === 'es' ? '🇪🇸 Español'
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
              className="btn-primary w-full mt-10 py-4 text-lg"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Income & Work */}
        {step === 2 && (
          <div className="card p-8 animate-fade-in-up">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-green-100 shadow-sm">💼</div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Work & Income</h2>
              <p className="text-slate-500 text-sm">Helps us find schemes based on your economic situation</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="form-label" htmlFor="profession">Profession *</label>
                <select
                  id="profession"
                  value={form.profession}
                  onChange={e => update('profession', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select your profession</option>
                  {PROFESSIONS.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label" htmlFor="income">Annual Family Income *</label>
                <select
                  id="income"
                  value={form.annual_income}
                  onChange={e => update('annual_income', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select income range</option>
                  {countryConfig.incomeRanges.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Family Size *</label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8+'].map(n => {
                    const val = n === '8+' ? '8' : n;
                    return (
                      <button
                        key={n}
                        onClick={() => update('family_size', val)}
                        className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                          form.family_size === val
                            ? 'border-brand-500 bg-brand-50 text-brand-600 shadow-sm'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setStep(1)} className="btn-secondary w-1/3 py-4">← Back</button>
              <button
                id="next-step-2"
                onClick={() => setStep(3)}
                disabled={!canProceed2}
                className="btn-primary flex-1 py-4 text-lg"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="card p-8 animate-fade-in-up">
            <div className="mb-8 text-center">
               <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-orange-100 shadow-sm">📍</div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Your Location</h2>
              <p className="text-slate-500 text-sm">Some schemes are exclusive to state or region residents</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="form-label" htmlFor="state">State / Region *</label>
                <select
                  id="state"
                  value={form.state_region}
                  onChange={e => update('state_region', e.target.value)}
                  className="form-select font-medium"
                >
                  <option value="">Select your state / region</option>
                  {countryConfig.states.map(s => (
                    <option key={s.code} value={s.code}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Seamless Summary */}
              <div className="bg-slate-50/50 rounded-2xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-brand-500">✓</span> Profile Complete
                </h3>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div className="text-slate-500">Age & Gender</div>
                  <div className="font-semibold">{form.age} years / {form.gender}</div>
                  
                  {form.categories.length > 0 && (
                    <>
                      <div className="text-slate-500">Categories</div>
                      <div className="font-semibold">{form.categories.join(', ')}</div>
                    </>
                  )}
                  
                  <div className="text-slate-500">Profession</div>
                  <div className="font-semibold truncate">{form.profession}</div>
                  
                  <div className="text-slate-500">Income</div>
                  <div className="font-semibold">{countryConfig.incomeRanges.find(r => r.value.toString() === form.annual_income)?.label}</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button onClick={() => setStep(2)} className="btn-secondary w-1/3 py-4">← Back</button>
              <button
                id="find-schemes"
                onClick={submit}
                disabled={!canProceed3 || loading}
                className="btn-primary flex-1 py-4 text-lg relative overflow-hidden group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Finding schemes...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">🎯 Find My Benefits →</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-xs font-semibold text-slate-400 mt-6 flex items-center justify-center gap-2">
              <span>🔒 Free. No account. No spam. Your data is not sold.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
