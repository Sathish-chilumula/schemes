import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { COUNTRIES } from '@/lib/config';

// Enable Incremental Static Regeneration (ISR)
// This tells Next.js to regenerate the sitemap in the background every hour,
// so search engines always get the latest schemes without needing a full site rebuild.
export const revalidate = 3600;
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.com';
  
  // 1. Static Pages — exclude /admin (should never be indexed) and /signup
  const staticPaths = [
    '',
    '/schemes',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/disclaimer',
  ];

  // 2. Country & State Index Pages
  const _countryPaths = Object.keys(COUNTRIES).flatMap(code => [
    `/${code.toLowerCase()}`,
    `/${code.toLowerCase()}/check`
  ]);

  const statePaths = COUNTRIES['IN']?.states?.map(state => 
    `/in/${state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  ) || [];

  const countryPaths = [..._countryPaths, ...statePaths];

  const allStaticRoutes: MetadataRoute.Sitemap = [...staticPaths, ...countryPaths].map(route => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : (route.includes('/check') ? 0.9 : 0.8),
  }));

  // 3. Dynamic Scheme Pages
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  let hasMore = true;
  
  try {
    const supabase = supabaseAdmin();
    while (hasMore) {
      const { data: schemes, error } = await supabase
        .from('schemes')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('views', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        console.warn('⚠️ Supabase error in sitemap:', error.message);
        break;
      }

      if (schemes && schemes.length > 0) {
        schemes.forEach(scheme => {
          const lastMod = scheme.updated_at ? new Date(scheme.updated_at) : new Date();
          const baseUrl = `${SITE_URL}/schemes/${scheme.slug}`;

          // IMPORTANT: Only submit the canonical English URL to the sitemap.
          dynamicRoutes.push({
            url: baseUrl,
            lastModified: lastMod,
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        });

        if (schemes.length < PAGE_SIZE) {
          hasMore = false;
        } else {
          offset += PAGE_SIZE;
        }
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch schemes for sitemap:', error);
  }

  // 4. Articles Section
  let articleEntries: MetadataRoute.Sitemap = [];
  try {
    // Import using require for dynamic behavior or just import at top.
    // Here we use the pre-generated index to avoid 'fs' which fails on Edge.
    const articlesIndex = require('@/content/articles-index.json');
    articleEntries = articlesIndex.map((article: any) => ({
      url: `${SITE_URL}/articles/${article.slug}`,
      lastModified: new Date(article.updatedAt || new Date()),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch (err) {
    console.warn('⚠️ Could not load articles-index.json for sitemap');
  }

  return [...allStaticRoutes, ...dynamicRoutes, ...articleEntries];
}
