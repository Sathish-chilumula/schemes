import CheckPageClient from './CheckPageClient';

export const runtime = 'edge';

export default function CheckPage({ params }: { params: Promise<{ country: string }> }) {
  return <CheckPageClient params={params} />;
}
