import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { FAQAccordion } from '@/components/FAQAccordion';
import { Navbar } from '@/components/Navbar';

// Do NOT use runtime = 'edge' here because we need fs
export const dynamicParams = false;

export async function generateStaticParams() {
  const articlesDir = path.join(process.cwd(), 'content/articles');
  if (!fs.existsSync(articlesDir)) {
    return [{ slug: 'placeholder-guide' }];
  }
  const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    return [{ slug: 'placeholder-guide' }];
  }
  return files.map(file => ({
    slug: file.replace('.json', '')
  }));
}

async function getArticle(slug: string) {
  const filePath = path.join(process.cwd(), `content/articles/${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return {};

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription,
    alternates: {
      canonical: `https://schemeatlas.com/articles/${params.slug}`
    },
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription,
      type: 'article',
      publishedTime: article.publishedAt,
      url: `https://schemeatlas.com/articles/${params.slug}`,
    }
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) {
    notFound();
  }

  // Schema generation
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.metaTitle || article.title,
    "description": article.metaDescription,
    "datePublished": article.publishedAt,
    "dateModified": article.updatedAt || article.publishedAt,
    "author": {
      "@type": "Organization",
      "name": "SchemeAtlas"
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://schemeatlas.com" },
      { "@type": "ListItem", "position": 2, "name": "Money Guides", "item": "https://schemeatlas.com/articles" },
      { "@type": "ListItem", "position": 3, "name": article.category || "Guide", "item": `https://schemeatlas.com/articles?category=${encodeURIComponent(article.category || '')}` },
      { "@type": "ListItem", "position": 4, "name": article.title, "item": `https://schemeatlas.com/articles/${params.slug}` }
    ]
  };

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-[1200px] mx-auto px-[24px] py-[40px]">
        {/* Language Switcher */}
        <div className="flex gap-3 mb-8 border-b border-slate-100 pb-4 overflow-x-auto no-scrollbar">
          {[
            { label: 'English', suffix: '', flag: '🇺🇸' },
            { label: 'हिन्दी', suffix: '-hi', flag: '🇮🇳' },
            { label: 'తెలుగు', suffix: '-te', flag: '🇮🇳' }
          ].map((lang) => {
            const baseSlug = params.slug.replace(/-(hi|te)$/, '');
            const targetSlug = lang.suffix ? `${baseSlug}${lang.suffix}` : baseSlug;
            const isActive = (lang.suffix === '' && !params.slug.endsWith('-hi') && !params.slug.endsWith('-te')) || 
                             (lang.suffix !== '' && params.slug.endsWith(lang.suffix));
            
            // We check if the file exists to show the button
            const filePath = path.join(process.cwd(), `content/articles/${targetSlug}.json`);
            if (!fs.existsSync(filePath)) return null;

            return (
              <Link 
                key={lang.label}
                href={`/articles/${targetSlug}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                <span>{lang.flag}</span>
                {lang.label}
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-[48px] items-start">
          
          {/* ── ARTICLE COLUMN (LEFT) ── */}
          <article>
            {/* Breadcrumb */}
            <div className="text-[13px] text-[var(--text-faint)] mb-[16px] flex items-center flex-wrap">
              <Link href="/" className="hover:text-[var(--indigo)] transition-colors">Home</Link>
              <span className="px-[6px]">›</span>
              <Link href="/articles" className="hover:text-[var(--indigo)] transition-colors">Money Guides</Link>
              <span className="px-[6px]">›</span>
              <Link href={`/articles?category=${encodeURIComponent(article.category || '')}`} className="hover:text-[var(--indigo)] transition-colors">{article.category || "Guide"}</Link>
              <span className="px-[6px]">›</span>
              <span className="text-[var(--text-muted)] font-[500] truncate max-w-[200px] sm:max-w-none">{article.title}</span>
            </div>

            {/* Hero Image */}
            {article.imageUrl && (
              <div className="relative w-full aspect-video rounded-[var(--radius-md)] overflow-hidden mb-[24px] border border-[var(--border)]">
                <img 
                  src={article.imageUrl} 
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}

            {/* Category Pill & Date */}
            <div className="flex items-center gap-[12px] mb-[16px]">
              <span className="bg-[#E0E7FF] text-[#4338CA] text-[11px] font-[700] px-[10px] py-[4px] rounded-[20px]">
                {article.category || "Guide"}
              </span>
              <span className="text-[13px] text-[var(--text-muted)]">
                Updated: {new Date(article.updatedAt || article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-[clamp(24px,4vw,38px)] font-[800] font-[var(--font-heading)] leading-[1.2] mb-[20px] text-[var(--text-primary)]">
              {article.title}
            </h1>

            {/* Meta Bar */}
            <div className="border-y border-[var(--border)] py-[14px] mb-[28px] flex gap-[20px] text-[13px] text-[var(--text-faint)]">
              <div className="flex items-center gap-[6px]">
                <span>⏱️</span> {article.readTime || '5 min read'}
              </div>
              {article.wordCount && (
                <div className="flex items-center gap-[6px]">
                  <span>📝</span> {article.wordCount} words
                </div>
              )}
            </div>

            {/* Intro */}
            {article.intro && (
              <p className="text-[16px] leading-[1.75] text-[var(--text-primary)] font-[500] mb-[32px]">
                {typeof article.intro === 'string' ? article.intro : (article.intro as any)?.content || (article.intro as any)?.text || ''}
              </p>
            )}

            {/* Table of Contents */}
            {article.tableOfContents && article.tableOfContents.length > 0 && (
              <div className="bg-[var(--indigo-light)] rounded-[var(--radius-md)] p-[20px_24px] mb-[32px]">
                <div className="font-[700] text-[14px] mb-[12px] text-[var(--text-primary)]">📋 In This Article</div>
                <ol className="list-decimal pl-[20px] text-[14px] text-[var(--indigo)] leading-[2]">
                  {article.tableOfContents.map((h: any, i: number) => {
                    const label = typeof h === 'string' ? h : (h?.heading || h?.title || `Section ${i + 1}`);
                    return (
                      <li key={i}>
                        <a href={`#section-${i}`} className="hover:underline">{label.replace(/<[^>]*>?/gm, '')}</a>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            {/* Sections */}
            <div className="prose max-w-none mb-[48px]">
              {article.sections?.map((section: any, i: number) => {
                const heading = typeof section.heading === 'string' ? section.heading : String(section.heading || '');
                const content = typeof section.content === 'string' ? section.content : String(section.content || '');
                return (
                  <div key={i} id={`section-${i}`}>
                    <h2 className="text-[22px] font-[700] m-[40px_0_14px] pb-[10px] border-b-2 border-[var(--indigo-light)] text-[var(--text-primary)]" dangerouslySetInnerHTML={{ __html: heading }}></h2>
                    <div className="text-[15px] leading-[1.85] text-[var(--text-primary)] space-y-4" dangerouslySetInnerHTML={{ __html: content }}></div>
                  </div>
                );
              })}
            </div>

            {/* FAQs */}
            {article.faqs && article.faqs.length > 0 && (
              <div className="mt-[48px]">
                <h2 className="text-[24px] font-[800] text-[var(--text-primary)] tracking-tight mb-[24px]">Frequently Asked Questions</h2>
                <FAQAccordion faqs={article.faqs} />
              </div>
            )}

            {/* Related Schemes block */}
            {article.relatedSchemes && article.relatedSchemes.length > 0 && (
              <div className="bg-[var(--indigo-light)] rounded-[var(--radius-md)] p-[24px] mt-[40px]">
                <div className="font-[700] text-[16px] text-[var(--text-primary)] mb-[16px]">🏛️ Related Government Schemes</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                  {article.relatedSchemes.map((schemeSlug: string, i: number) => (
                    <Link key={i} href={`/schemes/${schemeSlug}`} className="bg-white border border-[var(--border)] rounded-[var(--radius-sm)] p-[14px] hover:-translate-y-[2px] transition-transform shadow-sm flex flex-col justify-between">
                      <div className="text-[13px] font-[600] text-[var(--text-primary)] mb-[8px] line-clamp-2">
                        {schemeSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </div>
                      <div className="text-[var(--indigo)] text-[12px] font-[700]">Check Details →</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* ── SIDEBAR (RIGHT) ── */}
          <aside className="lg:sticky lg:top-[80px] space-y-[20px]">
            {/* Card 1 — Eligibility CTA */}
            <div className="bg-gradient-to-br from-[var(--indigo)] to-[var(--indigo-mid)] rounded-[var(--radius-md)] p-[24px] text-white shadow-md">
              <h3 className="text-[16px] font-[700] mb-[4px]">Check Your Scheme Eligibility</h3>
              <p className="text-[13px] text-white/75 mb-[16px]">Free — takes under 2 minutes</p>
              <Link href="/in/check" className="bg-white text-[var(--indigo)] font-[700] py-[10px] px-[16px] rounded-[var(--radius-sm)] w-full block text-center hover:bg-gray-50 transition-colors">
                Check Now
              </Link>
            </div>

            {/* Card 2 — Related Articles */}
            {article.relatedArticles && article.relatedArticles.length > 0 && (
              <div className="bg-white border border-[var(--border)] p-[20px] rounded-[var(--radius-md)] shadow-sm">
                <h3 className="font-[700] text-[15px] mb-[14px] text-[var(--text-primary)]">📚 Related Guides</h3>
                <div className="space-y-[16px]">
                  {article.relatedArticles.map((rel: any, i: number) => {
                    const title = rel.title || (typeof rel === 'string' ? rel : 'Related Article');
                    const targetSlug = rel.slug || (typeof rel === 'string' ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '#');
                    return (
                    <Link key={i} href={`/articles/${targetSlug}`} className="block group">
                      <div className="text-[10px] font-[700] text-[var(--indigo)] mb-[4px] uppercase tracking-wide">Guide</div>
                      <div className="text-[13px] font-[600] text-[var(--text-primary)] group-hover:text-[var(--indigo)] transition-colors leading-[1.4]">
                        {title.split('-').join(' ')}
                      </div>
                    </Link>
                  )})}
                </div>
              </div>
            )}

            {/* Card 3 — Browse Schemes */}
            <div className="bg-white border border-[var(--border)] p-[20px] rounded-[var(--radius-md)] shadow-sm text-center">
              <h3 className="font-[600] text-[15px] mb-[16px] text-[var(--text-primary)]">Browse 1,815+ Government Schemes</h3>
              <Link href="/schemes" className="btn-outline w-full justify-center">
                View All Schemes
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
