import { COUNTRIES } from '@/lib/config';

export function generateStaticParams() {
  // Generate both uppercase (IN) and lowercase (in) variants
  // so links like /in/check and /IN/check both resolve correctly
  return Object.keys(COUNTRIES).flatMap((code) => [
    { country: code },            // IN, GB, US, NG, KE
    { country: code.toLowerCase() }, // in, gb, us, ng, ke
  ]);
}

export default function CountryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
