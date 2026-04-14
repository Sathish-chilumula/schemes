import { supabaseAdmin } from '@/lib/supabase';
import { HomeClient } from './HomeClient';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'SchemeAtlas | Find Government Benefits Instantly',
  description: 'Instantly find government benefits, schemes, and financial aid you qualify for. Use our free AI eligibility checker across thousands of schemes.',
  alternates: {
    canonical: 'https://schemeatlas.com',
  },
};

export default async function HomePage() {
  let stats = { schemes: 1050, checked: 5840 };
  let trendingSchemes: any[] = [];
  let latestSchemes: any[] = [];

  try {
    const supabase = supabaseAdmin();
    
    const [
      { count: schemeCount, error: err1 }, 
      { count: checkedCount, error: err2 },
      { data: trending, error: err3 },
      { data: latest, error: err4 }
    ] = await Promise.all([
      supabase.from('schemes').select('*', { count: 'exact', head: true }).eq('is_published', true),
      supabase.from('eligibility_results').select('*', { count: 'exact', head: true }),
      supabase.from('schemes').select('*').eq('is_published', true).eq('country_code', 'IN').order('views', { ascending: false }).limit(3),
      supabase.from('schemes').select('*').eq('is_published', true).eq('country_code', 'IN').order('discovered_at', { ascending: false }).limit(3)
    ]);

    if (!err1) stats.schemes = schemeCount || 1050;
    if (!err2) stats.checked = checkedCount ? checkedCount + 5000 : 5000;
    if (!err3 && trending) trendingSchemes = trending;
    if (!err4 && latest) latestSchemes = latest;

  } catch (err) {
    console.error('Failed to fetch homepage data:', err);
    // Continue with defaults to prevent 500 crash
  }

  return (
    <HomeClient 
      stats={stats} 
      trendingSchemes={trendingSchemes} 
      latestSchemes={latestSchemes} 
    />
  );
}
