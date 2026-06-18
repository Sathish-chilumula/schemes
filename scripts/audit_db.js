import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function runAudit() {
  const { data: schemes, error } = await supabase.from('schemes').select('*');
  if (error) {
    console.error('Error fetching schemes:', error);
    return;
  }

  console.log(`Total Schemes: ${schemes.length}`);

  // a. Duplicate or near-duplicate schemes
  const groupedByName = {};
  schemes.forEach(s => {
    // Normalise name for duplicate detection
    const normalName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!groupedByName[normalName]) groupedByName[normalName] = [];
    groupedByName[normalName].push({ slug: s.slug, name: s.name, views: s.views || 0, id: s.id });
  });
  const duplicates = Object.values(groupedByName).filter(group => group.length > 1);
  console.log('\n--- Duplicates ---');
  duplicates.forEach(group => console.log(group.map(g => `${g.name} (${g.slug})`).join(' | ')));

  // b. Entries where the benefit/amount field is empty, "Not specified", or placeholder text.
  const emptyBenefits = schemes.filter(s => !s.benefit_amount || s.benefit_amount.toLowerCase().includes('not specified') || s.benefit_amount.trim() === '');
  console.log(`\n--- Missing Benefit Amounts: ${emptyBenefits.length} ---`);

  // c. Not actually government schemes
  // We'll search for 'us elections', 'farmers markets', etc., in name or what_you_get or category
  const offTopicKeywords = ['election', 'conspiracy', 'reset', 'news', 'round-up', 'market', 'farmer market', 'farmers market'];
  const offTopic = schemes.filter(s => 
    offTopicKeywords.some(kw => 
      (s.name && s.name.toLowerCase().includes(kw)) || 
      (s.what_you_get && s.what_you_get.toLowerCase().includes(kw))
    ) || s.category === 'news'
  );
  console.log(`\n--- Off-Topic Content: ${offTopic.length} ---`);
  offTopic.forEach(s => console.log(`Off-topic: ${s.name} (${s.slug})`));

  // d. AI template structure almost word-for-word
  const genericAIKeywords = ["let's dive into the details", "use it wisely", "pro tips", "insights"];
  const genericAI = schemes.filter(s => {
    const combinedText = `${s.what_you_get} ${JSON.stringify(s.eligibility)} ${JSON.stringify(s.how_to_apply)}`.toLowerCase();
    return genericAIKeywords.some(kw => combinedText.includes(kw.toLowerCase()));
  });
  console.log(`\n--- Generic AI Content: ${genericAI.length} ---`);
  genericAI.forEach(s => console.log(`Generic: ${s.name} (${s.slug})`));

}
runAudit();
