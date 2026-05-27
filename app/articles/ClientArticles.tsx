"use client";

import { useState } from 'react';
import Link from 'next/link';

const TABS = ["All", "Loans", "Insurance", "Earn Money", "Schemes", "Investment", "Tax"];

const CATEGORY_COLOURS: Record<string, string> = {
  'Loans': '#1B5FA8',
  'Insurance': '#4527A0',
  'Earn Money': '#2D7A3A',
  'Schemes': '#FF6B00',
  'Investment': '#E65100',
  'Tax': '#C62828',
  'Guide': '#3B3BF9',
};

function ArticleList({ articles, activeCategory }: { articles: any[]; activeCategory: string }) {
  const [search, setSearch] = useState('');

  const activeTab = activeCategory;

  // Category counts
  const categoryCounts: Record<string, number> = { All: articles.length };
  articles.forEach((a) => {
    if (a.category) {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
    }
  });

  const filteredArticles = articles
    .filter((a) => activeTab === 'All' || a.category?.toLowerCase() === activeTab.toLowerCase())
    .filter((a) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (a.title || '').toLowerCase().includes(q) ||
        (a.desc || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q)
      );
    });

  return (
    <>
      {/* ── SEARCH BAR ── */}
      <section className="bg-white border-b border-[var(--border)] px-[24px] pt-[24px] pb-[20px]">
        <div className="max-w-[1200px] mx-auto">
          <div
            className="flex items-center gap-[12px] rounded-[var(--radius-md)] px-[16px] py-[12px] border border-[var(--border)] bg-[var(--surface-gray)] max-w-[600px]"
            style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides (e.g. home loan, term insurance, PM Kisan...)"
              className="bg-transparent outline-none flex-1 text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)]"
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ color: 'var(--text-faint)', fontSize: 18, lineHeight: 1, cursor: 'pointer' }}>×</button>
            )}
          </div>
        </div>
      </section>

      {/* ── FILTER TABS with counts ── */}
      <section className="bg-white border-b border-[var(--border)] px-[24px]">
        <div className="max-w-[1200px] mx-auto py-[16px] flex gap-[10px] overflow-x-auto no-scrollbar items-center">
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            const count = categoryCounts[tab] || 0;
            const catColor = CATEGORY_COLOURS[tab] || '#3B3BF9';
            return (
              <Link
                key={tab}
                href={tab === 'All' ? '/articles' : `/articles?category=${encodeURIComponent(tab)}`}
                className="whitespace-nowrap px-[16px] py-[7px] rounded-[20px] text-[13px] font-[700] transition-all duration-200 border-none cursor-pointer flex items-center gap-[6px]"
                style={
                  isActive
                    ? { background: catColor, color: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }
                    : { background: `${catColor}14`, color: catColor }
                }
              >
                {tab}
                {tab !== 'All' && count > 0 && (
                  <span
                    className="text-[10px] font-[800] px-[6px] py-[1px] rounded-[10px]"
                    style={isActive ? { background: 'rgba(255,255,255,0.25)', color: 'white' } : { background: `${catColor}28`, color: catColor }}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── RESULTS COUNT ── */}
      {search && (
        <div className="max-w-[1200px] mx-auto px-[24px] pt-[20px]">
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {filteredArticles.length} result{filteredArticles.length !== 1 ? 's' : ''} for "<strong>{search}</strong>"
          </p>
        </div>
      )}

      {/* ── CARDS GRID 3-column ── */}
      <section className="max-w-[1200px] mx-auto py-[32px] px-[24px] pb-[64px]">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-muted)]">
            <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No guides found</p>
            <p style={{ fontSize: 14 }}>Try a different search term or browse all categories.</p>
            <button
              onClick={() => setSearch('')}
              className="btn-outline mt-6"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
            {filteredArticles.map((article, i) => {
              const catColor = CATEGORY_COLOURS[article.category] || '#3B3BF9';
              const title = article.title || 'Untitled Article';
              const desc = article.desc || article.metaDescription || '';
              const readTime = article.readTime || article.time || '5 min read';
              const href = `/articles/${article.slug}`;
              const publishDate = article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : null;

              return (
                <Link
                  key={i}
                  href={href}
                  className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden cursor-pointer card-animate group block hover:shadow-[var(--shadow-sm)] hover:-translate-y-[2px] transition-all duration-300 cat-border-card"
                  style={{
                    borderLeftColor: catColor,
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  {/* Category colour strip at top */}
                  <div style={{ height: 5, background: catColor }} />

                  <div className="p-[20px]">
                    {/* Category badge */}
                    <span
                      className="text-[11px] font-[700] px-[10px] py-[4px] rounded-[20px] inline-block mb-[10px]"
                      style={{ background: `${catColor}18`, color: catColor }}
                    >
                      {article.category || 'Guide'}
                    </span>

                    {/* Title */}
                    <h3
                      className="text-[16px] font-[700] mb-[8px] leading-[1.4] line-clamp-2 transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {title}
                    </h3>

                    {/* Excerpt */}
                    <p
                      className="text-[13px] leading-[1.65] line-clamp-2 mb-[16px]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {typeof desc === 'string' ? desc : ''}
                    </p>

                    {/* Meta row */}
                    <div
                      className="flex justify-between items-center"
                      style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 12, color: 'var(--text-faint)' }}
                    >
                      <span>SchemeAtlas Editorial {publishDate ? `· ${publishDate}` : ''}</span>
                      <span style={{ color: catColor, fontWeight: 700 }}>⏱ {readTime}</span>
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

export default function ClientArticles({ articles, activeCategory }: { articles: any[]; activeCategory: string }) {
  return <ArticleList articles={articles} activeCategory={activeCategory} />;
}
