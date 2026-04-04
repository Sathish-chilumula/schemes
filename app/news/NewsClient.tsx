'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export function NewsClient({ initialNews }: { initialNews: any[] }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(initialNews);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(initialNews);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(initialNews.filter(n => n.name.toLowerCase().includes(q)));
  }, [search, initialNews]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <Navbar />

      <div className="bg-[#1a1c2e] text-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <span className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-black uppercase tracking-tighter mb-4 inline-block">
            🔴 Official Bulletins
          </span>
          <h1 className="text-4xl md:text-5xl font-black mb-4">Government Decisions & News</h1>
          <p className="text-slate-400 max-w-2xl text-lg font-medium">
            Daily briefing on policy changes, cabinet approvals, and civic announcements.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* Main Feed */}
          <div className="lg:w-2/3 space-y-4">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 mb-8 sticky top-20 z-30 shadow-sm">
                <input
                    type="text"
                    placeholder="Search recent news or decisions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                    <p className="text-4xl mb-4">🔇</p>
                    <p className="text-slate-500 font-bold">No news matched your search.</p>
                </div>
            ) : (
                filtered.map(item => (
                    <article key={item.id} className="bg-white p-8 rounded-3xl border border-slate-200 hover:border-indigo-300 transition-colors group shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/4">
                             <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-center">
                                 <span className="block text-slate-400 uppercase text-[10px] font-black tracking-widest mb-1">Published</span>
                                 <p className="text-slate-900 font-black text-sm">
                                     {new Date(item.discovered_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                 </p>
                             </div>
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 mb-3 inline-block">
                                {item.category}
                            </span>
                            <Link href={`/news/${item.slug}`} className="block">
                                <h2 className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-all mb-4 leading-tight">
                                    {item.name}
                                </h2>
                                <p className="text-slate-600 line-clamp-3 text-sm leading-relaxed mb-6 font-medium">
                                    {item.content_en?.substring(0, 200)}...
                                </p>
                            </Link>
                            <div className="flex items-center justify-between">
                                <Link href={`/news/${item.slug}`} className="text-indigo-600 font-black text-xs uppercase tracking-tighter border-b-2 border-indigo-100 hover:border-indigo-600 pb-1 flex items-center gap-2">
                                    Full Decision Details 
                                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Link>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">OFFICIAL SOURCE</span>
                            </div>
                        </div>
                    </article>
                ))
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/3">
             <div className="sticky top-24 space-y-6">
                 <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[40px] text-white shadow-xl shadow-blue-200/50">
                     <h3 className="text-xl font-black mb-4">Stay Notified</h3>
                     <p className="text-indigo-100 text-sm font-medium mb-6 leading-relaxed">
                         The government updates rules daily. Get instant alerts straight to your browser on Aadhaar deadlines and Budget sessions.
                     </p>
                     <button className="w-full bg-white text-indigo-600 py-3 rounded-2xl font-black text-sm uppercase tracking-tighter shadow-lg hover:scale-[1.03] transition-transform">
                         Enable News Alerts
                     </button>
                 </div>
                 <div className="bg-white p-8 rounded-3xl border border-slate-200">
                     <h4 className="text-sm font-black text-slate-900 uppercase mb-4 tracking-widest">Trending Categories</h4>
                     <ul className="space-y-2">
                         {['Aadhaar Updates', 'Cabinet Decisions', 'State Budget', 'Job Openings'].map(c => (
                             <li key={c} className="bg-slate-50 px-4 py-2.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 transition-all cursor-pointer">
                                 {c}
                             </li>
                         ))}
                     </ul>
                 </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
