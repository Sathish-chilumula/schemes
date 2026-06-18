import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function cleanDB() {
  console.log('Cleaning up off-topic content and duplicates...');
  
  const offTopicSlugs = [
    'no-official-scheme-name-mentioned-in-the-news-article-gb',
    'reducing-bureaucracy-and-burden-for-refugee-resettlemen-us',
    'rbi-fintech-rules-explained',
    'unknown-in',
    'displacement-resettlement-scheme-in',
    'wfp-kenya-country-brief-march-2025-ke',
    'aadhaar-pan-linking-new-banking-guidelines',
    'up-sports-jobs-opportunities-growth',
    'pradhan-mantri-pm-scheme-not-specified-but-22nd-installment--in',
    'supreme-court-judge-strength-increased',
    'sugarcane-frp-boost-farmers-benefit',
    'not-specified-in-the-news-item-in',
    'urdu-jobs-ministry-mohalla-market',
    'travel-hiring-fy27-outlook',
    'off-road-equipment-market-2033',
    'current-affairs-may-2026',
    'pennsylvania-primary-election',
    'pm-news-on-air-scheme-in',
    'when-does-welfare-win-votes-in-india-in',
    'apollo-q1-2026-earnings-call',
    'farmer-bridge-payments-us',
    'msp-in',
    'excesses-in-austerity',
    'kvue-news-links-explained-guide',
    'lokayukta-appointment-delay-high-court-warning',
    '12-billion-farmer-bridge-payments-us',
    'hl-uk-pensions-law-digest-gb',
    'weekly-wisdom-may-2026',
    'upsc-prelims-2026-answer-key',
    'scotch-whisky-india-fta-hopes-high',
    'bihar-police-csbc-constable-result-2026',
    'not-specifically-mentioned-in-the-news-in',
    'chicago-farmers-markets-2026',
    'adda247-layoffs-explained',
    'opportunities-indian-companies-uk',
    'suvendu-adhikari-cabinet-decisions',
    'bengal-cabinet-ministers-portfolios-list',
    'trump-financial-reset-alert',
    'akhilesh-yadav-reservations-bjp-news',
    'bt-cotton-india-failure',
    'arunachal-pradesh-policy-changes',
    'vd-satheesan-kerala-chief-minister',
    'divyang-shakti-scheme-in',
    'hyderabad-tech-boom-ai-data-jobs',
    'tamil-nadu-cabinet-expansion',
    'not-specified-in-the-news-article-in',
    'not-specified-in-given-news-in'
  ];

  for (const slug of offTopicSlugs) {
    const { error } = await supabase.from('schemes').delete().eq('slug', slug);
    if (error) {
      console.error(`Failed to delete ${slug}:`, error.message);
    } else {
      console.log(`Deleted off-topic: ${slug}`);
    }
  }

  // Handle Duplicates
  const updates = [
    { target: '-snap-supplemental-nutrition-assistance-program-us', canonical: 'snap-supplemental-nutrition-assistance-program-us' },
    { target: 'snap-food-assistance-usa', canonical: 'snap-food-assistance-us' }
  ];

  for (const u of updates) {
    const { error } = await supabase.from('schemes').update({ canonical_slug: u.canonical, is_published: false }).eq('slug', u.target);
    if (error) {
      console.error(`Failed to update canonical for ${u.target}:`, error.message);
    } else {
      console.log(`Updated duplicate ${u.target} -> ${u.canonical}`);
    }
  }

  console.log('Cleanup complete!');
}

cleanDB();
