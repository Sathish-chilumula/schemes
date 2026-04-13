import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { SchemesClient } from './SchemesClient';
import { Metadata } from 'next';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'All Government Schemes 2025 | SchemeAtlas',
  description: 'Browse hundreds of active government schemes, financial aid, and welfare programs across multiple countries. Find benefits by category or country.',
  alternates: {
    canonical: 'https://schemeatlas.com/schemes',
  },
};

export default async function SchemesPage() {
  const supabase = supabaseAdmin();
  const { data: schemes } = await supabase
    .from('schemes')
    .select('*')
    .eq('is_published', true)
    .order('discovered_at', { ascending: false });

  return <SchemesClient initialSchemes={schemes || []} />;
}
