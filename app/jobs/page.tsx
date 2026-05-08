import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { SchemesClient } from '@/app/schemes/SchemesClient';
import { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `Latest Government Jobs & Recruitment ${new Date().getFullYear()} | SchemeAtlas`,
  description: 'Find the latest government job vacancies, recruitment notifications, and exam updates across India. Stay updated with the newest career opportunities in the public sector.',
  alternates: {
    canonical: 'https://schemeatlas.com/jobs',
  },
};

export default async function JobsPage() {
  let jobs: Scheme[] = [];

  try {
    const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

    const { data, error } = await supabase
      .from('schemes')
      .select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url, state_code, state_codes, is_central')
      .eq('is_published', true)
      .eq('category', 'job')
      .order('discovered_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching jobs:', error.message);
    } else if (data) {
      jobs = data as Scheme[];
    }
  } catch (err) {
    console.error('Crash fetching jobs:', err);
  }

  return (
    <SchemesClient 
      initialSchemes={jobs} 
      title="Latest Government Jobs" 
      subtitle={`${jobs.length} open recruitment notifications and updates`}
    />
  );
}
