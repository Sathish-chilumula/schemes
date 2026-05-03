/**
 * SchemeAtlas — High-Quality Content Generator V2
 *
 * Generates rich, 1500-word Q&A articles for NEW government schemes.
 * Ensures EN, HI, and Local language are generated with domain glossaries.
 */

const BATCH_SIZE = 10; // Process fewer schemes due to longer 1500-word prompts

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || (!OPENAI_API_KEY && !GROQ_API_KEY)) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

let geminiModel = null;
if (GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  } catch (e) {
    console.warn("⚠️ Gemini SDK init failed.");
  }
}

// Language maps
const STATE_LANGUAGE_MAP = {
  'TS': 'te', 'AP': 'te', 'IN-TG': 'te', 'IN-AP': 'te',
  'KA': 'kn', 'IN-KA': 'kn', 
  'TN': 'ta', 'IN-TN': 'ta', 
  'KL': 'ml', 'IN-KL': 'ml',
  'MH': 'mr', 'IN-MH': 'mr', 
  'WB': 'bn', 'IN-WB': 'bn', 
  'GJ': 'gu', 'IN-GJ': 'gu', 
  'PB': 'pa', 'IN-PB': 'pa', 
  'OD': 'or', 'OR': 'or', 'IN-OR': 'or',
  'AS': 'as', 'IN-AS': 'as', 
  'RJ': 'hi', 'UP': 'hi', 'MP': 'hi', 'CG': 'hi', 'JH': 'hi',
  'BR': 'hi', 'HP': 'hi', 'UK': 'hi', 'HR': 'hi', 'DL': 'hi',
};

const LANGUAGE_NAMES = {
  'te': 'Telugu', 'kn': 'Kannada', 'ta': 'Tamil', 'ml': 'Malayalam',
  'mr': 'Marathi', 'bn': 'Bengali', 'gu': 'Gujarati', 'pa': 'Punjabi',
  'or': 'Odia', 'as': 'Assamese', 'hi': 'Hindi',
  'sw': 'Swahili', 'yo': 'Yoruba', 'ha': 'Hausa', 'es': 'Spanish',
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callLLM(prompt, maxTokens = 2500) {
  // --- TIER 1: GROQ (Primary) ---
  if (GROQ_API_KEY) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      }, {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000
      });
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 100) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 1 (Groq) failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // --- TIER 2: GEMINI (Fallback 1) ---
  if (geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      if (text && text.length > 100) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 2 (Gemini) failed: ${err.message}`);
    }
  }

  // --- TIER 3: OPENAI (Fallback 2) ---
  if (OPENAI_API_KEY) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      }, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 40000
      });
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 100) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 3 (OpenAI) failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // --- TIER 4: CLOUDFLARE ---
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    try {
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
        { model: '@cf/meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: prompt }] },
        { headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' }, timeout: 35000 }
      );
      const text = response.data?.result?.response?.trim() || response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 100) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 4 (Cloudflare) failed: ${err.message}`);
    }
  }

  return null;
}

function getLocalLanguage(scheme) {
  if (scheme.local_language) return scheme.local_language;
  const stateCode = (scheme.state_code || '').toUpperCase();
  if (stateCode && STATE_LANGUAGE_MAP[stateCode]) return STATE_LANGUAGE_MAP[stateCode];
  
  // For Central India ('india' or 'IN' without state), default to Telugu ('te') 
  // as per the implementation plan requirement (EN + HI + TE for National schemes)
  if (scheme.country_code === 'IN' || stateCode === 'INDIA') return 'te';
  
  return null;
}

async function generateContentEn(scheme) {
  console.log(`   ✍️ Generating Rich English Content (1200+ words)...`);
  
  const stateContext = scheme.state_name ? `State: ${scheme.state_name}` : `Central Government (India)`;
  const categoryContext = scheme.category || 'General';

  const prompt = `You are an expert financial and government scheme advisor writing for SchemeAtlas.
Write a highly detailed, 1200-1500 word comprehensive guide about this government scheme.
Tone: Conversational, authoritative, yet friendly and very easy to understand (8th-grade level).

Scheme Name: ${scheme.name}
${stateContext}
Category: ${categoryContext}
Basic Info provided: ${scheme.what_you_get}
Eligibility clues: ${JSON.stringify(scheme.eligibility)}
How to apply clues: ${JSON.stringify(scheme.how_to_apply)}

REQUIREMENTS:
- Use real numbers, actual ₹ amounts, real ministry names, and realistic application URLs if you know them.
- Include relevant emojis (🤑, 📈, 🏦, ✅, etc.) and symbols in the headings and content to make it visually appealing and easy to read.
- NEVER use markdown like #, *, or bullet points. You must use plain text with numeric headers exactly as below.

Use this EXACT 10-section structure:

1. SUMMARY:
(Write 2-3 punchy sentences answering "what is this?" and "who is it for?". Make it catchy.)

2. WHAT IS IT?:
(Explain the scheme in 200 words. Mention the ministry, launch context, and main objective.)

3. KEY BENEFITS:
(Detail the exact ₹ amounts, financial benefits, units, or slabs. Be specific and use numbers.)

4. WHO IS ELIGIBLE?:
(List exact criteria. Age limits, income limits, caste requirements, occupation rules.)

5. WHO CANNOT APPLY?:
(Give clear examples of people who are excluded so readers don't waste their time.)

6. DOCUMENTS REQUIRED:
(List exact documents: Aadhaar, income certificate, caste certificate, bank passbook, etc.)

7. HOW TO APPLY - STEP BY STEP:
(Give a numbered step-by-step process. Mention specific website portals or physical office names.)

8. IMPORTANT DATES:
(Mention current year application cycles, deadlines, or renewal periods.)

9. FAQs:
(Provide exactly 5 highly specific Q&A pairs using the exact phrasing people ask on Google.)
Q: Who can apply for ${scheme.name}?
A: [direct answer]
Q: [question 2]
A: [answer 2]
...

10. PRO TIPS:
(Provide 2 insider tips or common mistakes to avoid when applying for this specific scheme.)`;

  return await callLLM(prompt, 2500);
}

async function generateTranslation(text, targetLangCode, scheme) {
  const langName = LANGUAGE_NAMES[targetLangCode] || targetLangCode;
  console.log(`   🌐 Translating to ${langName}...`);
  
  const categoryContext = scheme.category || 'General';
  const stateContext = scheme.state_name || 'India';
  
  let glossary = '';
  if (targetLangCode === 'te' && categoryContext.includes('business')) glossary = 'Weaver = నేత పనివారు (NOT నాట్యకారుడు)';
  if (targetLangCode === 'te') glossary += '\nScheme = పథకం\nApply = దరఖాస్తు చేయండి\nFree = ఉచిత';

  const prompt = `You are an expert native ${langName} translator translating a government scheme guide for citizens of ${stateContext}.

Rules for translation:
- Translate the provided English text into natural, highly conversational ${langName}.
- DO NOT use overly formal, textbook, or poetic language. Speak like a helpful friend.
- IMPORTANT: Blend in common English words where appropriate (e.g., "apply", "online", "website", "documents", "form") as this is how people actually speak.
- Maintain the exact same 1-10 section numbering and structure.
${glossary ? `- GLOSSARY: Follow these specific translations:\n${glossary}` : ''}

Translate the following text:

${text}`;

  return await callLLM(prompt, 3000);
}

async function runV2Pipeline() {
  console.log('\n🚀 Starting SchemeAtlas Content Pipeline V2 (New Schemes Only)...');
  
  // Find new schemes (created after May 1, 2026) that lack SEO optimization
  // Note: we can also use FORCE_SCHEME_SLUG for testing
  const targetSlug = process.env.FORCE_SCHEME_SLUG;
  let query = supabase.from('schemes').select('*');
  
  if (targetSlug) {
    query = query.eq('slug', targetSlug);
  } else {
    query = query
      .eq('is_seo_optimized', false)
      .gte('discovered_at', '2026-05-01T00:00:00Z')
      .order('discovered_at', { ascending: false })
      .limit(BATCH_SIZE);
  }

  const { data: schemes, error } = await query;

  if (error) {
    console.error('❌ Supabase error:', error.message);
    process.exit(1);
  }

  if (!schemes || schemes.length === 0) {
    console.log('✅ No new unoptimized schemes found.');
    return;
  }

  console.log(`📊 Processing ${schemes.length} schemes...`);

  for (const scheme of schemes) {
    console.log(`\n==============================================`);
    console.log(`📝 SCHEME: ${scheme.name} (${scheme.state_code || 'Central'})`);
    
    try {
      // 1. Generate English Rich Content
      const contentEn = await generateContentEn(scheme);
      if (!contentEn || contentEn.length < 500) {
        console.error(`   ❌ Failed to generate English content. Skipping.`);
        continue;
      }
      console.log(`   ✅ English content generated (${contentEn.length} chars)`);

      // 2. Generate Hindi Translation (Always for India)
      let contentHi = null;
      contentHi = await generateTranslation(contentEn, 'hi', scheme);
      if (contentHi) {
        console.log(`   ✅ Hindi translation generated`);
      } else {
        console.warn(`   ⚠️ Hindi translation failed`);
      }

      // 3. Generate Local State Translation
      const localLang = getLocalLanguage(scheme);
      let contentLocal = null;
      if (localLang && localLang !== 'hi') {
        contentLocal = await generateTranslation(contentEn, localLang, scheme);
        if (contentLocal) {
          console.log(`   ✅ Local (${localLang}) translation generated`);
        } else {
          console.warn(`   ⚠️ Local (${localLang}) translation failed`);
        }
      }

      // 4. Validate & Update Database
      // We only mark is_seo_optimized = true if English succeeded.
      // (Optionally require translations to succeed too, but let's be pragmatic)
      const updatePayload = {
        content_en: contentEn,
        content_hi: contentHi,
        content_local: contentLocal,
        local_language: localLang,
        is_seo_optimized: true,
        last_updated: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('schemes')
        .update(updatePayload)
        .eq('id', scheme.id);

      if (updateError) {
        console.error(`   ❌ Failed to save to DB: ${updateError.message}`);
      } else {
        console.log(`   💾 Successfully saved and marked as SEO Optimized.`);
      }

    } catch (e) {
      console.error(`   ❌ Unexpected error processing scheme: ${e.message}`);
    }
    
    // Rate limit delay between schemes
    await delay(3000);
  }

  console.log(`\n🎉 Pipeline run complete!`);
}

runV2Pipeline().then(() => process.exit(0)).catch(e => {
  console.error("Pipeline failed:", e);
  process.exit(1);
});
