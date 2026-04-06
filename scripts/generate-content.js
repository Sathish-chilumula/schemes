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

const MODELS = OPENAI_API_KEY ? ['gpt-4o-mini'] : ['llama-3.1-8b-instant', 'llama-3.1-70b-versatile'];

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

// Target Regions for Triple Translation (EN, HI, TE)
const TRIPLE_TRANSLATION_REGIONS = ['TS', 'AP', 'IN-TG', 'IN-TS', 'IN-AP', 'india', 'India', 'IN'];

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
  
  // Fetch up to 1000 published schemes to check which ones need formatting
  const { data: allSchemes, error } = await supabase
    .from('schemes')
    .select('*')
    .eq('is_published', true)
    .limit(1000);
  
  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }
  
  const schemes = allSchemes.filter(s => {
    // We already marked all for re-generation by setting is_seo_optimized = false
    return s.is_seo_optimized === false;
  }).slice(0, 50); // Processed in batches of 50 as requested

  if (!schemes || schemes.length === 0) {
    console.log('✅ All schemes already have Q&A content! Nothing to do.');
    process.exit(0);
  }
  
  console.log(`📋 Found ${schemes.length} schemes needing Q&A formatting.\n`);
  
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
      
      const enPrompt = `You are an expert SEO content writer and data validator specializing in government schemes. Write a HIGH-QUALITY, SEO-OPTIMIZED, TRUSTWORTHY scheme guide for citizens.
Tone: Friendly, conversational, and helpful. Use very short sentences. Avoid formal or complex words. Write as if you are talking to a friend in simple English.

Structure Rule: You MUST follow this exact 14-point structure. Use clear labels for each section. 
DO NOT use any markdown symbols like asterisks (**), hashes (#), or bullet points. Use plain text only.

1. Title: Easy to understand, friendly.
2. Summary: 5–10 lines. Very simple overview of what it is.
3. What is the Scheme?: Purpose and Ministry details in simple words.
4. Key Benefits: Exact money (₹) or facilities. Be very specific about amounts.
5. Eligibility Criteria: Simple list of who can get it.
6. Who Should Apply: Real-life examples of people who should join.
7. Who Should NOT Apply: Clear examples of people who are not allowed.
8. Documents Required: Clear list of papers needed.
9. Selection / Approval Process: Step-by-step in plain words.
10. How to Apply: Simple steps anyone can follow.
11. Important Dates: Open dates or cycles.
12. Official Website / Application: Provide the verified URL as plain text. If not verified, write "Visit the official ministry website."
13. FAQs: 5–7 friendly questions and answers. Use "Q: " and "A: " prefixes.
14. Pro Tips / Insights: Simple advice to help the user succeed.

Rules:
- NEVER use asterisks (**), hashes (#), bullet points, or markdown formatting anywhere.
- For FAQs, prefix every question with EXACTLY "Q: " and every answer with EXACTLY "A: ".
- Keep the total output around 600-800 words for depth.

Scheme details:
Name: ${scheme.name}
Country: ${scheme.country_code}
Eligibility: ${eligStr}
Benefit: ${scheme.benefit_amount || 'Not specified'}
Category: ${scheme.category || 'Not specified'}`;

      let contentEn = scheme.content_en;
      const hasOverview = contentEn && contentEn.indexOf('Q:') > 100;
      const needsEn = !contentEn || contentEn.length < 300 || !(contentEn.includes('Q:') && contentEn.includes('A:')) || contentEn.includes('**') || contentEn.includes('#') || !hasOverview;

      if (needsEn) {
        console.log('   ⏳ Generating English content...');
        contentEn = await callLLM(enPrompt);
        if (!contentEn || contentEn.length < 200) {
          console.log(`   ⚠️ English content generation failed or too short. Skipping.`);
          failCount++;
          continue;
        }
        console.log(`   ✅ English generated: ${contentEn.length} chars`);
      } else {
        console.log(`   ✅ English content already valid (${contentEn.length} chars)`);
      }
      
      let contentLocal = scheme.content_local;
      let contentHi = scheme.country_code === 'IN' ? scheme.content_hi : null;
      let dbLocalLanguage = scheme.local_language;
      
      let requiredTranslations = [];
      const sc = scheme.state_code || scheme.state_region || (scheme.is_central ? 'IN' : null);
      
      // Triple Translation Rule: Central, TS, and AP always get HI + TE
      const isTripleTranslate = TRIPLE_TRANSLATION_REGIONS.includes(sc) || scheme.is_central;

      if (scheme.country_code === 'IN') {
        if (isTripleTranslate) {
          requiredTranslations = ['hi', 'te'];
        } else {
          const stateLang = STATE_LANGUAGE_MAP[sc] || 'hi';
          requiredTranslations = [stateLang];
        }
      } else {
        const foreignLang = COUNTRY_LANGUAGE_MAP[scheme.country_code];
        if (foreignLang) requiredTranslations.push(foreignLang);
      }

      // Filter out 'en' if it somehow gets in
      requiredTranslations = requiredTranslations.filter(lang => lang !== 'en');

      for (const lang of requiredTranslations) {
        const langName = LANGUAGE_NAMES[lang];
        if (!langName) continue;

        const isHi = lang === 'hi';
        const needsLocalTranslation = (isHi && !contentHi) || (!isHi && !contentLocal) || needsEn;

        if (needsLocalTranslation) {
          console.log(`   ⏳ Translating to ${langName}...`);
          const localPrompt = `Translate this comprehensive scheme guide to ${langName}.
Rules:
- Keep the exact prefixes "Q:" and "A:" in English (do not translate these prefixes).
- Translate the text accurately to ${langName} in a natural, human-like conversational tone.
- Use simple, common words in ${langName}. Avoid formal or highly academic language.
- Keep all numbers, amounts, dates, and URLs unchanged.
- NEVER use asterisks (**), hashes (#), or markdown formatting of any kind.\n\nOriginal:\n${contentEn}`;
          const translated = await callLLM(localPrompt);
          
          if (isHi) { 
            contentHi = translated; 
          } else { 
            contentLocal = translated; 
            dbLocalLanguage = lang; // Store which local language we used
          }
          console.log(`   ✅ ${langName} translated: ${translated?.length || 0} chars`);
        } else {
          console.log(`   ✅ ${langName} translation already exists`);
        }
      }
      
      const { error: upErr } = await supabase
        .from('schemes')
        .update({
          content_en: contentEn,
          content_hi: contentHi,
          content_local: contentLocal,
          local_language: dbLocalLanguage,
          is_seo_optimized: true, // Mark as complete
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

    if (i < schemes.length - 1) {
      console.log('   ⏳ Waiting 3s before next scheme...');
      await delay(3000);
    }
    console.log('');
  }
  
  console.log('━'.repeat(55));
  console.log(`🏁 Finished run! Success: ${successCount} | Failed: ${failCount}`);
}

main().catch(e => { console.error('💥 Fatal error:', e); process.exit(1); });
