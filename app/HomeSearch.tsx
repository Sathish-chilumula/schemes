'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase, Scheme } from '@/lib/supabase';

export function HomeSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Scheme[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('schemes')
        .select('id, name, slug, what_you_get')
        .eq('is_published', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(5);
        
      if (data) setSearchResults(data as any);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  return (
    <div className="bg-white rounded-2xl p-2 max-w-3xl mx-auto flex items-center shadow-xl relative border border-slate-100">
      <span className="pl-4 text-slate-400 text-xl">🔍</span>
      <input 
        type="text" 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-transparent border-none focus:ring-0 text-slate-800 px-4 py-3 placeholder-slate-400 font-medium text-lg leading-none" 
        placeholder="Search for PM Kisan, Scholarships, Housing..." 
      />
      <button className="bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-colors relative min-w-[100px]">
        {isSearching ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin absolute inset-0 m-auto"></span>
        ) : 'Search'}
      </button>

      {searchQuery.length >= 2 && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in-up">
          <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
            Suggested Schemes
          </div>
          <ul>
            {searchResults.map((result) => (
              <li key={result.id}>
                <Link 
                  href={`/schemes/${result.slug}`}
                  className="block px-4 py-3 hover:bg-brand-50 hover:text-brand-700 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="font-bold text-slate-800 mb-0.5">{result.name}</div>
                  <div className="text-xs text-slate-500 truncate">{result.what_you_get}</div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="p-3 text-center bg-slate-50 border-t border-slate-100">
            <Link href={`/schemes?q=${encodeURIComponent(searchQuery)}`} className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">
              View all results →
            </Link>
          </div>
        </div>
      )}
      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 p-6 text-center text-slate-500 font-medium">
            No schemes found matching "{searchQuery}"
          </div>
      )}
    </div>
  );
}
