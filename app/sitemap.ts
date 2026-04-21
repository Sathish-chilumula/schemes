import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { COUNTRIES } from '@/lib/config';

// Edge Runtime — sitemap is generated fresh on every crawl request.
// Without this it is baked at build time, hiding new scheme URLs from Google.
export const runtime = 'edge';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.com';
  
  // 1. Static Pages
  const staticPaths = [
    '',
    '/schemes',
    '/saved',
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

  const statePaths = COUNTRIES['IN']?.states?.map(state => `/in/${state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`) || [];

  const countryPaths = [..._countryPaths, ...statePaths];

  const allStaticRoutes = [...staticPaths, ...countryPaths].map(route => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : (route.includes('/check') ? 0.9 : 0.8),
  }));

  // 3. Dynamic Scheme Pages
  // Skip dynamic routes if Supabase env vars are not configured (e.g. during CI builds)
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { data: schemes } = await supabaseAdmin()
        .from('schemes')
        .select('slug, discovered_at, content_hi, content_local, local_language')
        .eq('is_published', true)
        .order('discovered_at', { ascending: false })
        .limit(20000); // Sitemaps can handle up to 50k URLs

      const dynamicRows: MetadataRoute.Sitemap = [];

      for (const scheme of (schemes || [])) {
        const lastMod = scheme.discovered_at ? new Date(scheme.discovered_at) : new Date();

        // 1. Primary English URL
        dynamicRows.push({
          url: `${SITE_URL}/schemes/${scheme.slug}`,
          lastModified: lastMod,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        });

        // 2. Hindi Translation URL (if exists)
        if (scheme.content_hi) {
          dynamicRows.push({
            url: `${SITE_URL}/schemes/${scheme.slug}?lang=hi`,
            lastModified: lastMod,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          });
        }

        // 3. Local Language Translation URL (if exists)
        if (scheme.content_local && scheme.local_language && scheme.local_language !== 'hi' && scheme.local_language !== 'en') {
          dynamicRows.push({
            url: `${SITE_URL}/schemes/${scheme.slug}?lang=${scheme.local_language}`,
            lastModified: lastMod,
            changeFrequency: 'weekly' as const,
            priority: 0.6,
          });
        }
      }
      dynamicRoutes = dynamicRows;
    } catch (error) {
      console.warn('⚠️ Failed to fetch schemes for sitemap:', error);
    }
  } else {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL not set. Skipping dynamic sitemap generation.');
  }

  return [...allStaticRoutes, ...dynamicRoutes];
}
