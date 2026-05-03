import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Money Guides & Financial Articles | SchemeAtlas",
  description: "Expert guides on loans, insurance, earning online and government schemes for Indians.",
  alternates: {
    canonical: 'https://schemeatlas.com/articles'
  }
};

import ClientArticles from './ClientArticles';

export default async function ArticlesPage() {
  
  const articlesDir = path.join(process.cwd(), 'content/articles');
  let articles: any[] = [];
  
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));
    articles = files.map(file => {
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
      return JSON.parse(content);
    });
  }

  // Fallback to placeholder data if no articles found
  if (articles.length === 0) {
    articles = [
      { category: "Earn Money", tagColor: "#059669", title: "15 Ways to Earn Money Online in India 2025", desc: "From PMKVY training to freelancing — practical earning paths for every Indian.", slug: "earn-money-online-india", views: "24.5K", readTime: "8 min read" },
      { category: "Loans", tagColor: "#2563EB", title: "Best Personal Loans in India: Compare 20+ Banks", desc: "SBI, HDFC, ICICI compared — rates, eligibility and step-by-step apply guide.", slug: "best-personal-loans-india", views: "31.2K", readTime: "11 min read" },
      { category: "Insurance", tagColor: "#7C3AED", title: "Health Insurance Tips Every Indian Family Needs", desc: "Mistakes to avoid, what to check before buying, and the best plans compared.", slug: "health-insurance-tips-india", views: "18.9K", readTime: "9 min read" },
      { category: "Schemes", tagColor: "#D97706", title: "PM Schemes That Transfer Money Directly to You", desc: "DBT subsidies and grants — a complete list of what you're eligible to claim.", slug: "pm-schemes-direct-benefit", views: "42.1K", readTime: "7 min read" }
    ];
  }

  return (
    <div className="min-h-screen bg-[var(--surface-gray)]">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden text-center py-[48px] px-[24px]" style={{background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))'}}>
        {/* Floating Blobs */}
        <div className="absolute top-[-50px] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none z-0" style={{background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'blobFloat 8s ease-in-out infinite alternate'}}></div>
        <div className="absolute bottom-[-50px] left-[10%] w-[200px] h-[200px] rounded-full pointer-events-none z-0" style={{background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'blobFloat 10s ease-in-out infinite alternate-reverse'}}></div>
        
        <div className="relative z-10 max-w-[800px] mx-auto">
          <h1 className="text-white text-[36px] font-[800] font-[var(--font-heading)] mb-[12px] tracking-tight">Money Guides & Financial Articles</h1>
          <p className="text-[#94A3B8] text-[16px] leading-relaxed max-w-[600px] mx-auto">
            Expert answers to India's most searched questions on loans, insurance, earning opportunities, and government schemes.
          </p>
        </div>
      </section>

      <ClientArticles articles={articles} />
    </div>
  );
}
