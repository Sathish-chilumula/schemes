import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { JobsClient } from './JobsClient';
import { Metadata } from 'next';


export const metadata: Metadata = {
  title: `Government Job Recruitment ${new Date().getFullYear()} — Latest Vacancies & Notifications | SchemeAtlas`,
  description: 'Find the latest government job notifications, vacancies, and recruitment updates across India. SSC, UPSC, Railways, and State Departments. Updated daily for 2026.',
  alternates: {
    canonical: 'https://schemeatlas.com/jobs',
  },
};

export default async function JobsPage() {
  const supabase = supabaseAdmin({ next: { revalidate: 3600 } });

  const { data: jobs } = await supabase
    .from('schemes')
    .select('id, name, slug, what_you_get, eligibility')
    .eq('is_published', true)
    .eq('category', 'job')
    .order('discovered_at', { ascending: false });

  return <JobsClient initialJobs={jobs || []} />;
}
