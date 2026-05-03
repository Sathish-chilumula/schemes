/**
 * SchemeAtlas — Civic News & Jobs Discovery Agent
 * 
 * Specifically hunts for non-scheme content: 
 * 1. Govt Job Recruitment (Vacancies, Salary)
 * 2. Cabinet Decisions & Policy Changes
 * 3. Document Alerts (Aadhaar, PAN, Passport)
 * 
 * AI Providers (cascading fallback):
 *   Tier 1: Gemini 2.5 Flash Lite (free, fast)
 *   Tier 2: Cloudflare Workers AI (Llama 3.1 8B - efficient)
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// --- CONFIG ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'mRrS9UjMl45wy4Hy-Pm6oMv7TGG55Sb-o6VLDxcJQOA';

// ─── LIMITS ────────────────────────────────────────────────────────
const MAX_NEW_ITEMS_TOTAL = 50; // Daily cap to preserve AI quota
const MAX_AGE_HOURS = 48; // Ignore noise older than 2 days

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Gemini SDK
let geminiModel = null;
if (GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    console.log("✅ Gemini 2.5 Flash Lite initialized (Tier 1 - Primary)");
  } catch (e) {
    console.warn("⚠️ Gemini SDK init failed.");
  }
}

if (OPENAI_API_KEY) {
  console.log('✅ OpenAI GPT-4o-mini configured (Tier 3 - Fallback 2)');
} else {
  console.warn('⚠️ OPENAI_API_KEY not set');
}
if (GROQ_API_KEY) {
  console.log('✅ Groq configured (Tier 2 - Fallback)');
}
if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
  console.log('✅ Cloudflare Workers AI configured (Tier 3 - Last resort)');
}

const parser = new XMLParser();
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
const CURRENT_YEAR = new Date().getFullYear();

const RSS_FEEDS = [
  { url: `https://news.google.com/rss/search?q=government+jobs+notification+india+ssc+upsc+railway+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'job' },
  { url: `https://news.google.com/rss/search?q=sarkari+naukri+latest+vacancy+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'job' },
  { url: `https://news.google.com/rss/search?q=Aadhaar+update+UIDAI+PAN+card+deadline+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'alert' },
  { url: `https://news.google.com/rss/search?q=cabinet+decisions+india+today+pib+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'news' },
  { url: `https://news.google.com/rss/search?q=india+finance+budget+decisions+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'budget' }
];

// ─── IMAGE FETCHING (PEXELS + UNSPLASH FALLBACK) ────────────────
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'ew5YCrng0KjGO4zOZvLg2Vq4XNJ20arQsBERm9v10Ydz4hWsDQpYIx42';

async function fetchUnsplashImage(keyword) {
  try {
    const cleanKeyword = `${keyword} government office buildings india`.substring(0, 50);
    const res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanKeyword)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`, { timeout: 8000 });
    if (res.data && res.data.results && res.data.results.length > 0) {
      return res.data.results[0].urls.regular;
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function fetchSchemeImage(keyword) {
  if (!keyword) return null;
  try {
    const cleanKeyword = `${keyword} india professional`.substring(0, 50);
    const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanKeyword)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_API_KEY },
      timeout: 10000
    });
    
    if (res.data && res.data.photos && res.data.photos.length > 0) {
      const img = res.data.photos[0];
      console.log(`     📸 Found Pexels Image: ${img.src.large}`);
      return img.src.large;
    }
    
    // Fallback to Unsplash
    console.log(`     ⚠️ Pexels returned no results. Falling back to Unsplash...`);
    const unsplashUrl = await fetchUnsplashImage(keyword);
    if (unsplashUrl) console.log(`     📸 Found Unsplash Image (Fallback): ${unsplashUrl}`);
    return unsplashUrl;
  } catch (error) {
    console.log(`     🔄 Pexels API failed. Falling back to Unsplash...`);
    const unsplashUrl = await fetchUnsplashImage(keyword);
    if (unsplashUrl) console.log(`     📸 Found Unsplash Image (Fallback): ${unsplashUrl}`);
    return unsplashUrl;
  }
}

// ─── CASCADING AI CALL (Groq → Gemini → OpenAI) ─────────────
async function callAI(prompt, maxTokens = 2000) {
  // TIER 1: Groq (Primary)
  if (GROQ_API_KEY) {
    try {
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      }, {
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 20000
      });
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 50) return text;
    } catch (e) {
      console.warn(`     ⚠️ Groq Error: ${e.response?.data?.error?.message || e.message}`);
    }
  }

  // TIER 2: Gemini (Fallback 1)
  if (geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      if (text && text.length > 50) return text;
    } catch (e) {
      if (e.message?.includes('429') || e.message?.includes('quota')) {
        console.warn('     ⏳ Gemini Quota Reached. Falling back...');
      } else {
        console.error('     ⚠️ Gemini Error:', e.message);
      }
    }
  }

  // TIER 3: OpenAI (Fallback 2)
  if (OPENAI_API_KEY) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      }, {
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 30000
      });
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 50) return text;
    } catch (e) {
      console.error('     ⚠️ OpenAI Error:', e.response?.data?.error?.message || e.message);
    }
  }

  // TIER 4: Cloudflare (Last resort)
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    try {
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
        { model: '@cf/meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: prompt }] },
        { headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' }, timeout: 40000 }
      );
      const text = response.data?.choices?.[0]?.message?.content || response.data?.result?.response;
      if (text && text.length > 50) return text;
    } catch (e) {
      console.error('     ⚠️ Cloudflare Error:', e.message);
    }
  }

  return null;
}

// ─── TITLE & FRESHNESS HELPERS ────────────────────────────────────
function cleanTitle(rawTitle) {
  return (rawTitle || '').replace(/\s*[-–|:]\s*(Adda247|Careers360|NDTV|Times of India|Hindustan Times|Jagran Josh|LiveMint|Sarkari Result|FreeJobAlert|Employment News|Moneycontrol|India Today).*$/gi, '').trim();
}

function isFresh(pubDate) {
  if (!pubDate) return true;
  const published = new Date(pubDate);
  return (new Date() - published) / (1000 * 60 * 60) <= MAX_AGE_HOURS;
}

// ─── MAIN RUNNER ───────────────────────────────────────────────────
async function main() {
  console.log("🚀 Civic News Discovery Agent Starting...");
  console.log(`📊 Session Cap: ${MAX_NEW_ITEMS_TOTAL} new articles`);
  
  let newPublishedCount = 0;

  for (const feed of RSS_FEEDS) {
    if (newPublishedCount >= MAX_NEW_ITEMS_TOTAL) break;

    try {
      console.log(`\n📡 Checking: ${feed.url.substring(0, 70)}...`);
      const res = await axios.get(feed.url, { timeout: 15000 });
      const data = parser.parse(res.data);
      const items = data.rss?.channel?.item || [];

      for (const item of items.slice(0, 15)) {
        if (newPublishedCount >= MAX_NEW_ITEMS_TOTAL) break;
        if (!isFresh(item.pubDate)) continue;

        const sourceHash = crypto.createHash('md5').update(item.link).digest('hex');
        
        // Deduplicate check (URL Hash + Slug)
        const { data: existing } = await supabase.from('schemes').select('id').eq('source_hash', sourceHash).single();
        if (existing) continue;

        // Peak ahead for slug collision
        const tempSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
        const { data: existingSlug } = await supabase.from('schemes').select('id').eq('slug', `${tempSlug}-in`).single();
        if (existingSlug) continue;

        const result = await processItem(item, feed.type);
        if (result === 'published') newPublishedCount++;
      }
    } catch (e) {
      console.error(`❌ Feed failure: ${e.message}`);
    }
  }
  
  console.log('\n━'.repeat(50));
  console.log(`🏁 FINISHED! Total Published This Run: ${newPublishedCount}`);
}

async function processItem(item, hintType) {
  const cleanedTitle = cleanTitle(item.title);
  console.log(`\n✨ NEW: ${cleanedTitle}`);

  // 1. Generate English
  const englishContent = await rewriteWithAI(cleanedTitle, item.link, hintType);
  if (!englishContent) return 'failed';

  // 2. Fetch Visual Image (Attractive content)
  const imgKeyword = hintType === 'job' 
    ? `${englishContent.name} government job recruitment office india` 
    : `${englishContent.name} government news announcement india`;
  const imageUrl = await fetchSchemeImage(imgKeyword);

  // 3. Generate Translations (Optional fallbacks)
  let hiContent = null;
  let teContent = null;
  
  try {
    console.log(`   ⏳ Translating to Hindi & Telugu...`);
    // Build a translatable subset of the structured JSON
    let enForTranslation = englishContent.content_en;
    let isJsonContent = false;
    try {
      const parsed = JSON.parse(englishContent.content_en);
      if (parsed && parsed.sections) {
        isJsonContent = true;
        enForTranslation = JSON.stringify({ intro: parsed.intro, tableOfContents: parsed.tableOfContents, sections: parsed.sections, faqs: parsed.faqs }, null, 2);
      }
    } catch (e) { /* plain text */ }

    const transPrompt = isJsonContent
      ? `You are an expert Hindi and Telugu translator for SchemeAtlas.
Translate this government guide from English to natural, conversational Hindi AND Telugu.
Rules:
- Do NOT use formal, robotic language. Speak like a helpful friend.
- Blend common English words naturally (apply, online, website, documents, form).
- Keep all emojis exactly as-is.
- Keep JSON structure identical — same keys, same array lengths.
Respond ONLY with valid JSON: {"hi": {<same JSON structure in Hindi>}, "te": {<same JSON structure in Telugu>}}

${enForTranslation}`
      : `Translate the following government overview into Hindi and Telugu. 
Rules:
- Do NOT use formal language. Use conversational everyday style.
- Blend in common English words (apply, online, website, jobs, documents) so it is extremely easy to understand.
Respond with ONLY valid JSON: {"hi": "Hindi text", "te": "Telugu text"}\n\n${enForTranslation}`;

    const transText = await callAI(transPrompt, 3000);
    if (transText) {
      const transJson = JSON.parse(transText.replace(/```json|```/g, '').trim());
      if (isJsonContent) {
        // Rebuild full structured JSON for each language
        const baseParsed = JSON.parse(englishContent.content_en);
        hiContent = transJson.hi ? JSON.stringify({ ...baseParsed, ...transJson.hi }) : null;
        teContent = transJson.te ? JSON.stringify({ ...baseParsed, ...transJson.te }) : null;
      } else {
        hiContent = transJson.hi;
        teContent = transJson.te;
      }
    }
  } catch (e) {
    console.warn('   ⚠️ Translation step skipped or failed.');
  }

  // 4. Save to Database
  const { error } = await supabase.from('schemes').insert({
    name: englishContent.name,
    slug: englishContent.slug,
    category: englishContent.category,
    content_en: englishContent.content_en,
    content_hi: hiContent,
    content_local: teContent,
    local_language: 'te',
    image_url: imageUrl,
    what_you_get: englishContent.what_you_get,
    eligibility: englishContent.eligibility,
    how_to_apply: englishContent.how_to_apply,
    source_url: item.link,
    source_hash: crypto.createHash('md5').update(item.link).digest('hex'),
    is_published: true,
    is_central: true,
    country_code: 'IN',
    is_active: true
  });

  if (error) {
    console.error(`   ❌ DB Error: ${error.message}`);
    return 'failed';
  }
  
  console.log(`   ✅ PUBLISHED: ${englishContent.name}`);
  return 'published';
}

async function rewriteWithAI(title, url, hintType) {
  const prompt = `You are a senior content writer at SchemeAtlas writing a premium Money Guide-style article.
Write a comprehensive, 1200-word guide about this government news or job notification.
Tone: Conversational, authoritative, friendly. Easy to understand.

Title: "${title}"
URL: "${url}"
Type: ${hintType}

RULES:
- NEVER use markdown symbols (#, *, **). Plain text and emojis only.
- Be specific with salary/benefits in exact ₹ amounts.
- No placeholder text.

Return ONLY valid JSON (no markdown fences, no extra text):
{
  "name": "Clean, short, catchy title",
  "slug": "url-friendly-slug-max-8-words",
  "category": "${hintType}",
  "what_you_get": "1-sentence summary of benefit or salary",
  "eligibility": "1-2 sentences on who can apply",
  "how_to_apply": "3-4 simple steps as plain text",
  "content_en": {
    "intro": "2-3 punchy hook sentences explaining what this is and who it affects.",
    "tableOfContents": ["What Is This?", "Key Benefits 💰", "Who Is Eligible? ✅", "Who Cannot Apply? 🚫", "Documents Required 📄", "How To Apply 📝", "Important Dates 📅", "Pro Tips 💡"],
    "sections": [
      {"heading": "📋 What Is This?", "content": "150-word explanation of the news/job and the department behind it."},
      {"heading": "💰 Key Benefits / Salary", "content": "Exact ₹ salary range or financial benefit. Be specific."},
      {"heading": "✅ Who Is Eligible?", "content": "Age, qualification, nationality, experience requirements."},
      {"heading": "🚫 Who Cannot Apply?", "content": "Clear real-life examples of ineligible people."},
      {"heading": "📄 Documents Required", "content": "Exact list: Aadhaar, degree certificate, experience letter, etc."},
      {"heading": "📝 How To Apply — Step by Step", "content": "Numbered steps. Mention the official portal URL: ${url}"},
      {"heading": "📅 Important Dates", "content": "Last date to apply, exam date, result date if known."},
      {"heading": "💡 Pro Tips", "content": "2 insider tips to improve chances of selection."}
    ],
    "faqs": [
      {"q": "Who can apply for this?", "a": "Direct specific answer."},
      {"q": "What is the salary or benefit?", "a": "Direct answer with ₹ amount."},
      {"q": "How to apply online?", "a": "Step-by-step direct answer."},
      {"q": "What is the last date to apply?", "a": "Direct answer with date if known."}
    ]
  }
}`;

  try {
    const text = await callAI(prompt, 3000);
    if (!text) return null;
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    // Stringify the nested content_en JSON so it can be stored as text in Supabase
    if (parsed.content_en && typeof parsed.content_en === 'object') {
      parsed.content_en = JSON.stringify(parsed.content_en);
    }
    return parsed;
  } catch (e) { return null; }
}

main().catch(e => console.error(e));
