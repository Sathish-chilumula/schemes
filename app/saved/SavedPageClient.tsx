'use client';

import Link from 'next/link';
import { useBookmarks } from '@/hooks/useBookmarks';
import { SchemeCard } from '@/components/SchemeCard';
import { Navbar } from '@/components/Navbar';

export default function SavedSchemesPage() {
  const { bookmarks, isLoaded } = useBookmarks();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />


      <div className="page-container py-12 flex-1">
        <div className="mb-10 text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-yellow-100 shadow-sm">
            🔖
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Saved Schemes
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            These are the schemes you've bookmarked to review or apply to later.
            They are saved securely in your browser.
          </p>
        </div>

        {!isLoaded ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 rounded-full border-4 border-slate-200 border-t-brand-500"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-xl font-bold text-slate-800 mb-2">No saved schemes yet</h2>
            <p className="text-slate-500 mb-6 px-6">
              When you find a scheme you're interested in, click the bookmark icon on its card to save it here.
            </p>
            <Link href="/IN" className="btn-primary text-sm px-6 py-3">
              Browse Active Schemes
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {bookmarks.map(scheme => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
