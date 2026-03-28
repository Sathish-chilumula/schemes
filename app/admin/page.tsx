'use client';

import { useEffect, useState } from 'react';
import { supabase, Scheme } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminCRM() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Authentication Check
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin2026') {
      setIsAuthenticated(true);
      fetchSchemes();
    } else {
      alert('Incorrect Password');
    }
  };

  const fetchSchemes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('schemes')
      .select('*')
      .order('discovered_at', { ascending: false });
    
    setSchemes(data || []);
    setLoading(false);
  };

  const togglePublish = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('schemes')
      .update({ is_published: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setSchemes(prev => prev.map(s => s.id === id ? { ...s, is_published: !currentStatus } : s));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to permanently delete "${name}"?`)) {
      const { error } = await supabase.from('schemes').delete().eq('id', id);
      if (!error) {
        setSchemes(prev => prev.filter(s => s.id !== id));
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <form onSubmit={handleLogin} className="card p-8 w-full max-w-sm bg-white">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">C</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-6">Admin Access</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input w-full mb-4"
            placeholder="Enter Admin Password"
            autoFocus
          />
          <button type="submit" className="btn-primary w-full py-3">Login to CRM</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛡️</span>
            <h1 className="font-bold text-xl hidden sm:block">SchemeAtlas Master CRM</h1>
          </div>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-sm font-semibold text-slate-300 hover:text-white">View Main Site</Link>
            <button onClick={() => setIsAuthenticated(false)} className="btn-secondary px-4 py-1.5 text-xs">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Schemes Management</h2>
            <p className="text-slate-500 text-sm mt-1">Total database records: {schemes.length}</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary" onClick={fetchSchemes}>
              🔄 Refresh Data
            </button>
          </div>
        </div>

        <div className="card overflow-hidden border border-slate-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading secure database...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Scheme Name</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Country</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Views</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schemes.map(scheme => (
                    <tr key={scheme.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 line-clamp-1">{scheme.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{scheme.slug}</div>
                      </td>
                      <td className="p-4 font-semibold text-slate-600">{scheme.country_code}</td>
                      <td className="p-4">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                          {scheme.category}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-sm text-slate-500">
                        {scheme.views || 0}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => togglePublish(scheme.id, scheme.is_published)}
                          className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                            scheme.is_published 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          }`}
                        >
                          {scheme.is_published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/schemes/${scheme.slug}`} target="_blank" className="p-1.5 text-slate-400 hover:text-brand-500 bg-slate-100 rounded hover:bg-brand-50 transition-colors">
                            👁️
                          </Link>
                          <button onClick={() => handleDelete(scheme.id, scheme.name)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-100 rounded hover:bg-red-50 transition-colors">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {!loading && schemes.length === 0 && (
              <div className="p-16 text-center text-slate-500">
                No schemes found in the database. Run the AI Scraper to populate.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
