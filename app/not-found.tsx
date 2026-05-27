import Link from 'next/link';
import { Navbar } from '@/components/Navbar';

export default function GlobalNotFound() {
  return (
    <main className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full flex flex-col items-center justify-center">
        <div className="text-center mb-12 mt-8">
          <div className="text-[80px] mb-4">🔍</div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6">Page Not Found</h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            We couldn't find the page you're looking for. The link may be broken, or the page may have been removed or renamed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-black hover:scale-105 transition-all shadow-lg">
              Go to Home Page
            </Link>
            <Link href="/schemes" className="inline-block bg-white text-slate-900 border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:border-slate-300 hover:scale-105 transition-all shadow-sm">
              Browse All Schemes
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
