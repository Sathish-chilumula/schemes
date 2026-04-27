import { MetadataRoute } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { COUNTRIES } from '@/lib/config';

// Removed Edge Runtime to allow static generation during build
// export const runtime = 'edge';

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

        // Add primary page with multilingual alternates
        const alternates: any = {
          en: baseUrl,
          hi: `${baseUrl}?lang=hi`,
        };

        if (scheme.local_language && scheme.local_language !== 'hi' && scheme.local_language !== 'en') {
          alternates[scheme.local_language] = `${baseUrl}?lang=${scheme.local_language}`;
        }

        dynamicRoutes.push({
          url: baseUrl,
          lastModified: lastMod,
          changeFrequency: 'weekly',
          priority: 0.7,
          // alternates: { languages: alternates } // Next.js 14.2+ support
        });

        // Also index translation URLs directly to ensure they are crawled
        if (scheme.content_hi) {
          dynamicRoutes.push({
            url: `${baseUrl}?lang=hi`,
            lastModified: lastMod,
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }

        if (scheme.content_local && scheme.local_language && scheme.local_language !== 'hi') {
          dynamicRoutes.push({
            url: `${baseUrl}?lang=${scheme.local_language}`,
            lastModified: lastMod,
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      });
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch schemes for sitemap:', error);
  }

  return [...allStaticRoutes, ...dynamicRoutes];
}
