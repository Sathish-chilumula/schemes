/**
 * SchemeAtlas — High-Quality Content Generator V2
 *
 * Generates rich, 1500-word Q&A articles for NEW government schemes.
 * Ensures EN, HI, and Local language are generated with domain glossaries.
 */

let BATCH_SIZE = 10; // Default size
let isBulk = false;

// Parse command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg === '--bulk') isBulk = true;
  else if (!isNaN(parseInt(arg, 10)) && parseInt(arg, 10) > 0) {
    BATCH_SIZE = parseInt(arg, 10);
  }
});

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
  console.log(`   ✍️ Generating Rich Structured Content (JSON / Money Guide format)...`);

  const stateContext = scheme.state_name ? `State: ${scheme.state_name}` : `Central Government (India)`;
  const categoryContext = scheme.category || 'General';

  const prompt = `You are a senior government scheme advisor at SchemeAtlas — India's most trusted scheme discovery platform.
Write a comprehensive, 1500-word guide that feels like a premium Money Guide article.
Tone: Conversational, authoritative, friendly. 8th-grade reading level.

Scheme: ${scheme.name}
${stateContext}
Category: ${categoryContext}
Basic Info: ${scheme.what_you_get || 'N/A'}
Eligibility: ${JSON.stringify(scheme.eligibility || {})}
How to Apply: ${JSON.stringify(scheme.how_to_apply || {})}

RULES:
- NEVER use markdown symbols (#, *, **). Plain text and emojis only.
- Use real ₹ amounts, actual ministry names, real portal URLs where you know them.
- Be genuinely specific — not a generic template.
- No placeholder text like "[enter amount here]".

Return ONLY valid JSON (no markdown code fences, no extra text before or after the JSON):
{
  "intro": "2-3 catchy hook sentences: what this scheme is and who it helps.",
  "tableOfContents": ["What Is This Scheme?", "Key Benefits 💰", "Who Is Eligible? ✅", "Who Cannot Apply? 🚫", "Documents Required 📄", "How To Apply 📝", "Important Dates 📅", "Pro Tips 💡"],
  "sections": [
    {"heading": "🏛️ What Is This Scheme?", "content": "200-word explanation mentioning the ministry, launch year, and main objective."},
    {"heading": "💰 Key Benefits", "content": "Exact ₹ amounts, slabs, units. Be specific and use numbers."},
    {"heading": "✅ Who Is Eligible?", "content": "Age, income, caste, occupation criteria with exact numbers."},
    {"heading": "🚫 Who Cannot Apply?", "content": "Clear real-life examples of excluded people."},
    {"heading": "📄 Documents Required", "content": "Exact list: Aadhaar, income certificate, bank passbook, etc."},
    {"heading": "📝 How To Apply — Step by Step", "content": "Numbered steps mentioning specific portals or office names."},
    {"heading": "📅 Important Dates", "content": "2026 application cycles, deadlines, or renewal periods."},
    {"heading": "💡 Pro Tips", "content": "2 insider tips and common mistakes to avoid."}
  ],
  "faqs": [
    {"q": "Who can apply for ${scheme.name}?", "a": "Specific direct answer."},
    {"q": "What is the benefit amount under ${scheme.name}?", "a": "Specific direct answer with ₹ amount."},
    {"q": "How to apply online for ${scheme.name}?", "a": "Step-by-step direct answer."},
    {"q": "What documents are needed for ${scheme.name}?", "a": "Specific list."},
    {"q": "Is ${scheme.name} still active in 2026?", "a": "Direct answer with current status."}
  ]
}`;

  const raw = await callLLM(prompt, 3500);
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.sections || !Array.isArray(parsed.sections) || !parsed.faqs || !parsed.intro) {
      throw new Error('Missing required JSON fields');
    }
    console.log(`   ✅ Structured JSON generated (${parsed.sections.length} sections, ${parsed.faqs.length} FAQs)`);
    return JSON.stringify(parsed);
  } catch (e) {
    console.warn(`   ⚠️ JSON parse failed, storing raw text as fallback: ${e.message}`);
    return raw;
  }
}

async function generateTranslation(contentEn, targetLangCode, scheme) {
  const langName = LANGUAGE_NAMES[targetLangCode] || targetLangCode;
  console.log(`   🌐 Translating to ${langName}...`);

  const categoryContext = scheme.category || 'General';
  const stateContext = scheme.state_name || 'India';

  let glossary = '';
  if (targetLangCode === 'te' && categoryContext.includes('business')) glossary = 'Weaver = నేత పనివారు (NOT నాట్యకారుడు)';
  if (targetLangCode === 'te') glossary += '\nScheme = పథకం\nApply = దరఖాస్తు చేయండి\nFree = ఉచిత';

  // Detect if content is structured JSON (new format)
  let parsed = null;
  try { parsed = JSON.parse(contentEn); } catch (e) { /* plain text path */ }

  if (parsed && parsed.sections && parsed.faqs) {
    // ── JSON PATH: translate text fields, preserve structure ──
    const toTranslate = { intro: parsed.intro, tableOfContents: parsed.tableOfContents, sections: parsed.sections, faqs: parsed.faqs };
    const prompt = `You are an expert native ${langName} translator for SchemeAtlas.
Translate this government scheme guide from English to natural, conversational ${langName}.

Rules:
- Translate naturally — NOT robotic Google Translate style.
- Blend common English words where people actually use them (apply, online, website, documents, form, scheme).
- Keep all emojis exactly as-is.
- Keep the JSON structure identical — same keys, same array lengths.
${glossary ? `- GLOSSARY: ${glossary}` : ''}

Return ONLY valid JSON (no markdown fences) with the translated fields:
${JSON.stringify(toTranslate, null, 2)}`;

    const raw = await callLLM(prompt, 4000);
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const translated = JSON.parse(cleaned);
      return JSON.stringify({ ...parsed, ...translated });
    } catch (e) {
      console.warn(`   ⚠️ ${langName} JSON translation parse failed: ${e.message}`);
      return null;
    }
  } else {
    // ── PLAIN TEXT PATH: backward compat for old format articles ──
    const prompt = `You are an expert native ${langName} translator for government scheme guides.
Translate the following English text into natural, conversational ${langName} for citizens of ${stateContext}.
- Do NOT use formal, textbook language. Speak like a helpful friend.
- Blend common English words where appropriate.
- Maintain the exact same numbered structure.
${glossary ? `- GLOSSARY: ${glossary}` : ''}

Translate:
${contentEn}`;
    return await callLLM(prompt, 3000);
  }
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
    query = query.eq('is_seo_optimized', false);
    
    // Master automation pipeline (isBulk=false) only touches recent discoveries
    // to prevent churning through the entire database automatically.
    // Manual bulk generation (isBulk=true) will process ALL unoptimized schemes regardless of date.
    if (!isBulk) {
      query = query.gte('discovered_at', '2026-05-01T00:00:00Z');
    }
    
    query = query
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
