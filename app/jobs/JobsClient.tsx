'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { type Scheme } from '@/lib/supabase';
import { SchemeCard } from '@/components/SchemeCard';

export function JobsClient({ initialJobs }: { initialJobs: any[] }) {
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState(initialJobs);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(initialJobs);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(initialJobs.filter(j => 
      j.name.toLowerCase().includes(q) || 
      (j.eligibility?.qualification || '').toLowerCase().includes(q)
    ));
  }, [search, initialJobs]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <Navbar />

      <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm font-bold mb-4 uppercase tracking-widest">
                Recruitment Portal
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Latest Govt Job Openings</h1>
              <p className="text-slate-300 max-w-2xl text-lg">
                Discover the latest vacancies in Central and State departments. 
                Get real-time alerts on SSC, UPSC, and Railway recruitment.
              </p>
            </div>
            <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="text-4xl font-black text-blue-400">{initialJobs.length}</p>
              <p className="text-sm font-bold text-slate-300 uppercase">Active Vacancies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-200">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🎯</span>
            <input
              type="text"
              placeholder="Search by post name or qualification (e.g. Graduate, Engineer)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-slate-900">No jobs found matching your search.</h2>
            <p className="text-slate-500 mt-2">Try searching for a different qualification or department.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all group flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-2xl">💼</div>
                  {job.eligibility?.vacancies && (
                    <span className="bg-green-100 text-green-800 text-xs font-black px-2.5 py-1 rounded-full uppercase">
                      {job.eligibility.vacancies} Posts
                    </span>
                  )}
                </div>
                
                <Link href={`/jobs/${job.slug}`} className="block flex-1 mb-4">
                  <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {job.name}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                      Salary: {job.what_you_get || 'As per rules'}
                    </span>
                  </div>
                </Link>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-600">View Details →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Fix: Point back to main layouts */}
      <footer className="footer-container">
         {/* Footer handled by global layout usually */}
      </footer>
    </div>
  );
}
