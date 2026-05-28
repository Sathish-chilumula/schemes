'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-admin-client';

export const runtime = 'edge';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';
  const supabase = createAdminClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white p-8 rounded-3xl shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-3xl">SA</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">SchemeAtlas CMS</h1>
        <p className="text-slate-500 text-center mb-8">Sign in to manage content</p>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 text-sm font-medium border border-rose-100">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow bg-slate-50"
              placeholder="admin@schemeatlas.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow bg-slate-50"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
