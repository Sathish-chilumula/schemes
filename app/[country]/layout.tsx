import { COUNTRIES } from '@/lib/config';

export function generateStaticParams() {
  return Object.keys(COUNTRIES).reduce((acc: {country: string}[], country) => {
    acc.push({ country });
    return acc;
  }, []);
}

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
