import articlesIndex from '@/content/articles-index.json';
import Link from 'next/link';

interface Props {
  category: string;
  schemeTitle: string;
}

export function RelatedArticlesBlock({ category, schemeTitle }: Props) {
  const catLower = category.toLowerCase();
  
  // Try to find real articles from the index that match the category
  const findRelated = () => {
    const matched = (articlesIndex as any[]).filter(a => 
      a.category?.toLowerCase().includes(catLower) || 
      catLower.includes(a.category?.toLowerCase())
    ).slice(0, 2);

    if (matched.length >= 2) return matched.map(m => ({ title: m.title, href: `/articles/${m.slug}` }));
    
    // Fallback suggestions pointing to category searches to avoid 404s
    return [
      { title: `All ${category} Guides & Tips`, href: `/articles?category=${encodeURIComponent(category)}` },
      { title: "Top Money Saving & Earning Guides", href: "/articles" }
    ];
  };

  const suggestions = findRelated();

  return (
    <div className="mt-[40px] bg-[var(--indigo-light)] rounded-[var(--radius-md)] p-[24px]">
      <h3 className="font-[700] text-[16px] text-[var(--text-primary)] mb-[16px]">📖 Helpful Guides Related to This Scheme</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
        {suggestions.map((article, i) => (
          <Link 
            key={i} 
            href={article.href}
            className="bg-white border border-[var(--border)] rounded-[var(--radius-sm)] p-[14px] hover:-translate-y-[2px] transition-transform shadow-sm flex flex-col justify-between h-full"
          >
            <div className="text-[13px] font-[600] text-[var(--text-primary)] mb-[8px] leading-[1.4] line-clamp-2">
              {article.title}
            </div>
            <div className="text-[var(--indigo)] text-[12px] font-[700] mt-auto">
              Read Guide →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
