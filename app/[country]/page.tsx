import { COUNTRIES } from '@/lib/config';
import CountryPageClient from './CountryPageClient';

export const runtime = 'edge';

export function generateStaticParams() {
  return Object.keys(COUNTRIES).map((country) => ({
    country: country.toLowerCase(),
  }));
}

export default function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  return <CountryPageClient params={params} />;
}
