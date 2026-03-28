'use client';

import Link from 'next/link';
import { Scheme } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/config';
import { useBookmarks } from '@/hooks/useBookmarks';
import { MouseEvent } from 'react';

export function SchemeCard({ scheme }: { scheme: Scheme }) {
  const cat = CATEGORIES[scheme.category];
  const { isBookmarked, toggleBookmark, isLoaded } = useBookmarks();
  const bookmarked = isLoaded ? isBookmarked(scheme.id) : false;

  const handleBookmark = (e: MouseEvent) => {
    e.preventDefault(); // Stop Link navigation
    e.stopPropagation();
    toggleBookmark(scheme);
  };

  return (
    <div className="card p-6 flex flex-col group relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
      {/* Top Badges */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex flex-wrap gap-2">
          {cat && (
            <span className={`badge ${cat.bgColor} ${cat.color} border border-${cat.color.replace('text-', '')}/20`}>
              {cat.icon} {cat.label || scheme.category}
            </span>
          )}
          <span className={`text-xs font-bold px-2 py-1 rounded border ${
            scheme.scheme_type === 'central' ? 'bg-orange-50 text-orange-700 border-orange-200' 
            : scheme.scheme_type === 'state' ? 'bg-blue-50 text-blue-700 border-blue-200' 
            : 'bg-slate-50 text-slate-700 border-slate-200'
          }`}>
            {scheme.scheme_type === 'central' ? 'Central' : scheme.scheme_type === 'state' ? 'State' : 'General'}
          </span>
        </div>
        
        <button 
          onClick={handleBookmark}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-brand-500
            ${bookmarked 
              ? 'bg-yellow-100 text-yellow-600 scale-110 shadow-sm' 
              : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-500 hover:scale-105'
            }
          `}
          title={bookmarked ? "Remove Bookmark" : "Save Scheme"}
        >
          <svg className="w-4 h-4" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={bookmarked ? "0" : "2"}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>
      
      {/* Title & Desc */}
      <Link href={`/schemes/${scheme.slug}`} className="flex-1 flex flex-col cursor-pointer outline-none">
        <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-brand-600 transition-colors leading-snug line-clamp-2 relative z-10">
          {scheme.name}
        </h3>
        
        <p className="text-sm text-slate-600 mb-6 line-clamp-3 flex-1 relative z-10">
          {scheme.what_you_get}
        </p>

        {/* View Count (if trending context is nice) */}
        {scheme.views !== undefined && scheme.views > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {scheme.views} views
          </div>
        )}
        
        {/* Meta Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
          {scheme.target_group?.slice(0, 2).map((tg: string) => (
            <span key={tg} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
              {tg}
            </span>
          ))}
          {scheme.target_group?.length > 2 && (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
              +{scheme.target_group.length - 2}
            </span>
          )}
        </div>

        {/* Footer & CTA */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Benefit</span>
            <span className="font-extrabold text-green-600 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
              {scheme.benefit_amount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white text-slate-400 transition-all shadow-sm">
            <span className="font-bold cursor-pointer">→</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
