import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import ClientArticles from './ClientArticles';
import { Navbar } from '@/components/Navbar';

// IMPORTANT: Must use runtime = 'edge' — site is hosted on Cloudflare Pages.
export const runtime = 'edge';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}): Promise<Metadata> {
  // ?category= filtered views are NOT independently indexable pages.
  if (searchParams.category) {
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: 'https://schemeatlas.com/articles' },
    };
  }
  return {
    title: "Money Guides & Financial Articles | SchemeAtlas",
    description: "Expert guides on loans, insurance, earning online and government schemes for Indians.",
    alternates: {
      canonical: 'https://schemeatlas.com/articles'
    }
  };
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const activeCategory = typeof searchParams.category === 'string'
    ? searchParams.category
    : 'All';

  // Fetch published articles from Supabase, caching for 1 hour
  const supabase = supabaseAdmin({ next: { revalidate: 3600 } });
  const { data: dbArticles, error } = await supabase
    .from('articles')
    .select('*, categories(name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  let displayArticles: any[] = [];

  const CATEGORY_COLOURS: Record<string, string> = {
    'Loans': '#1B5FA8',
    'Insurance': '#4527A0',
    'Earn Money': '#2D7A3A',
    'Schemes': '#FF6B00',
    'Investment': '#E65100',
    'Tax': '#C62828',
    'Guide': '#3B3BF9',
  };

  if (dbArticles && !error && dbArticles.length > 0) {
    displayArticles = dbArticles.map(a => ({
      category: a.categories?.name || 'Guide',
      tagColor: CATEGORY_COLOURS[a.categories?.name || 'Guide'] || '#3B3BF9',
      title: a.title,
      desc: a.excerpt || a.meta_description || '',
      slug: a.slug,
      views: "12.4K", // Mocked as before
      readTime: (a.meta?.readTime || "5") + " min read",
    }));
  } else {
    // Fallback if DB is empty
    displayArticles = [
      { category: "Earn Money", tagColor: "#2D7A3A", title: "15 Ways to Earn Money Online in India 2025", desc: "From PMKVY training to freelancing — practical earning paths for every Indian.", slug: "how-to-earn-money-online-legally-in-india-2026", views: "24.5K", readTime: "8 min read" },
    ];
  }

  return (
    <div className="min-h-screen bg-[var(--surface-gray)]">
      <Navbar variant="dark" />
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden text-center py-[48px] px-[24px]" style={{background: 'linear-gradient(135deg, var(--navy), var(--navy-mid))'}}>
        {/* Floating Blobs */}
        <div className="absolute top-[-50px] right-[10%] w-[250px] h-[250px] rounded-full pointer-events-none z-0" style={{background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'blobFloat 8s ease-in-out infinite alternate'}}></div>
        <div className="absolute bottom-[-50px] left-[10%] w-[200px] h-[200px] rounded-full pointer-events-none z-0" style={{background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', filter: 'blur(40px)', animation: 'blobFloat 10s ease-in-out infinite alternate-reverse'}}></div>
        
        <div className="relative z-10 max-w-[800px] mx-auto">
          <h1 className="text-white text-[36px] font-[800] font-[var(--font-heading)] mb-[12px] tracking-tight">Money Guides &amp; Financial Articles</h1>
          <p className="text-[#94A3B8] text-[16px] leading-relaxed max-w-[600px] mx-auto">
            Expert answers to India&apos;s most searched questions on loans, insurance, earning opportunities, and government schemes.
          </p>
        </div>
      </section>

      <ClientArticles articles={displayArticles} activeCategory={activeCategory} />
    </div>
  );
}

