import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { COUNTRIES } from '@/lib/config';

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
        .select('slug, discovered_at')
        .eq('is_published', true)
        .order('discovered_at', { ascending: false })
        .limit(5000);

      dynamicRoutes = (schemes || []).map(scheme => ({
        url: `${SITE_URL}/schemes/${scheme.slug}`,
        lastModified: scheme.discovered_at ? new Date(scheme.discovered_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    } catch (error) {
      console.warn('⚠️ Failed to fetch schemes for sitemap:', error);
    }
  } else {
    console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL not set. Skipping dynamic sitemap generation.');
  }

  return [...allStaticRoutes, ...dynamicRoutes];
}
