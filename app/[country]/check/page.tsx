import { COUNTRIES } from '@/lib/config';
import CheckPageClient from './CheckPageClient';

export function generateStaticParams() {
  return Object.keys(COUNTRIES).map((country) => ({
    country: country.toLowerCase(),
  }));
}

export default function CheckPage({ params }: { params: Promise<{ country: string }> }) {
  return <CheckPageClient params={params} />;
}
