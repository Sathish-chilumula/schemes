import CountryPageClient from './CountryPageClient';
import { Metadata } from 'next';
import { COUNTRIES } from '@/lib/config';

export const dynamic = 'force-dynamic';

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

export default function CountryPage({ 
  params 
}: { 
  params: { country: string } 
}) {
  const { country } = params;
  const countryCode = country.toUpperCase();
  const config = COUNTRIES[countryCode];
  const countryName = config?.name || countryCode;

  return (
    <>
      {/* Server-side content for crawlers */}
      <div className="sr-only" aria-hidden="true">
        <h1>Government Schemes in {countryName} 2026</h1>
        <p>Explore all available government schemes including benefits, eligibility, and application process in {countryName}.</p>
      </div>

      <CountryPageClient params={params} />
    </>
  );
}


