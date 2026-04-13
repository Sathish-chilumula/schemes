import { supabaseAdmin } from '@/lib/supabase';
import { HomeClient } from './HomeClient';
import { Metadata } from 'next';

export const revalidate = 86400; // ISR: revalidate every 24 hours
export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'SchemeAtlas | Find Government Benefits Instantly',
  description: 'Instantly find government benefits, schemes, and financial aid you qualify for. Use our free AI eligibility checker across thousands of schemes.',
  alternates: {
    canonical: 'https://schemeatlas.com',
  },
};

export default async function HomePage() {
  const supabase = supabaseAdmin();
  
  const [
    { count: schemeCount }, 
    { count: checkedCount },
    { data: trendingSchemes },
    { data: latestSchemes }
  ] = await Promise.all([
    supabase.from('schemes').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('eligibility_results').select('*', { count: 'exact', head: true }),
    supabase.from('schemes').select('*').eq('is_published', true).eq('country_code', 'IN').order('views', { ascending: false }).limit(3),
    supabase.from('schemes').select('*').eq('is_published', true).eq('country_code', 'IN').order('discovered_at', { ascending: false }).limit(3)
  ]);

  const stats = {
    schemes: schemeCount || 1050,
    checked: checkedCount ? checkedCount + 5000 : 5000
  };

  return (
    <HomeClient 
      stats={stats} 
      trendingSchemes={trendingSchemes || []} 
      latestSchemes={latestSchemes || []} 
    />
  );
}
