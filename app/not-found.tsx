import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

// Top-performing categories to surface on 404
const POPULAR_CATEGORIES = [
  { label: '🌾 Farmers', href: '/schemes?category=Farmers', color: '#2D7A3A', bg: '#E8F5E9' },
  { label: '🎓 Students', href: '/schemes?category=Students', color: '#1B5FA8', bg: '#EBF4FF' },
  { label: '👩 Women', href: '/schemes?category=Women', color: '#C2185B', bg: '#FCE4EC' },
  { label: '🏥 Healthcare', href: '/schemes?category=Healthcare', color: '#C62828', bg: '#FFEBEE' },
  { label: '🏠 Housing', href: '/schemes?category=Housing', color: '#06B6D4', bg: '#E0F7FA' },
  { label: '💼 Business', href: '/schemes?category=Business', color: '#E65100', bg: '#FFF3E0' },
  { label: '🎯 SC / ST', href: '/schemes?category=SC+%2F+ST', color: '#4527A0', bg: '#EDE7F6' },
  { label: '👴 Senior Citizens', href: '/schemes?category=Senior+Citizens', color: '#5D4037', bg: '#EFEBE9' },
];

// Top trending schemes based on analytics (Cheyutha #1, etc.)
const TRENDING_SCHEMES = [
  { name: 'Cheyutha Pension Scheme', slug: 'cheyutha-pension-scheme-in', badge: '🔥 Trending' },
  { name: 'PM Kisan Samman Nidhi', slug: 'pm-kisan-samman-nidhi-yojana-in', badge: '🌾 Farmers' },
  { name: 'Ayushman Bharat', slug: 'ayushman-bharat-pradhan-mantri-jan-arogya-yojana-in', badge: '🏥 Health' },
  { name: 'PM Awas Yojana', slug: 'pradhan-mantri-awas-yojana-in', badge: '🏠 Housing' },
];

export default function GlobalNotFound() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full">
        {/* Hero section */}
        <div className="text-center mb-10 mt-4">
          <div className="text-[72px] mb-3 select-none">🔍</div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
            Page Not Found
          </h1>
          <p className="text-base text-slate-500 mb-6 max-w-xl mx-auto leading-relaxed">
            This page may have been moved or removed. But don&apos;t worry — 
            use the search below or browse categories to find what you need.
          </p>

          {/* Search bar */}
          <form
            action="/schemes"
            method="GET"
            className="flex items-center gap-2 max-w-lg mx-auto mb-8"
          >
            <input
              type="text"
              name="q"
              placeholder="Search schemes, e.g. PM Kisan, Ayushman..."
              className="flex-1 px-5 py-3 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-medium text-sm focus:outline-none focus:border-orange-400 transition-colors shadow-sm"
              autoFocus
            />
            <button
              type="submit"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-sm transition-all shadow-sm hover:scale-105"
            >
              Search
            </button>
          </form>

          {/* Quick nav buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            <Link
              href="/"
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-sm hover:scale-105"
            >
              🏠 Home
            </Link>
            <Link
              href="/schemes"
              className="px-5 py-2.5 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-bold text-sm hover:border-slate-300 transition-all shadow-sm hover:scale-105"
            >
              📋 All Schemes
            </Link>
            <Link
              href="/in"
              className="px-5 py-2.5 bg-white text-slate-900 border-2 border-slate-200 rounded-xl font-bold text-sm hover:border-slate-300 transition-all shadow-sm hover:scale-105"
            >
              🇮🇳 India Schemes
            </Link>
          </div>
        </div>

        {/* Browse by Category */}
        <div className="mb-10">
          <h2 className="text-lg font-black text-slate-900 mb-4 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="flex items-center justify-center px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:scale-105 hover:shadow-md text-center"
                style={{ background: cat.bg, color: cat.color, border: `1.5px solid ${cat.color}25` }}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Schemes */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-8">
          <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse inline-block"></span>
            Popular Right Now
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRENDING_SCHEMES.map((s) => (
              <Link
                key={s.slug}
                href={`/schemes/${s.slug}`}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-orange-200 hover:bg-orange-50 transition-all group"
              >
                <span className="font-semibold text-slate-900 text-sm group-hover:text-orange-700 transition-colors">
                  {s.name}
                </span>
                <span className="text-xs font-bold text-slate-500 ml-2 whitespace-nowrap">
                  {s.badge}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Helpful note */}
        <p className="text-center text-xs text-slate-400 mt-4">
          If you followed a link that brought you here, it may be outdated.{' '}
          <Link href="/contact" className="text-orange-500 hover:underline font-medium">
            Let us know
          </Link>{' '}
          and we&apos;ll fix it.
        </p>
      </div>
    </main>
  );
}
