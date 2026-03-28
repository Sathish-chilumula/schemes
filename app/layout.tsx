import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClaimIt — Find Government Benefits You Qualify For',
  description: 'Discover every government scheme and benefit you qualify for. Free. In your language. For 50+ countries worldwide.',
  keywords: 'government schemes, benefits, welfare, financial assistance, eligibility checker',
  openGraph: {
    title: 'ClaimIt — Find Government Benefits You Qualify For',
    description: 'Millions of people miss out on benefits they qualify for. Check yours free in 2 minutes.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClaimIt — Government Benefit Finder',
    description: 'Find every government scheme you qualify for. Free. Any country.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
