import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { COUNTRIES } from '@/lib/config';
import * as fs from 'fs';
import * as path from 'path';

// Enable Incremental Static Regeneration (ISR)
// This tells Next.js to regenerate the sitemap in the background every hour,
// so search engines always get the latest schemes without needing a full site rebuild.
export const revalidate = 3600;
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
  
  try {
    const supabase = supabaseAdmin();
    const { data: schemes } = await supabase
      .from('schemes')
      .select('slug, updated_at, content_hi, content_local, local_language')
      .eq('is_published', true)
      .order('views', { ascending: false })
      .limit(45000); // Max sitemap limit is 50k

    if (schemes) {
      schemes.forEach(scheme => {
        const lastMod = scheme.updated_at ? new Date(scheme.updated_at) : new Date();
        const baseUrl = `${SITE_URL}/schemes/${scheme.slug}`;

        // IMPORTANT: Only submit the canonical English URL to the sitemap.
        // Do NOT submit ?lang=hi or ?lang=te variants as separate sitemap entries.
        // Those are duplicate pages — they share the same canonical tag pointing
        // back to baseUrl. Submitting them creates orphan pages and wastes crawl budget.
        // hreflang alternates live in the page <head>, not in the sitemap.
        dynamicRoutes.push({
          url: baseUrl,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch schemes for sitemap:', error);
  }

  // 4. Articles Section
  const articlesDir = path.join(process.cwd(), 'content/articles');
  const articleEntries: MetadataRoute.Sitemap = fs.existsSync(articlesDir)
    ? fs.readdirSync(articlesDir)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          url: `${SITE_URL}/articles/${f.replace('.json', '')}`,
          lastModified: new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.7,
        }))
    : [];

  return [...allStaticRoutes, ...dynamicRoutes, ...articleEntries];
}
