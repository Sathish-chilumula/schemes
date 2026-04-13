import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { SchemeCard } from '@/components/SchemeCard';
import { Metadata } from 'next';

export const revalidate = 3600;
export const runtime = 'edge';

// Removed generateStaticParams allowing edge dynamic rendering

const STATE_MAPPING: Record<string, { code: string, name: string }> = {
  // States
  'andhra-pradesh': { code: 'AP', name: 'Andhra Pradesh' },
  'arunachal-pradesh': { code: 'AR', name: 'Arunachal Pradesh' },
  'assam': { code: 'AS', name: 'Assam' },
  'bihar': { code: 'BR', name: 'Bihar' },
  'chhattisgarh': { code: 'CG', name: 'Chhattisgarh' },
  'goa': { code: 'GA', name: 'Goa' },
  'gujarat': { code: 'GJ', name: 'Gujarat' },
  'haryana': { code: 'HR', name: 'Haryana' },
  'himachal-pradesh': { code: 'HP', name: 'Himachal Pradesh' },
  'jharkhand': { code: 'JH', name: 'Jharkhand' },
  'karnataka': { code: 'KA', name: 'Karnataka' },
  'kerala': { code: 'KL', name: 'Kerala' },
  'madhya-pradesh': { code: 'MP', name: 'Madhya Pradesh' },
  'maharashtra': { code: 'MH', name: 'Maharashtra' },
  'manipur': { code: 'MN', name: 'Manipur' },
  'meghalaya': { code: 'ML', name: 'Meghalaya' },
  'mizoram': { code: 'MZ', name: 'Mizoram' },
  'nagaland': { code: 'NL', name: 'Nagaland' },
  'odisha': { code: 'OR', name: 'Odisha' },
  'punjab': { code: 'PB', name: 'Punjab' },
  'rajasthan': { code: 'RJ', name: 'Rajasthan' },
  'sikkim': { code: 'SK', name: 'Sikkim' },
  'tamil-nadu': { code: 'TN', name: 'Tamil Nadu' },
  'telangana': { code: 'TS', name: 'Telangana' },
  'tripura': { code: 'TR', name: 'Tripura' },
  'uttar-pradesh': { code: 'UP', name: 'Uttar Pradesh' },
  'uttarakhand': { code: 'UK', name: 'Uttarakhand' },
  'west-bengal': { code: 'WB', name: 'West Bengal' },
  
  // Union Territories
  'andaman-and-nicobar-islands': { code: 'AN', name: 'Andaman and Nicobar Islands' },
  'chandigarh': { code: 'CH', name: 'Chandigarh' },
  'dadra-and-nagar-haveli': { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  'delhi': { code: 'DL', name: 'Delhi' },
  'jammu-kashmir': { code: 'JK', name: 'Jammu & Kashmir' },
  'ladakh': { code: 'LA', name: 'Ladakh' },
  'lakshadweep': { code: 'LD', name: 'Lakshadweep' },
  'puducherry': { code: 'PY', name: 'Puducherry' },
};

function getNormalizedStateSlug(stateParam: string): string | null {
  const lower = stateParam.toLowerCase();
  if (STATE_MAPPING[lower]) return lower;
  // Check if it matches a state code
  for (const [slug, info] of Object.entries(STATE_MAPPING)) {
    if (info.code.toLowerCase() === lower || info.name.toLowerCase().replace(/\s+/g, '-') === lower) {
      return slug;
    }
  }
  return null;
}

export function generateMetadata({ params }: { params: { state: string } }): Metadata {
  const { state } = params;
  const normalizedSlug = getNormalizedStateSlug(state);
  const stateInfo = normalizedSlug ? STATE_MAPPING[normalizedSlug] : null;
  
  if (!stateInfo) return {};

  return {
    title: `${stateInfo.name} Government Schemes 2025 | SchemeAtlas`,
    description: `Complete list of active government schemes, welfare programs and financial aid currently available in ${stateInfo.name} for 2025.`,
    alternates: {
      canonical: `https://schemeatlas.com/in/${normalizedSlug}`,
    },
  };
}

export default function StatePage({ params }: { params: { state: string } }) {
  const { state } = params;
  const normalizedSlug = getNormalizedStateSlug(state);
  
  // If the parameter isn't strictly the canonical lowercase slug, redirect to it
  if (normalizedSlug && normalizedSlug !== state) {
    const { redirect } = await import('next/navigation');
    redirect(`/in/${normalizedSlug}`);
  }

  const stateInfo = normalizedSlug ? STATE_MAPPING[normalizedSlug] : null;
  
  if (!stateInfo) notFound();

  const supabase = supabaseAdmin();
  
  // Try matching against 'state_code', or the generic name in 'state_name'
  const { data: schemes } = await supabase
    .from('schemes')
    .select('*')
    .eq('is_published', true)
    .eq('country_code', 'IN')
    // Get schemes for this specific state AND central-level schemes
    // Note: To match state precisely, we check state_code or state_name
    .or(`state_code.eq.${stateInfo.code},state_name.ilike.%${stateInfo.name}%`)
    .order('name', { ascending: true });

  const stateSchemes = schemes || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="bg-slate-900 border-b border-slate-800 text-white py-12">
        <div className="page-container text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
            <Link href="/" className="text-slate-400 hover:text-white">Home</Link>
            <span className="text-slate-600">›</span>
            <Link href="/IN" className="text-slate-400 hover:text-white">India</Link>
            <span className="text-slate-600">›</span>
            <span className="text-brand-400 font-semibold">{stateInfo.name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Government Schemes in <span className="text-brand-500">{stateInfo.name}</span> 2025
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Browse all active financial aid, educational, and welfare programs exclusively available for citizens in {stateInfo.name}.
          </p>
        </div>
      </div>

      <div className="page-container py-12">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-slate-600 font-medium">
            Showing <strong className="text-slate-900">{stateSchemes.length}</strong> active schemes for {stateInfo.name}
          </p>
        </div>

        {stateSchemes.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {stateSchemes.map((scheme) => (
              <SchemeCard key={scheme.id} scheme={scheme} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto mt-8 shadow-sm">
            <span className="text-5xl block mb-4">📋</span>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Local Schemes Found Yet</h3>
            <p className="text-slate-500 mb-6">
              Our AI is currently actively scanning state government portals for {stateInfo.name}. 
              Meanwhile, you are automatically eligible for over 500 Central Government schemes.
            </p>
             <Link href="/schemes?country=IN" className="btn-primary">
              View All India Schemes
            </Link>
          </div>
        )}
      </div>
      
       {/* Mobile nav */}
       <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200
                      flex justify-around items-center py-2 z-50 md:hidden">
        {[
          { href: '/', icon: '🏠', label: 'Home' },
          { href: '/IN/check', icon: '🔍', label: 'Check' },
          { href: '/schemes', icon: '📋', label: 'Schemes' },
        ].map(item => (
          <Link key={item.href} href={item.href} className="nav-link text-center">
            <span className="text-xl block">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
