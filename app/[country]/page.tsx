import CountryPageClient from './CountryPageClient';
import { Metadata } from 'next';
import { COUNTRIES } from '@/lib/config';
import { supabaseAdmin } from '@/lib/supabase';
import Link from 'next/link';

// Removed: edge runtime blocks Supabase TCP connections (caused 503s)

export function generateMetadata({ 
  params 
}: { 
  params: { country: string } 
}): Metadata {
  const { country } = params;
  const countryCode = country.toUpperCase();
  const config = COUNTRIES[countryCode];
  const countryName = config?.name || countryCode;

  const title = `Government Schemes in ${countryName} 2026 – Eligibility, Benefits & Apply Online | SchemeAtlas`;
  const description = `Explore all available government schemes in ${countryName} for 2026. Check eligibility criteria, benefit amounts, required documents, and how to apply online today.`;
  const url = `https://schemeatlas.com/${country.toLowerCase()}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'SchemeAtlas',
      type: 'website',
    },
  };
}

export default async function CountryPage({ 
  params 
}: { 
  params: { country: string } 
}) {
  const { country } = params;
  const countryCode = country.toUpperCase();
  const config = COUNTRIES[countryCode];
  const countryName = config?.name || countryCode;

  // Fetch schemes server-side so crawlers can discover them without JS
  let serverSchemes: any[] = [];
  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
    const { data } = await supabase
      .from('schemes')
      .select('slug, name')
      .eq('country_code', countryCode)
      .eq('is_published', true)
      .eq('is_active', true);
    if (data) serverSchemes = data;
  } catch (error) {
    console.error("Failed to fetch server schemes for country page", error);
  }

  return (
    <>
      {/* Server-side content for crawlers */}
      <div className="sr-only" aria-hidden="true">
        <h1>Government Schemes in {countryName} 2026</h1>
        <p>Explore all available government schemes including benefits, eligibility, and application process in {countryName}.</p>
        
        {/* SEO: Provide direct links to all schemes for crawlers to follow */}
        <ul>
          {serverSchemes.map(scheme => (
            <li key={scheme.slug}>
              <Link href={`/schemes/${scheme.slug}`}>{scheme.name}</Link>
            </li>
          ))}
        </ul>
      </div>

      <CountryPageClient params={params} />
    </>
  );
}


