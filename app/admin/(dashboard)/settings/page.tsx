'use client';

import { useEffect, useState } from 'react';
import { createAdminClient } from '@/lib/supabase-admin-client';
import { User, Shield } from 'lucide-react';

export const runtime = 'edge';

export default function SettingsPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [loading, setLoading] = useState(false);
  
  const supabase = createAdminClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || '');
    };
    fetchUser();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully' });
      setPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <User className="text-brand-500" />
          Admin Profile
        </h2>
        
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2">Admin Email</label>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
          />
          <p className="text-xs text-slate-500 mt-2">Email cannot be changed from the dashboard.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <Shield className="text-brand-500" />
          Security
        </h2>

        {message && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500"
              placeholder="Enter new password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
