import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { LocationDetector } from '@/components/LocationDetector';
import { ChatWidget } from '@/components/ChatWidget';
import { Footer } from '@/components/Footer';

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* PWA manifest — required for install prompt */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SchemeAtlas" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {/* Google Analytics - afterInteractive */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-Z2RDTXCHHX" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Z2RDTXCHHX');
          `}
        </Script>

        {/* Google AdSense - lazyOnload to prevent render blocking */}
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3809505002238691"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />

        {/* Google News Subscribe - lazyOnload */}
        <Script src="https://news.google.com/swg/js/v1/swg-basic.js" strategy="lazyOnload" />
        <Script id="google-news" strategy="lazyOnload">
          {`
            (self.SWG_BASIC = self.SWG_BASIC || []).push( basicSubscriptions => {
              basicSubscriptions.init({
                type: "NewsArticle",
                isPartOfType: ["Product"],
                isPartOfProductId: "CAowienfCw:openaccess",
                clientOptions: { theme: "light", lang: "en" },
              });
            });
          `}
        </Script>

        <LocationDetector />
        {children}
        <Footer />
        <ChatWidget />
        {/* Service Worker registration — enables PWA install */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(reg) { console.log('SW registered:', reg.scope); })
                  .catch(function(err) { console.log('SW registration failed:', err); });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}

