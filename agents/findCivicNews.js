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
    console.log("✅ Gemini 2.5 Flash Lite initialized (Tier 1)");
  } catch (e) {
    console.warn("⚠️ Gemini SDK init failed.");
  }
}

if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
  console.log("✅ Cloudflare Workers AI configured (Tier 2 - Llama 3.1 8B)");
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

// ─── CASCADING AI CALL ────────────────────────────────────────────
async function callAI(prompt) {
  // TIER 1: Gemini
  if (geminiModel) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      if (text && text.length > 50) return text;
    } catch (e) {
      if (e.message?.includes('429') || e.message?.includes('quota')) {
        console.warn('     ⏳ Gemini Quota Reached. Falling back to Cloudflare...');
      } else {
        console.error('     ⚠️ Gemini Error:', e.message);
      }
    }
  }

  // TIER 2: Cloudflare (Efficient Llama 3.1 8B)
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    try {
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
        {
          model: '@cf/meta/llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
          timeout: 40000
        }
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
    const transPrompt = `Translate the following government overview into Hindi and Telugu. 
Rules for translation:
- Do NOT use formal, pure, or textbook language. 
- Use a highly conversational, everyday spoken style. 
- Blend in common English words (like "apply", "online", "website", "jobs", "documents") so it is extremely easy for everyone to understand.
Respond with ONLY valid JSON: {"hi": "Hindi text", "te": "Telugu text"}\n\n${englishContent.content_en}`;
    const transText = await callAI(transPrompt);
    if (transText) {
      const transJson = JSON.parse(transText.replace(/```json|```/g, ''));
      hiContent = transJson.hi;
      teContent = transJson.te;
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
  const prompt = `You are a helpful friend and expert SEO content writer writing for a citizen who needs clear information. 
  Rewrite this government update/job in a HIGH-QUALITY, TRUSTWORTHY, and CONVERSATIONAL style (8th-grade level).
  Write as if you are explaining it to a neighbor. Use short sentences. Avoid technical jargon.
  
  Structure Rule: You MUST follow this exact 14-point structure. Use clear numeric labels (e.g. "1. Title:").
  DO NOT use any markdown symbols like asterisks (**), hashes (#), or bullet points. Use plain text only.
  
  1. Title: Very simple, catchy name of the job or news.
  2. Summary: 5-10 lines. Friendly overview of what it is.
  3. What is this Update?: Purpose and Department details in simple words.
  4. Key Benefits / Salary: Exact money (₹) or salary range or benefits. Be specific.
  5. Eligibility Criteria: Simple list of who can apply / who this affects.
  6. Who Should Apply: Real-life examples of people who should join or care.
  7. Who Should NOT Apply: Clear examples of people who are not eligible.
  8. Documents Required: Clear list of papers needed.
  9. Selection / Approval Process: Step-by-step in plain words.
  10. How to Apply: Simple steps anyone can follow.
  11. Important Dates: Last date to apply or key deadlines.
  12. Official Website / Link: Provide the verified URL as plain text: ${url}
  13. FAQs: 3 friendly questions and answers. Use "Q: " and "A: " prefixes.
  14. Pro Tips: Simple advice to help the user succeed.

  Title: "${title}"
  URL: "${url}"
  Type: ${hintType}

  Respond ONLY with valid JSON in this format:
  {
    "name": "Clean short title",
    "slug": "url-friendly-slug",
    "category": "${hintType}",
    "what_you_get": "1-sentence benefit/salary",
    "eligibility": "1nd-2 sentences who can apply",
    "how_to_apply": "3-4 simple steps",
    "content_en": "The FULL 14-point article text exactly as requested above"
  }`;

  try {
    const text = await callAI(prompt);
    if (!text) return null;
    return JSON.parse(text.replace(/```json|```/g, ''));
  } catch (e) { return null; }
}

main().catch(e => console.error(e));
