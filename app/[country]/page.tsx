import CountryPageClient from './CountryPageClient';

export const runtime = 'edge';

export default function CountryPage({ params }: { params: Promise<{ country: string }> }) {
  return <CountryPageClient params={params} />;
}
