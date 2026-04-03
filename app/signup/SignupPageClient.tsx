'use client';

import { useState } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { user, login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    countryCallingCode: '+91'
  });
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // If already logged in, show profile
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 page-container">
        <div className="card p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 font-bold border-2 border-brand-200">
            {user.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome, {user.name}!</h1>
          <p className="text-slate-500 mb-1 text-sm">{user.email}</p>
          {user.phone && <p className="text-slate-400 mb-6 text-xs">{user.phone}</p>}
          <div className="space-y-3">
            <Link
              href="/saved"
              className="btn-primary w-full py-3 text-sm flex items-center justify-center"
            >
              🔖 View Saved Schemes
            </Link>
            <Link
              href="/schemes"
              className="block w-full py-3 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              Browse All Schemes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError } = await login(loginEmail);
    
    if (loginError) {
      setError(loginError);
      setLoading(false);
      return;
    }
    
    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push('/'), 1500);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate phone
      const fullNumber = `${formData.countryCallingCode}${formData.phone}`;
      const phoneNumber = parsePhoneNumberFromString(fullNumber);

      if (!phoneNumber || !phoneNumber.isValid()) {
        throw new Error('Please enter a valid mobile number for your region.');
      }

      const countryCode = phoneNumber.country || 'IN';
      const { error: signupError } = await signup(
        formData.name,
        formData.email,
        phoneNumber.formatInternational(),
        countryCode
      );

      if (signupError) {
        setError(signupError);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 page-container">
        <div className="card p-10 max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2">
            {activeTab === 'login' ? 'Login Successful!' : 'Registration Complete!'}
          </h1>
          <p className="text-slate-500 mb-6">Redirecting you to the homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-brand-500/20 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
      
      <div className="card max-w-md w-full p-8 md:p-10 relative z-10 bg-white/95 backdrop-blur-3xl border border-white/20 shadow-2xl">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/40">
              <span className="text-white font-bold text-2xl">C</span>
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {activeTab === 'login'
              ? 'Sign in with your email to access your saved schemes.'
              : 'Join SchemeAtlas to track your government application statuses and save your schemes.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(null); }}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold mb-6 flex items-start gap-3 border border-red-100 animate-fade-in">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="john@example.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="form-input w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`btn-primary w-full py-4 text-base shadow-xl shadow-brand-500/20 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Sign In →'
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => { setActiveTab('signup'); setError(null); }} className="text-brand-500 font-bold hover:underline">
                Sign up
              </button>
            </p>
          </form>
        )}

        {/* SIGNUP FORM */}
        {activeTab === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Full Name</label>
              <input 
                type="text" 
                required
                placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="form-input w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="john@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="form-input w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Mobile Number (Global)</label>
              <div className="flex gap-2">
                <select 
                  title="country code"
                  aria-label="Country Code"
                  value={formData.countryCallingCode}
                  onChange={e => setFormData({...formData, countryCallingCode: e.target.value})}
                  className="form-input bg-slate-50 border-slate-200 focus:bg-white w-28 text-slate-700"
                >
                  <option value="+91">IN (+91)</option>
                  <option value="+1">US (+1)</option>
                  <option value="+44">UK (+44)</option>
                  <option value="+234">NG (+234)</option>
                  <option value="+254">KE (+254)</option>
                </select>
                <input 
                  type="tel" 
                  required
                  placeholder="10 digit mobile"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                  className="form-input w-full bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 font-medium">We validate numbers globally without needing SMS OTPs.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className={`btn-primary w-full py-4 text-base shadow-xl shadow-brand-500/20 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                'Create Account →'
              )}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={() => { setActiveTab('login'); setError(null); }} className="text-brand-500 font-bold hover:underline">
                Sign in
              </button>
            </p>
          </form>
        )}
        
        <div className="mt-6 text-center text-xs text-slate-500">
          By continuing, you agree to our <a href="/terms" className="text-brand-500 font-bold hover:underline">Terms of Service</a> and <a href="/privacy" className="text-brand-500 font-bold hover:underline">Privacy Policy</a>.
        </div>
      </div>
    </div>
  );
}
