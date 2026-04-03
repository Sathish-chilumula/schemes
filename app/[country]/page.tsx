import { COUNTRIES } from '@/lib/config';
import CountryPageClient from './CountryPageClient';

export function generateStaticParams() {
  return Object.keys(COUNTRIES).map((country) => ({
    country: country.toLowerCase(),
  }));
}

export default function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  return <CountryPageClient params={params} />;
}
