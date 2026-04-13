import { supabaseAdmin, type Scheme } from '@/lib/supabase';
import { JobsClient } from './JobsClient';
import { Metadata } from 'next';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata: Metadata = {
  title: 'Government Job Recruitment 2025-26 | Latest Vacancies & Notifications',
  description: 'Find the latest government job notifications, vacancies, and recruitment updates across SSC, UPSC, Railways, and State Departments. Apply for the latest govt jobs today.',
  alternates: {
    canonical: 'https://schemeatlas.com/jobs',
  },
};

export default async function JobsPage() {
  const supabase = supabaseAdmin();
  const { data: jobs } = await supabase
    .from('schemes')
    .select('*')
    .eq('is_published', true)
    .eq('category', 'job')
    .order('discovered_at', { ascending: false });

  return <JobsClient initialJobs={jobs || []} />;
}
