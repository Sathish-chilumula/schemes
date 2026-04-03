/**
 * SchemeAtlas — Multilingual Content Generator
 * 
 * Generates Q&A articles for government schemes using OpenRouter (LLaMA 3.3 70B free).
 * Each scheme gets: English article + its OWN local language translation only.
 * - Telangana scheme → English + Telugu
 * - Maharashtra scheme → English + Marathi
 * - UK scheme → English only
 * - Kenya scheme → English + Swahili
 * 
 * Runs via GitHub Actions daily at 2am IST.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENROUTER_API_KEY) {
  console.error('❌ Missing environment variables. Need: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENROUTER_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Language Maps ──────────────────────────────────────────

// Indian state → local language code
const STATE_LANGUAGE_MAP = {
  'TS': 'te', 'AP': 'te',         // Telangana, Andhra Pradesh → Telugu
  'KA': 'kn',                      // Karnataka → Kannada
  'TN': 'ta',                      // Tamil Nadu → Tamil
  'KL': 'ml',                      // Kerala → Malayalam
  'MH': 'mr',                      // Maharashtra → Marathi
  'WB': 'bn',                      // West Bengal → Bengali
  'GJ': 'gu',                      // Gujarat → Gujarati
  'PB': 'pa',                      // Punjab → Punjabi
  'OD': 'or', 'OR': 'or',         // Odisha → Odia
  'AS': 'as',                      // Assam → Assamese
  'RJ': 'hi', 'UP': 'hi', 'MP': 'hi', 'CG': 'hi', 'JH': 'hi',
  'BR': 'hi', 'HP': 'hi', 'UK': 'hi', 'HR': 'hi', 'DL': 'hi',  // Hindi belt
};

// Language code → full name
const LANGUAGE_NAMES = {
  'te': 'Telugu', 'kn': 'Kannada', 'ta': 'Tamil', 'ml': 'Malayalam',
  'mr': 'Marathi', 'bn': 'Bengali', 'gu': 'Gujarati', 'pa': 'Punjabi',
  'or': 'Odia', 'as': 'Assamese', 'hi': 'Hindi',
  'sw': 'Swahili', 'yo': 'Yoruba', 'ha': 'Hausa',
  'es': 'Spanish',
};

// Country → primary local language (for non-India schemes)
const COUNTRY_LANGUAGE_MAP = {
  'IN': null,     // India uses state-based language (handled separately)
  'GB': null,     // UK = English only
  'US': 'es',     // USA → Spanish
  'NG': 'yo',     // Nigeria → Yoruba
  'KE': 'sw',     // Kenya → Swahili
};

// ── OpenRouter API Call ────────────────────────────────────

async function callLLM(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://schemeatlas.com',
      'X-Title': 'SchemeAtlas',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Determine local language for a scheme ──────────────────

function getLocalLanguage(scheme) {
  // If local_language is already set in DB, use it
  if (scheme.local_language && scheme.local_language !== 'en') {
    return scheme.local_language;
  }

  // For India: determine from state_code or state_region
  if (scheme.country_code === 'IN') {
    const stateCode = scheme.state_code || scheme.state_region;
    if (stateCode && STATE_LANGUAGE_MAP[stateCode]) {
      return STATE_LANGUAGE_MAP[stateCode];
    }
    // Default for central India schemes: Hindi
    return 'hi';
  }

  // For other countries
  return COUNTRY_LANGUAGE_MAP[scheme.country_code] || null;
}

// ── Generate English Q&A Content ───────────────────────────

async function generateEnglish(scheme) {
  const eligibility = typeof scheme.eligibility === 'object' 
    ? JSON.stringify(scheme.eligibility) 
    : scheme.eligibility || 'Not specified';

  const prompt = `Write a government scheme guide in Q&A format for citizens with these exact questions:
1. What is ${scheme.name}?
2. Who is eligible for ${scheme.name}?
3. How much benefit will you get?
4. How to apply for ${scheme.name}?
5. What documents are needed to apply?
6. When will you receive the benefit?
7. What is the last date to apply?
8. Is ${scheme.name} still available in 2025?

For each question write a clear answer in 2-4 sentences.
Write for ordinary citizens in simple language.
Keep total under 700 words.
Be factual. Do not invent amounts or dates.

Scheme details:
Name: ${scheme.name}
Country: ${scheme.country_code}
Eligibility: ${eligibility}
Benefit: ${scheme.benefit_amount || 'Not specified'}
Category: ${scheme.category || 'Not specified'}`;

  return await callLLM(prompt);
}

// ── Translate to a specific language ───────────────────────

async function translateContent(englishContent, langCode) {
  const langName = LANGUAGE_NAMES[langCode];
  if (!langName) return null;

  const prompt = `Translate this Q&A scheme guide to ${langName}. Keep every question as a question in ${langName}. Keep all numbers, rupee amounts, dollar amounts, dates and URLs unchanged. Do not merge or remove any section. Translate accurately:\n\n${englishContent}`;

  return await callLLM(prompt);
}

// ── Main ───────────────────────────────────────────────────

async function main() {
  console.log('🚀 SchemeAtlas Content Generator Starting...');
  console.log('━'.repeat(50));

  // Fetch schemes that don't have content yet
  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('*')
    .is('content_en', null)
    .eq('is_published', true)
    .limit(20);

  if (error) {
    console.error('❌ Failed to fetch schemes:', error.message);
    process.exit(1);
  }

  if (!schemes || schemes.length === 0) {
    console.log('✅ All schemes already have content. Nothing to do.');
    process.exit(0);
  }

  console.log(`📋 Found ${schemes.length} schemes without content.\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < schemes.length; i++) {
    const scheme = schemes[i];
    const localLang = getLocalLanguage(scheme);
    const localLangName = localLang ? LANGUAGE_NAMES[localLang] : null;

    console.log(`[${i + 1}/${schemes.length}] 📝 ${scheme.name}`);
    console.log(`   Country: ${scheme.country_code} | Local: ${localLangName || 'English only'}`);

    try {
      // Step 1: Generate English content
      console.log('   ⏳ Generating English content...');
      const contentEn = await callLLM(await generateEnglishPrompt(scheme));
      
      // Actually, let me just call generateEnglish directly
      const englishContent = await generateEnglish(scheme);

      // Validate length
      if (!englishContent || englishContent.length < 300) {
        console.log(`   ⚠️ English content too short (${englishContent?.length || 0} chars). Skipping.`);
        failCount++;
        await delay(2500);
        continue;
      }
      console.log(`   ✅ English: ${englishContent.length} chars`);

      await delay(2500);

      // Step 2: Translate to local language (if applicable and not English)
      let contentLocal = null;
      if (localLang && localLang !== 'en') {
        console.log(`   ⏳ Translating to ${localLangName}...`);
        contentLocal = await translateContent(englishContent, localLang);
        console.log(`   ✅ ${localLangName}: ${contentLocal?.length || 0} chars`);
        await delay(2500);
      }

      // Step 3: For Hindi — if localLang is already Hindi, use contentLocal as content_hi
      //         If localLang is NOT Hindi (e.g. Telugu), content_hi stays null
      //         If it's a central scheme with Hindi, content_hi = the local translation
      let contentHi = null;
      if (localLang === 'hi') {
        contentHi = contentLocal;
        contentLocal = null; // Don't duplicate in content_local
      }

      // Step 4: Update Supabase
      const updateData = {
        content_en: englishContent,
        content_hi: contentHi,
        content_local: contentLocal,
        local_language: localLang || null,
        last_updated: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('schemes')
        .update(updateData)
        .eq('id', scheme.id);

      if (updateError) {
        console.log(`   ❌ DB update failed: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`   ✅ Saved to database!`);
        successCount++;
      }

    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      failCount++;
    }

    console.log('');
    await delay(2500);
  }

  console.log('━'.repeat(50));
  console.log(`🏁 Done! Success: ${successCount} | Failed: ${failCount}`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('💥 Fatal error:', err);
  process.exit(1);
});
