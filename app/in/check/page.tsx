import CheckPageClient from '../../[country]/check/CheckPageClient';
import { Metadata } from 'next';
import { COUNTRIES } from '@/lib/config';

export const runtime = 'edge';

export async function generateMetadata(): Promise<Metadata> {
  const config = COUNTRIES['IN'];
  const countryName = config?.name || 'India';

  const title = `Check Eligibility for ${countryName} Government Schemes 2026 | SchemeAtlas`;
  const description = `Instantly find out which government schemes you qualify for in ${countryName}. Use our free AI-powered eligibility checker for 2026 benefits.`;
  const url = `https://schemeatlas.com/in/check`;

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

export default async function IndiaCheckPage() {
  const config = COUNTRIES['IN'];
  const countryName = config?.name || 'India';

  // We recreate the params promise expected by CheckPageClient
  const params = Promise.resolve({ country: 'in' });

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
