import type { Metadata } from 'next';
import './globals.css';
import { LocationDetector } from '@/components/LocationDetector';
import { ChatWidget } from '@/components/ChatWidget';

export const metadata: Metadata = {
  title: 'SchemeAtlas .',
  description: 'Search every government scheme and benefit you qualify for.',
  keywords: 'government schemes, benefits, welfare, financial assistance, eligibility checker',
  openGraph: {
    title: 'SchemeAtlas .',
    description: 'Millions of people miss out on benefits they qualify for. Check yours free in 2 minutes.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchemeAtlas .',
    description: 'Find every government scheme you qualify for. Free. Any country.',
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
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <LocationDetector />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
