import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { NewsClient } from './NewsClient';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Government Decisions & Civic News 2026 | Daily Updates',
  description: 'Stay updated with the latest government decisions, cabinet approvals, policy changes, and important civic announcements for Aadhaar, PAN, and more.',
  alternates: {
    canonical: 'https://schemeatlas.com/news',
  },
};

export default async function NewsPage() {
  const supabase = supabaseAdmin();
  const { data: news } = await supabase
    .from('schemes')
    .select('id, name, slug, category, discovered_at, content_en')
    .eq('is_published', true)
    .in('category', ['news', 'alert', 'budget', 'decision'])
    .order('discovered_at', { ascending: false });

  return <NewsClient initialNews={news || []} />;
}
