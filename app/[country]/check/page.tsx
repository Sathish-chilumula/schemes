import CheckPageClient from './CheckPageClient';
import { Metadata } from 'next';
import { COUNTRIES } from '@/lib/config';

export const runtime = 'edge';

export function generateMetadata({ 
  params 
}: { 
  params: { country: string } 
}): Metadata {
  const { country } = params;
  const countryCode = country.toUpperCase();
  const config = COUNTRIES[countryCode];
  const countryName = config?.name || countryCode;

  const title = `Check Eligibility for ${countryName} Government Schemes 2026 | SchemeAtlas`;
  const description = `Instantly find out which government schemes you qualify for in ${countryName}. Use our free AI-powered eligibility checker for 2026 benefits.`;
  const url = `https://schemeatlas.com/${country.toLowerCase()}/check`;

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

export default function CheckPage({ 
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
      <div className="sr-only" aria-hidden="true">
        <h1>Check Your Eligibility for {countryName} Government Schemes</h1>
        <p>Answer a few questions to find schemes you qualify for in {countryName} for 2026.</p>
      </div>
      <CheckPageClient params={params} />
    </>
  );
}


