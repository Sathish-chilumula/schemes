/**
 * SchemeAtlas — Advanced State & Ministry Enrichment (SEO 2.0)
 * 
 * Implements a 3-step hierarchical generation:
 * 1. Master Version (EN): "Expert SEO" structured article with intent markers.
 * 2. Translation (HI): Natural Hindi rewrite.
 * 3. Translation (Local): State-specific natural rewrite.
 * 
 * Prioritizes: 
 * - Empty schemes (content_en is null) 
 * - Low-quality legacy content (needs upgrade)
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error("❌ Missing required environment variables. Ensure SUPABASE_URL, SUPABASE_SERVICE_KEY, and OPENAI_API_KEY are set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const MODEL = 'gpt-4o-mini';

const STATE_LANGUAGE_MAP = {
  'TS': 'te', 'AP': 'te', 'KA': 'kn', 'TN': 'ta', 'KL': 'ml',
  'MH': 'mr', 'WB': 'bn', 'GJ': 'gu', 'PB': 'pa', 'OD': 'or', 'OR': 'or',
  'AS': 'as', 'RJ': 'hi', 'UP': 'hi', 'MP': 'hi', 'CG': 'hi', 'JH': 'hi',
  'BR': 'hi', 'HP': 'hi', 'UK': 'hi', 'HR': 'hi', 'DL': 'hi',
};

const LANGUAGE_NAMES = {
  'te': 'Telugu', 'kn': 'Kannada', 'ta': 'Tamil', 'ml': 'Malayalam',
  'mr': 'Marathi', 'bn': 'Bengali', 'gu': 'Gujarati', 'pa': 'Punjabi',
  'or': 'Odia', 'as': 'Assamese', 'hi': 'Hindi',
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callLLM(prompt) {
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });
  return res.choices[0].message.content.trim();
}

function getLocalLanguage(scheme) {
  const sc = scheme.state_code || scheme.state_region;
  if (sc && STATE_LANGUAGE_MAP[sc]) return STATE_LANGUAGE_MAP[sc];
  return null;
}

async function enrichScheme(scheme) {
  console.log(`\n💎 Enriching: ${scheme.name} (${scheme.id})`);
  
  const localLangCode = getLocalLanguage(scheme);
  const localLangName = localLangCode ? LANGUAGE_NAMES[localLangCode] : null;

  // STEP 1: MASTER VERSION (EN)
  console.log(`   Step 1: Generating Master SEO Article (EN)...`);
  const masterPrompt = `You are an expert SEO content writer for a government schemes platform.
Task: Transform raw scheme data into a highly useful, unique, and SEO-optimized article.

STRICT RULES:
- Restructure completely. Avoid robotic tones.
- Target: 8th class level readability.
- Add "Who should definitely apply" and "Who should NOT apply" sections.
- Focus on providing precise, helpful information based only on the input data.

INPUT DATA:
Name: ${scheme.name}
Description: ${scheme.description || 'N/A'}
Benefits: ${scheme.benefit_amount || 'Specified in text'}
Eligibility: ${typeof scheme.eligibility === 'string' ? scheme.eligibility : JSON.stringify(scheme.eligibility)}
Ministry: ${scheme.ministry || 'N/A'}

OUTPUT FORMAT:
# ${scheme.name}

## 📌 Overview
(Unique summary)

## 💰 Benefits
(Details with bullet points)

## 👥 Who Should Definitely Apply
...

## 🚫 Who Should NOT Apply
...

## 👥 Eligibility Criteria
...

## 📄 Documents Required
...

## 📝 How to Apply
...

## ⚠️ Common Mistakes to Avoid
...

## 💡 Pro Tips
...

## ❓ FAQs
...`;

  const contentEn = await callLLM(masterPrompt);
  console.log(`   ✅ Master generated (${contentEn.length} chars)`);

  // STEP 2: HINDI TRANSLATION
  console.log(`   Step 2: Translating to Hindi (natural rewrite)...`);
  const hiPrompt = `Rewrite the following government scheme article into Hindi. 
DO NOT use robotic Google Translate style. Use natural, easy Hindi that a common person in a village can understand.
Maintain the exact same structure (Overview, Benefits, Who should apply, etc.).

ARTICLE TO REWRITE:
${contentEn}`;
  
  const contentHi = await callLLM(hiPrompt);
  console.log(`   ✅ Hindi version generated.`);

  // STEP 3: LOCAL LANGUAGE (If applicable)
  let contentLocal = null;
  if (localLangCode && localLangCode !== 'hi') {
    console.log(`   Step 3: Translating to ${localLangName} (natural rewrite)...`);
    const localPrompt = `Rewrite the following government scheme article into ${localLangName}. 
Ensure it sounds natural and helpful for residents of the state. Use simple language.
Maintain the exact same structure.

ARTICLE TO REWRITE:
${contentEn}`;
    contentLocal = await callLLM(localPrompt);
    console.log(`   ✅ ${localLangName} version generated.`);
  }

  // UPDATE DATABASE
  const { error } = await supabase
    .from('schemes')
    .update({
      content_en: contentEn,
      content_hi: contentHi,
      content_local: contentLocal,
      local_language: localLangCode,
      is_seo_optimized: true, // Marker for upgrade tracking
      last_enriched_at: new Date().toISOString()
    })
    .eq('id', scheme.id);

  if (error) throw error;
}

async function main() {
  console.log('🚀 State-Specific Enrichment Pipeline (SEO 2.0)');
  console.log('━'.repeat(50));

  // Fetch up to 10 schemes needing enrichment
  // Prioritize those that are not yet "SEO Optimized" or have null content
  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('*')
    .or('is_seo_optimized.eq.false,is_seo_optimized.is.null')
    .eq('is_published', true)
    .not('state_code', 'is', null) // Only focus on state schemes for this script
    .order('discovered_at', { ascending: false })
    .limit(10);

  if (error) { console.error('❌ Fetch error:', error); process.exit(1); }
  if (!schemes || schemes.length === 0) {
    console.log('✅ All state schemes are already optimized. Nothing to do.');
    process.exit(0);
  }

  console.log(`📋 Found ${schemes.length} schemes to enrich.`);

  for (const scheme of schemes) {
    try {
      await enrichScheme(scheme);
      await delay(2000); // Respectful delay between schemes
    } catch (err) {
      console.error(`   ❌ Error on ${scheme.name}:`, err.message);
    }
  }

  console.log('\n🏁 Enrichment process complete.');
}

main().catch(console.error);
