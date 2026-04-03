/**
 * SchemeAtlas — Multilingual Content Generator
 * 
 * Generates Q&A articles for government schemes using Groq (LLaMA 3.1 8B).
 * Each scheme gets: English article + its OWN local language translation only.
 * 
 * Runs via GitHub Actions daily at 2am IST.
 */

const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || (!OPENAI_API_KEY && !GROQ_API_KEY)) {
  console.error("❌ Missing required environment variables. Ensure SUPABASE_URL, SUPABASE_SERVICE_KEY, and at least one API key (OPENAI or GROQ) is set.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize OpenAI client (supports Groq as fallback via baseURL)
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || GROQ_API_KEY,
  baseURL: OPENAI_API_KEY ? undefined : 'https://api.groq.com/openai/v1'
});

const MODELS = OPENAI_API_KEY ? ['gpt-4o-mini', 'gpt-4o'] : ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile'];

// Language maps
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
  'sw': 'Swahili', 'yo': 'Yoruba', 'ha': 'Hausa', 'es': 'Spanish',
};
const COUNTRY_LANGUAGE_MAP = { 'IN': null, 'GB': null, 'US': 'es', 'NG': 'yo', 'KE': 'sw' };

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callLLM(prompt, retries = 3) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await openai.chat.completions.create({
          model: model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.4,
        });

        const content = response.choices?.[0]?.message?.content || '';
        if (content.length > 100) return content;
        
        await delay(2000);
      } catch (err) {
        if (err.status === 429) {
          console.log(`     ⏳ Rate limited, waiting 6s...`);
          await delay(6000);
          continue;
        }

        if (attempt < retries - 1) {
          console.log(`     ⚠️ Attempt ${attempt + 1} failed: ${err.message}. Retrying...`);
          await delay(4000);
          continue;
        }
        break;
      }
    }
  }
  throw new Error('All models exhausted or failed');
}

function getLocalLanguage(scheme) {
  if (scheme.local_language && scheme.local_language !== 'en') return scheme.local_language;
  if (scheme.country_code === 'IN') {
    const sc = scheme.state_code || scheme.state_region;
    if (sc && STATE_LANGUAGE_MAP[sc]) return STATE_LANGUAGE_MAP[sc];
    return 'hi';
  }
  return COUNTRY_LANGUAGE_MAP[scheme.country_code] || null;
}

async function main() {
  console.log('🚀 Automated Scheme Content Generator (Groq LLaMA)');
  console.log('━'.repeat(55));
  
  // Fetch up to 25 schemes without English content
  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('*')
    .is('content_en', null)
    .eq('is_published', true)
    .limit(25);
  
  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }
  if (!schemes || schemes.length === 0) {
    console.log('✅ All schemes already have content! Nothing to do.');
    process.exit(0);
  }
  
  console.log(`📋 Found ${schemes.length} schemes needing content.\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < schemes.length; i++) {
    const scheme = schemes[i];
    const localLang = getLocalLanguage(scheme);
    const localLangName = localLang ? LANGUAGE_NAMES[localLang] : null;
    
    console.log(`[${i+1}/${schemes.length}] 📝 Generating for: ${scheme.name}`);
    console.log(`   Country: ${scheme.country_code} | Local: ${localLangName || 'English only'}`);
    
    try {
      const eligStr = typeof scheme.eligibility === 'object' ? JSON.stringify(scheme.eligibility) : scheme.eligibility || 'Not specified';
      
      const enPrompt = `Write a government scheme guide in Q&A format for citizens with these exact questions:
1. What is ${scheme.name}?
2. Who is eligible for ${scheme.name}?
3. How much benefit will you get?
4. How to apply for ${scheme.name}?
5. What documents are needed to apply?
6. When will you receive the benefit?
7. What is the last date to apply?
8. Is ${scheme.name} still available in 2025?

For each question write a clear answer in 2-4 sentences. Write for ordinary citizens in simple language. Keep total under 700 words. Be factual.\n\nScheme details:\nName: ${scheme.name}\nCountry: ${scheme.country_code}\nEligibility: ${eligStr}\nBenefit: ${scheme.benefit_amount || 'Not specified'}\nCategory: ${scheme.category || 'Not specified'}`;

      console.log('   ⏳ Generating English content...');
      const contentEn = await callLLM(enPrompt);
      if (!contentEn || contentEn.length < 200) {
        console.log(`   ⚠️ English content generation failed or too short. Skipping.`);
        failCount++;
        continue;
      }
      console.log(`   ✅ English: \${contentEn.length} chars`);
      
      let contentLocal = null;
      let contentHi = null;
      
      if (localLang && localLang !== 'en') {
        const langName = LANGUAGE_NAMES[localLang];
        console.log(`   ⏳ Translating to ${langName}...`);
        const localPrompt = `Translate this Q&A scheme guide to ${langName}. Keep every question as a question in ${langName}. Keep all numbers, amounts, dates and URLs unchanged. Do not remove any section:\n\n${contentEn}`;
        const translated = await callLLM(localPrompt);
        
        if (localLang === 'hi') { contentHi = translated; }
        else { contentLocal = translated; }
        console.log(`   ✅ ${langName}: ${translated?.length || 0} chars`);
      }
      
      const { error: upErr } = await supabase
        .from('schemes')
        .update({
          content_en: contentEn,
          content_hi: contentHi,
          content_local: contentLocal,
          local_language: localLang || null,
          last_updated: new Date().toISOString()
        })
        .eq('id', scheme.id);
        
      if (upErr) throw upErr;
      console.log(`   ✅ Successfully saved to database!`);
      successCount++;
      
    } catch (err) {
      console.error(`   ❌ Failed:`, err.message);
      failCount++;
    }
    console.log('');
  }
  
  console.log('━'.repeat(55));
  console.log(`🏁 Finished run! Success: ${successCount} | Failed: ${failCount}`);
}

main().catch(e => { console.error('💥 Fatal error:', e); process.exit(1); });
