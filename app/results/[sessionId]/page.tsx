import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { ResultsClient } from './ResultsClient';
import { Metadata } from 'next';

// Removed: edge runtime blocks Supabase TCP connections (caused 503s)


export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Your Personalized Eligibility Results | SchemeAtlas`,
    description: `View the specific government schemes you qualify for based on your profile for 2026.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ResultsPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;

  // Initial fetch on server to reduce client-side waiting
  // Note: If the AI is still processing, the client will handle the polling/loading
  const { data: profile } = await supabaseAdmin({ cache: 'no-store' })

    .from('user_profiles')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (!profile) {
    // If profile not found on server (sync delay), pass null to client
    // The client will handle polling via the session_id
    return <ResultsClient initialResults={[]} initialProfile={null} sessionId={sessionId} />;
  }

  // Get schemes and results
  const { data: results } = await supabaseAdmin({ cache: 'no-store' })

    .from('eligibility_results')
    .select('*')
    .eq('profile_id', profile.id);

  // We still need the schemes joins (just like in the API)
  const { data: schemes } = await supabaseAdmin({ cache: 'no-store' })

    .from('schemes')
    .select('id, name, slug, category, benefit_amount, official_url, what_you_get')
    .eq('country_code', profile.country_code)
    .eq('is_published', true);

  const enriched = (results || []).map((r: any) => {
    const scheme = (schemes || []).find(s => s.id === r.scheme_id);
    return {
      ...r,
      scheme_name: scheme?.name || '',
      scheme_slug: scheme?.slug || '',
      category: scheme?.category || '',
      benefit_amount: scheme?.benefit_amount || '',
      official_url: scheme?.official_url || '',
      what_you_get: scheme?.what_you_get || '',
    };
  });

  return (
    <ResultsClient 
      initialResults={enriched} 
      initialProfile={profile} 
      sessionId={sessionId} 
    />
  );
}


