import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { slugify, getIndianStateBySlug, getCanonicalCategory } from '@/lib/seo';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
// export const dynamicParams = true;

export async function generateMetadata({ 
  params 
}: { 
  params: { state: string; category: string } 
}): Promise<Metadata> {
  const resolvedParams = params;
  const stateObj = getIndianStateBySlug(resolvedParams.state);
  const category = resolvedParams.category;

  if (!stateObj) return { title: 'Not Found' };

  const currentYear = new Date().getFullYear();
  const title = `Government Schemes for ${category} in ${stateObj.name} ${currentYear} | SchemeAtlas`;
  const description = `Explore all government ${category} schemes and benefits specifically for ${stateObj.name} residents in ${currentYear}. Check eligibility, benefits, and how to apply online.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://schemeatlas.com/schemes/state/${resolvedParams.state}/${resolvedParams.category}`,
    },
    openGraph: {
      title,
      description,
      url: `https://schemeatlas.com/schemes/state/${resolvedParams.state}/${resolvedParams.category}`,
      type: 'website',
    },
  };
}

export default async function PSEOPage({ 
  params 
}: { 
  params: { state: string; category: string } 
}) {
  const resolvedParams = params;
  const stateObj = getIndianStateBySlug(resolvedParams.state);
  const categorySlug = resolvedParams.category;

  if (!stateObj) notFound();

  const supabase = supabaseAdmin();
  
  // Fetch schemes for this state and category
  const { data: schemes } = await supabase
    .from('schemes')
    .select('*')
    .eq('state_code', stateObj.code)
    .eq('is_published', true)
    .limit(10);

  // 1. Fetch the unique PSEO Intro Content from DB
  const { data: pseoData } = await supabase
    .from('pseo_content')
    .select('intro_content')
    .eq('state_code', stateObj.code)
    .eq('category', categorySlug)
    .single();

  const introContent = pseoData?.intro_content || `
    Government ${categorySlug} programs in ${stateObj.name} are designed to provide direct financial aid, 
    subsidies, and welfare support to eligible residents. These ${new Date().getFullYear()} schemes aim to improve 
    social welfare, reduce economic inequality, and empower the local community in ${stateObj.name}.
    By applying for these benefits, families and individuals can access critical resources 
    backed by state and central ministries.
  `;

  // Filter by category slug manually
  const filteredSchemes = (schemes || []).filter(s => 
    slugify(s.category || 'others') === categorySlug || 
    getCanonicalCategory(s.category) === categorySlug
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* PSEO Content Block */}
      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <nav className="text-blue-100 text-sm mb-6 uppercase tracking-wider font-semibold">
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/schemes" className="hover:underline">Schemes</Link>
            <span className="mx-2">/</span>
            <Link href={`/schemes/state/${resolvedParams.state}`} className="hover:underline">{stateObj.name}</Link>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Government {categorySlug} Schemes in {stateObj.name} ({new Date().getFullYear()})
          </h1>
          
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-blue-50 text-lg leading-relaxed text-left">
            <h2 className="text-xl font-bold mb-3 text-white">Why These Schemes Matter</h2>
            <div className="whitespace-pre-wrap">
              {introContent}
            </div>
          </div>
        </div>
      </div>

      {/* Scheme List Section */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b-2 border-slate-200 pb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Available Benefits</h2>
            <p className="text-slate-600 italic">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <p className="text-slate-500 font-medium">Found {filteredSchemes.length} schemes</p>
        </div>

        {filteredSchemes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredSchemes.map((scheme) => (
              <div key={scheme.id} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all border border-slate-100 group flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                      {scheme.category || 'General'}
                    </span>
                    <span className="text-slate-400 text-sm">₹ {scheme.benefit_amount || 'N/A'}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-4 group-hover:text-blue-600 group-hover:underline">
                    {scheme.name}
                  </h3>
                  <p className="text-slate-600 line-clamp-3 mb-6">
                    {scheme.what_you_get || 'Learn how to apply and check eligibility for this program.'}
                  </p>
                </div>
                <Link 
                  href={`/schemes/${scheme.slug}`}
                  className="inline-flex items-center text-blue-600 font-bold hover:gap-2 transition-all group-hover:text-blue-700"
                >
                  View Full Details
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-16 rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <h3 className="text-2xl font-bold text-slate-400 mb-2">No specialized schemes found</h3>
            <p className="text-slate-500">We are currently indexing more programs for this category. Check back soon.</p>
            <Link href="/schemes" className="mt-6 inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
              Browse All Schemes
            </Link>
          </div>
        )}
      </div>

      {/* Structured SEO FAQ */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-slate-900 mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">How to apply for {categorySlug} schemes in {stateObj.name}?</h3>
            <p className="text-slate-600 leading-relaxed">
              Most {categorySlug} schemes in {stateObj.name} for {new Date().getFullYear()} can be applied for via the official MyScheme portal or the specific state ministry website. ensure you have your Aadhar card, residence proof, and income certificate ready for verification.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Who is eligible for these benefits?</h3>
            <p className="text-slate-600 leading-relaxed">
              Eligibility varies by scheme, but generally focuses on permanent residents of {stateObj.name} with specific income or socio-economic criteria. check the individual scheme pages above for detailed requirements.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export const runtime = 'edge';
