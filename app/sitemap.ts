import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { COUNTRIES } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://schemeatlas.vercel.app';
  
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

  // 2. Country Index Pages
  const countryPaths = Object.keys(COUNTRIES).flatMap(code => [
    `/${code}`,
    `/${code}/check`
  ]);

  const allStaticRoutes = [...staticPaths, ...countryPaths].map(route => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : (route.includes('/check') ? 0.9 : 0.8),
  }));

  // 3. Dynamic Scheme Pages
  // Fetch up to 5000 schemes for the sitemap since Cloudflare Pages limits execution time
  const { data: schemes } = await supabaseAdmin()
    .from('schemes')
    .select('slug, discovered_at')
    .eq('is_published', true)
    .order('discovered_at', { ascending: false })
    .limit(5000);

  const dynamicRoutes = (schemes || []).map(scheme => ({
    url: `${SITE_URL}/schemes/${scheme.slug}`,
    lastModified: scheme.discovered_at ? new Date(scheme.discovered_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...allStaticRoutes, ...dynamicRoutes];
}
