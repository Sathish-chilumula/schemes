import { COUNTRIES } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

// Removed generateStaticParams allowing dynamic edge rendering

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
