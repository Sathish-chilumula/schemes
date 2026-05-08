import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { SchemesClient } from '@/app/schemes/SchemesClient';
import { Metadata } from 'next';

// Removed: edge runtime blocks Supabase TCP connections (caused 503s)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Government News & Policy Updates ${new Date().getFullYear()} | SchemeAtlas`,
  description: 'Read the latest government news, cabinet decisions, policy changes, and economic updates across India. Stay informed about the decisions that affect citizens.',
  alternates: {
    canonical: 'https://schemeatlas.com/news',
  },
};

export default async function NewsPage() {
  let news: Scheme[] = [];

  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

    const { data, error } = await supabase
      .from('schemes')
      .select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url, state_code, state_codes, is_central')
      .eq('is_published', true)
      .in('category', ['news', 'policy', 'economy'])
      .order('discovered_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching news:', error.message);
    } else if (data) {
      news = data as Scheme[];
    }
  } catch (err) {
    console.error('Crash fetching news:', err);
  }

  return (
    <SchemesClient 
      initialSchemes={news} 
      title="Government News & Policy Updates" 
      subtitle={`${news.length} latest cabinet decisions, news, and policies`}
    />
  );
}
