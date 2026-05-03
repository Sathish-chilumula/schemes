"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

const TABS = ["All", "Loans", "Insurance", "Earn Money", "Schemes", "Investment", "Tax"];

function ArticleList({ articles }: { articles: any[] }) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('category') || "All";

  const filteredArticles = activeTab === "All" 
    ? articles 
    : articles.filter(a => a.category?.toLowerCase() === activeTab.toLowerCase());

  return (
    <>
      {/* ── FILTER TABS ── */}
      <section className="bg-white border-b border-[var(--border)] px-[24px]">
        <div className="max-w-[1200px] mx-auto py-[24px] flex gap-[12px] overflow-x-auto no-scrollbar items-center">
          {TABS.map(tab => {
            const isActive = tab === activeTab;
            return (
              <Link 
                key={tab} 
                href={tab === "All" ? "/articles" : `/articles?category=${encodeURIComponent(tab)}`}
                className={`whitespace-nowrap px-[18px] py-[8px] rounded-[20px] text-[13px] font-[700] transition-all duration-200 border-none cursor-pointer
                  ${isActive ? 'bg-[var(--indigo)] text-white shadow-sm' : 'bg-[var(--indigo-light)] text-[var(--indigo)] hover:bg-[#E0E7FF]'}`
                }
              >
                {tab}
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── CARDS GRID ── */}
      <section className="max-w-[1200px] mx-auto py-[32px] px-[24px] pb-[64px]">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <p>No articles found for category "{activeTab}".</p>
            <Link href="/articles" className="text-[var(--indigo)] font-semibold mt-4 inline-block">Clear filters</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[24px]">
            {filteredArticles.map((article, i) => {
              const tagColor = article.tagColor || "#2563EB";
              const title = article.title || "Untitled Article";
              const desc = article.desc || article.metaDescription || article.intro || "";
              const views = article.views || "New";
              const readTime = article.readTime || "5 min read";
              const href = `/articles/${article.slug}`;

              return (
                <Link key={i} href={href} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-[22px] cursor-pointer card-animate relative overflow-hidden group block hover:shadow-[var(--shadow-sm)] hover:-translate-y-[2px] hover:border-[var(--indigo)] transition-all duration-300" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.8)] to-transparent -translate-x-[150%] skew-x-[-20deg] group-hover:animate-shine z-10 pointer-events-none"></div>
                  
                  <div className="relative z-20">
                    <span style={{ backgroundColor: `${tagColor}18`, color: tagColor }} className="text-[11px] font-[700] px-[10px] py-[4px] rounded-[20px] inline-block mb-[10px]">
                      {article.category || "Guide"}
                    </span>
                    <h3 className="text-[16px] font-[700] my-[10px] leading-[1.4] text-[var(--text-primary)] group-hover:text-[var(--indigo)] transition-colors line-clamp-2">{title}</h3>
                    <p className="text-[13px] text-[var(--text-muted)] leading-[1.6] mb-[16px] line-clamp-3">{desc}</p>
                    
                    <div className="border-t border-[#F3F4F6] pt-[12px] flex justify-between text-[12px] text-[var(--text-faint)] mt-auto">
                      <span>👀 {views}</span>
                      <span>⏱️ {readTime}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default function ClientArticles({ articles }: { articles: any[] }) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[var(--text-muted)]">Loading articles...</div>}>
      <ArticleList articles={articles} />
    </Suspense>
  );
}
