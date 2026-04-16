import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { COUNTRIES } from '@/lib/config';
import { slugify } from '@/lib/seo';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { state: string } }): Metadata {
  const resolvedParams = params;
  const india = COUNTRIES.IN;
  const stateObj = india.states.find(s => slugify(s.name) === resolvedParams.state);

  if (!stateObj) return { title: 'State Not Found' };

  const currentYear = new Date().getFullYear();
  const title = `All Government Schemes in ${stateObj.name} ${currentYear} | SchemeAtlas`;
  const description = `Explore all state and central government schemes available in ${stateObj.name} for ${currentYear}. Browse benefits by category like agriculture, education, and health.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://schemeatlas.com/schemes/state/${resolvedParams.state}`,
    },
    openGraph: {
      title,
      description,
      url: `https://schemeatlas.com/schemes/state/${resolvedParams.state}`,
      siteName: 'SchemeAtlas',
      type: 'website',
    },
  };
}

export default function StateHubPage({ params }: { params: { state: string } }) {
  const resolvedParams = params;
  const india = COUNTRIES.IN;
  const stateObj = india.states.find(s => slugify(s.name) === resolvedParams.state);

  if (!stateObj) notFound();

  const categories = india.categories;

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Hero Section & Breadcrumbs */}
      <div className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <nav className="text-blue-100 text-sm mb-6 uppercase tracking-wider font-semibold">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/schemes" className="hover:underline">Schemes</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{stateObj.name}</span>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Government Schemes in {stateObj.name} ({new Date().getFullYear()})
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Find every benefit, subsidy, and welfare program available for residents of {stateObj.name}.
          </p>
        </div>
      </div>

      {/* Category Grid (Silo Navigation) */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b pb-2">
          Browse by Category in {stateObj.name}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link 
              key={cat}
              href={`/schemes/state/${resolvedParams.state}/${slugify(cat)}`}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 group"
            >
              <h3 className="text-xl font-semibold text-blue-600 mb-2 capitalize group-hover:underline">
                {cat} Schemes
              </h3>
              <p className="text-slate-600">
                View all state and central {cat} benefits available in {stateObj.name} for {new Date().getFullYear()}.
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Freshness Footer */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
          <p className="text-slate-500 italic">
            Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Optimized for the latest government policies.
          </p>
        </div>
      </div>
    </main>
  );
}


