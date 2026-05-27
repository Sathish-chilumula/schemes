'use client';

import Link from 'next/link';
import { Scheme } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/config';
import { useBookmarks } from '@/hooks/useBookmarks';
import { MouseEvent } from 'react';

const CATEGORY_COLOURS: Record<string, string> = {
  'Farmers': '#2D7A3A',
  'Students': '#1B5FA8',
  'Women': '#C2185B',
  'Healthcare': '#C62828',
  'Business': '#E65100',
  'SC / ST': '#4527A0',
  'Housing': '#06B6D4',
};

function getCategoryIcon(category: string): JSX.Element {
  const size = 16;
  const svgProps = { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', style: { display: 'inline', verticalAlign: 'middle' } };

  switch (category) {
    case 'Farmers':
      return (
        <svg {...svgProps}>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26C17.81 13.47 19 11.38 19 9c0-3.87-3.13-7-7-7z" />
        </svg>
      );
    case 'Students':
      return (
        <svg {...svgProps}>
          <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm-1 12.99L5 13.03V10.1l6 3.27 6-3.27v2.93l-6 2.96z" />
        </svg>
      );
    case 'Women':
      return (
        <svg {...svgProps}>
          <path d="M13 11.5V14h2v2h-2v2h-2v-2H9v-2h2v-2.5C8.47 10.78 7 9.02 7 7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.02-1.47 3.78-4 4.5zM12 4C10.35 4 9 5.35 9 7s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z" />
        </svg>
      );
    case 'Healthcare':
      return (
        <svg {...svgProps}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'Business':
      return (
        <svg {...svgProps}>
          <path d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 12H4V9h16v10zM12 3c-2.76 0-5 2.24-5 5h2c0-1.66 1.34-3 3-3s3 1.34 3 3h2c0-2.76-2.24-5-5-5z" />
        </svg>
      );
    case 'SC / ST':
      return (
        <svg {...svgProps}>
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      );
    default:
      return (
        <svg {...svgProps}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
  }
}

export function SchemeCard({ scheme }: { scheme: Scheme }) {
  const cat = CATEGORIES[scheme.category];
  const { isBookmarked, toggleBookmark, isLoaded } = useBookmarks();
  const bookmarked = isLoaded ? isBookmarked(scheme.id) : false;
  const catColour = CATEGORY_COLOURS[scheme.category] ?? '#3B3BF9';

  const handleBookmark = (e: MouseEvent) => {
    e.preventDefault(); // Stop Link navigation
    e.stopPropagation();
    toggleBookmark(scheme);
  };

  return (
    <div
      className="card cat-border-card p-6 flex flex-col group relative overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
      style={{ borderLeftColor: catColour }}
    >
      {/* Top Badges */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex flex-wrap gap-2">
          {cat && (
            <span className={`badge ${cat.bgColor} ${cat.color} border border-${cat.color.replace('text-', '')}/20`}>
              {getCategoryIcon(scheme.category)}&nbsp;{cat.label || scheme.category}
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
            <span className="benefit-badge">
              {scheme.benefit_amount}
            </span>
          </div>
          <Link
            href={`/schemes/${scheme.slug}`}
            className="text-[12px] font-[700] px-[12px] py-[6px] rounded-[6px] transition-colors"
            style={{ background: '#FF6B00', color: 'white' }}
          >
            Check Eligibility
          </Link>
        </div>
      </Link>
    </div>
  );
}
