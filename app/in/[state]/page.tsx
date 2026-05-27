import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { SchemeCard } from '@/components/SchemeCard';
import { Metadata } from 'next';

export const revalidate = 3600;
import React from 'react';

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
  for (const [slug, info] of Object.entries(STATE_MAPPING)) {
    if (info.code.toLowerCase() === lower || info.name.toLowerCase().replace(/\s+/g, '-') === lower) {
      return slug;
    }
  }
  return null;
}

export async function generateMetadata({ params, searchParams }: { params: { state: string }; searchParams: { [key: string]: string | string[] | undefined } }): Promise<Metadata> {
  const { state } = params;
  const normalizedSlug = getNormalizedStateSlug(state);
  const stateInfo = normalizedSlug ? STATE_MAPPING[normalizedSlug] : null;
  
  if (!stateInfo) return {};

  // If a ?category= filter is present, this is a filtered view — not independently indexable.
  // The canonical page (/in/[state]) is the authoritative URL.
  if (searchParams.category) {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: `https://schemeatlas.com/in/${normalizedSlug}` },
    };
  }

  // Fetch scheme count for this state to make meta description accurate
  let schemeCount = 50; // sensible fallback
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    const { count } = await supabase
      .from('schemes')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('country_code', 'IN')
      .or(`state_code.eq.${stateInfo.code},state_name.ilike.%${stateInfo.name}%`);
    if (count) schemeCount = count;
  } catch { /* use fallback */ }

  const currentYear = new Date().getFullYear();
  const title = `Government Schemes in ${stateInfo.name} ${currentYear} — ${schemeCount}+ Schemes | SchemeAtlas`;
  const description = `Find all ${schemeCount}+ government schemes available in ${stateInfo.name} for farmers, women, students, SC/ST and more. Check eligibility instantly. Updated ${currentYear}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://schemeatlas.com/in/${normalizedSlug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://schemeatlas.com/in/${normalizedSlug}`,
    },
  };
}

export default async function StatePage({ params }: { params: { state: string } }) {
  const { state } = params;
  const normalizedSlug = getNormalizedStateSlug(state);
  
  if (normalizedSlug && normalizedSlug !== state) {
    const { redirect } = await import('next/navigation');
    redirect(`/in/${normalizedSlug}`);
  }

  const stateInfo = normalizedSlug ? STATE_MAPPING[normalizedSlug] : null;
  if (!stateInfo) notFound();

  const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

  const { data: schemes } = await supabase
    .from('schemes')
    .select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url')
    .eq('is_published', true)
    .eq('country_code', 'IN')
    .or(`state_code.eq.${stateInfo.code},state_name.ilike.%${stateInfo.name}%`)
    .order('name', { ascending: true }) as any;

  const stateSchemes = (schemes || []) as any[];

  const breadcrumbs = [
    { name: 'Home', item: 'https://schemeatlas.com' },
    { name: 'India', item: 'https://schemeatlas.com/in/india' },
    { name: stateInfo.name, item: `https://schemeatlas.com/in/${normalizedSlug}` }
  ];

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((b, i) => ({
      '@type': 'ListItem',
      'position': i + 1,
      'name': b.name,
      'item': b.item
    }))
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <div className="bg-slate-900 text-white pt-32 pb-16">
        <div className="page-container px-4">
          <div className="flex items-center justify-center md:justify-start gap-4 mb-8 text-sm">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-600">/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-brand-400 font-bold">{b.name}</span>
                ) : (
                  <Link href={b.item.replace('https://schemeatlas.com', '')} className="text-slate-400 hover:text-white transition-colors">
                    {b.name}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Government Schemes in <span className="text-brand-500">{stateInfo.name}</span> {new Date().getFullYear()}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl">
            Browse all active financial aid, educational, and welfare programs exclusively available for citizens in {stateInfo.name}.
          </p>
        </div>
      </div>

      <div className="page-container py-12 px-4">
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
      
      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  return Object.keys(STATE_MAPPING).map((state) => ({
    state: state,
  }));
}
