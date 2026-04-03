import { COUNTRIES } from '@/lib/config';
import CheckPageClient from './CheckPageClient';

export const runtime = 'edge';

export function generateStaticParams() {
  return Object.keys(COUNTRIES).map((country) => ({
    country: country.toLowerCase(),
  }));
}

export default function CheckPage({ params }: { params: Promise<{ country: string }> }) {
  return <CheckPageClient params={params} />;
}
