import type { Metadata } from 'next';
import './globals.css';
import { LocationDetector } from '@/components/LocationDetector';
import { ChatWidget } from '@/components/ChatWidget';

export const metadata: Metadata = {
  title: `SchemeAtlas — Find Every Government Scheme & Benefit You Qualify For ${new Date().getFullYear()}`,
  description: 'Search 1700+ government schemes and benefits across India and globally. Check eligibility, apply online, and get financial aid. Updated for 2026.',
  keywords: 'government schemes, benefits, welfare, financial assistance, eligibility checker, scholarships, farmer schemes',
  openGraph: {
    title: 'SchemeAtlas — Find Every Government Scheme You Qualify For',
    description: 'Millions of people miss out on benefits they qualify for. Check yours free in 2 minutes with our AI checker.',
    type: 'website',
    locale: 'en_US',
    siteName: 'SchemeAtlas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchemeAtlas — Find Every Government Scheme You Qualify For',
    description: 'Find every government scheme you qualify for. Free. Updated for 2026.',
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-Z2RDTXCHHX"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-Z2RDTXCHHX');
            `,
          }}
        />
        {/* Google News Subscribe with Google */}
        <script async type="application/javascript" src="https://news.google.com/swg/js/v1/swg-basic.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
                basicSubscriptions.init({
                  type: "NewsArticle",
                  isPartOfType: ["Product"],
                  isPartOfProductId: "CAowienfCw:openaccess",
                  clientOptions: { theme: "light", lang: "en" },
                });
              });
            `
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LocationDetector />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
