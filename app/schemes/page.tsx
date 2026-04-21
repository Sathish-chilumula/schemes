import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { SchemesClient } from './SchemesClient';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'All Government Schemes 2025 | SchemeAtlas',
  description: 'Browse hundreds of active government schemes, financial aid, and welfare programs across multiple countries. Find benefits by category or country.',
  alternates: {
    canonical: 'https://schemeatlas.com/schemes',
  },
};

export default async function SchemesPage() {
  let schemes: Scheme[] = [];

  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

    const { data, error } = await supabase
      .from('schemes')
      .select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url, state_code, state_codes, is_central')
      .eq('is_published', true)
      .order('discovered_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching schemes:', error.message);
    } else if (data) {
      schemes = data as Scheme[];
    }
  } catch (err) {
    console.error('Crash fetching schemes:', err);
  }

  return <SchemesClient initialSchemes={schemes} />;
}
