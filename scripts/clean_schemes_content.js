const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Phrases to remove completely (as sections)
const SECTIONS_TO_REMOVE = [
  'pro tips / insights',
  'expert tips',
  'official website / application',
  'what is the scheme?',
  'what is the scheme',
  'who should apply',
  // Hindi
  'प्रो टिप्स / अंतर्दृष्टि',
  'आधिकारिक वेबसाइट / आवेदन',
  'योजना क्या है',
  'किसे आवेदन करना चाहिए',
  // Telugu
  'ప్రొ టిప్స్ / అవగాహనలు',
  'అధికారిక వెబ్‌సైట్ / అప్లికేషన్',
  'పథకం ఏమిటి',
  'ఎవరు దరఖాస్తు చేయాలి'
];

// String replacements for plain text or JSON text content
const STRING_REPLACEMENTS = [
  { match: 'Title: ', replace: '' },
  { match: 'Summary: ', replace: '' },
  { match: 'Pro Tips / Insights: ', replace: '' },
  { match: 'Official Website / Application: Visit the official ministry website.', replace: '' },
  { match: 'What is the Scheme?: ', replace: '' },
  { match: 'Who Should Apply: ', replace: '' },
  { match: 'शीर्षक: ', replace: '' },
  { match: 'सारांश: ', replace: '' },
  { match: 'प्रो टिप्स / अंतर्दृष्टि: ', replace: '' },
  { match: 'आधिकारिक वेबसाइट / आवेदन: आधिकारिक मंत्रालय वेबसाइट पर जाएं।', replace: '' },
  { match: 'शీర్షిక: ', replace: '' },
  { match: 'సారాంశం: ', replace: '' },
  { match: 'ప్రొ టిప్స్ / అవగాహనలు: ', replace: '' },
  { match: 'అధికారిక వెబ్‌సైట్ / అప్లికేషన్: అధికారిక మంత్రిత్వ శాఖ వెబ్‌సైట్‌ను సందర్శించండి.', replace: '' }
];

function cleanString(str) {
  if (!str) return str;
  let res = str;
  for (const { match, replace } of STRING_REPLACEMENTS) {
    // using split join to replace all occurrences
    res = res.split(match).join(replace);
  }
  return res;
}

function processContent(contentStr) {
  if (!contentStr) return contentStr;
  
  // Try to parse as JSON
  try {
    const json = JSON.parse(contentStr);
    
    // It's structured JSON
    if (json && json.sections && Array.isArray(json.sections)) {
      // 1. Filter out unwanted sections
      json.sections = json.sections.filter(s => {
        if (!s.heading) return true;
        const h = s.heading.toLowerCase().trim();
        // Remove exact matches or containing matches
        const shouldRemove = SECTIONS_TO_REMOVE.some(term => h.includes(term.toLowerCase()));
        return !shouldRemove;
      });
      
      // 2. Clean up text content in remaining sections
      json.sections.forEach(s => {
        if (s.content) s.content = cleanString(s.content);
        if (s.heading) s.heading = cleanString(s.heading);
      });
      
      if (json.intro) json.intro = cleanString(json.intro);
      
      // Also clean faqs just in case
      if (json.faqs && Array.isArray(json.faqs)) {
        json.faqs.forEach(f => {
          if (f.q) f.q = cleanString(f.q);
          if (f.a) f.a = cleanString(f.a);
        });
      }
      
      return JSON.stringify(json);
    }
  } catch (e) {
    // Not JSON, just plain text
  }
  
  // Plain text cleaning
  return cleanString(contentStr);
}

async function run() {
  console.log('Fetching schemes...');
  let { data: schemes, error } = await supabase
    .from('schemes')
    .select('id, slug, content_en, content_hi, content_local');
    
  if (error) {
    console.error('Error fetching schemes:', error);
    return;
  }
  
  console.log(`Processing ${schemes.length} schemes...`);
  let updatedCount = 0;
  
  for (const scheme of schemes) {
    const cleanedEn = processContent(scheme.content_en);
    const cleanedHi = processContent(scheme.content_hi);
    const cleanedLocal = processContent(scheme.content_local);
    
    if (
      cleanedEn !== scheme.content_en ||
      cleanedHi !== scheme.content_hi ||
      cleanedLocal !== scheme.content_local
    ) {
      console.log(`Updating ${scheme.slug}...`);
      const { error: updateErr } = await supabase
        .from('schemes')
        .update({
          content_en: cleanedEn,
          content_hi: cleanedHi,
          content_local: cleanedLocal
        })
        .eq('id', scheme.id);
        
      if (updateErr) {
        console.error(`Error updating ${scheme.slug}:`, updateErr);
      } else {
        updatedCount++;
      }
    }
  }
  
  console.log(`Finished. Updated ${updatedCount} schemes.`);
}

run();
