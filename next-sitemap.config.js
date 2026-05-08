module.exports = {
  siteUrl: 'https://schemeatlas.com',
  generateRobotsTxt: false, // We manage public/robots.txt manually — do not overwrite
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  exclude: [
    '/saved',
    '/admin',
    '/signup',
    '/diag',
    '/IN/check',
    '/GB/check',
    '/US/check',
    '/NG/check',
    '/KE/check',
    '/*?lang=*',   // Never index ?lang= variants — they are duplicates
    '/*?category=*', // Category filter params — not indexable standalone pages
  ],
  additionalPaths: async (config) => {
    require('dotenv').config({ path: '.env.local' });
    require('dotenv').config({ path: '.env' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️ Missing Supabase config. Skipping dynamic sitemap generation.');
      return [];
    }

    // dynamically fetch all slugs
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: schemes } = await supabase
      .from('schemes')
      .select('slug, last_updated')
      .eq('is_published', true);
    
    return schemes?.map((scheme) => ({
      loc: `/schemes/${scheme.slug}`,
      lastmod: scheme.last_updated || new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    })) ?? [];
  },
  // robots.txt is managed manually at public/robots.txt
};
