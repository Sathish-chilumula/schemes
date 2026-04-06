/**
 * SchemeAtlas — Civic News & Jobs Discovery Agent
 * 
 * Specifically hunts for non-scheme content: 
 * 1. Govt Job Recruitment (Vacancies, Salary)
 * 2. Cabinet Decisions & Policy Changes
 * 3. Document Alerts (Aadhaar, PAN, Passport)
 * 
 * AI Providers (cascading fallback):
 *   Tier 1: Gemini 2.0 Flash (free, fast)
 *   Tier 2: Cloudflare Workers AI (free tier, reliable)
 * 
 * Translations: English + Hindi + Telugu for all content.
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

// Only keep items published within the last 48 hours
const MAX_AGE_HOURS = 48;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE environment variables.");
  process.exit(1);
}

if (!GEMINI_API_KEY && !CLOUDFLARE_API_TOKEN) {
  console.error("❌ Missing AI provider credentials. Need at least GEMINI_API_KEY or CLOUDFLARE_API_TOKEN.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Gemini SDK (optional — only if key is available)
let geminiModel = null;
if (GEMINI_API_KEY) {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log("✅ Gemini 2.0 Flash initialized (Tier 1)");
  } catch (e) {
    console.warn("⚠️ Gemini SDK init failed:", e.message);
  }
}

if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
  console.log("✅ Cloudflare Workers AI configured (Tier 2 fallback)");
}

const parser = new XMLParser();

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// Get current year dynamically so feeds never go stale
const CURRENT_YEAR = new Date().getFullYear();

const RSS_FEEDS = [
  // Job specific — current year only
  { url: `https://news.google.com/rss/search?q=government+jobs+notification+india+ssc+upsc+railway+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'job' },
  { url: `https://news.google.com/rss/search?q=sarkari+naukri+latest+vacancy+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'job' },
  // Aadhaar/Document specific
  { url: `https://news.google.com/rss/search?q=Aadhaar+update+UIDAI+PAN+card+deadline+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'alert' },
  // Budget/Cabinet
  { url: `https://news.google.com/rss/search?q=cabinet+decisions+india+today+pib+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'news' },
  // Finance/Budget
  { url: `https://news.google.com/rss/search?q=india+finance+budget+decisions+${CURRENT_YEAR}&hl=en-IN&gl=IN&ceid=IN:en&when=2d`, type: 'budget' }
];

// ─── TITLE CLEANER ───────────────────────────────────────────────
// Strips source website names like "- Adda247", "| Careers360", "- NDTV" etc. from RSS titles
function cleanTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    // Remove " - SourceName" or " | SourceName" at the end
    .replace(/\s*[-–|]\s*[A-Za-z0-9\s.]+$/, '')
    // Remove leftover whitespace
    .trim();
}

// ─── DATE FRESHNESS CHECK ────────────────────────────────────────
// Returns true if the item was published within MAX_AGE_HOURS
function isFreshItem(item) {
  const pubDate = item.pubDate;
  if (!pubDate) return true; // If no date, process it anyway (let AI decide relevance)
  
  try {
    const published = new Date(pubDate);
    const now = new Date();
    const ageMs = now - published;
    const ageHours = ageMs / (1000 * 60 * 60);
    
    if (ageHours > MAX_AGE_HOURS) {
      return false;
    }
    return true;
  } catch {
    return true; // Can't parse date? Let it through.
  }
}

// ─── CASCADING AI CALL ────────────────────────────────────────────
async function callAI(prompt) {
  // --- TIER 1: Gemini 2.0 Flash ---
  if (geminiModel) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        console.log(`     🤖 Tier 1: Gemini 2.0 Flash (attempt ${attempt + 1})...`);
        const result = await geminiModel.generateContent(prompt);
        const text = result.response.text();
        if (text && text.length > 100) return text;
      } catch (e) {
        const isQuota = e.message?.includes('429') || e.message?.includes('quota') || e.message?.includes('RESOURCE_EXHAUSTED');
        if (isQuota) {
          console.warn('     ⚠️ Gemini quota exhausted — falling through to Tier 2');
          break; // Don't retry, jump to Cloudflare immediately
        }
        console.warn(`     ⚠️ Gemini attempt ${attempt + 1} failed: ${e.message}`);
        await delay(3000);
      }
    }
  }

  // --- TIER 2: Cloudflare Workers AI ---
  if (CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        console.log(`     🤖 Tier 2: Cloudflare Workers AI (attempt ${attempt + 1})...`);
        const response = await axios.post(
          `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`,
          {
            model: '@cf/google/gemma-4-26b-a4b-it',
            messages: [{ role: 'user', content: prompt }]
          },
          {
            headers: {
              'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
              'Content-Type': 'application/json'
            },
            timeout: 45000
          }
        );

        // Cloudflare returns in two possible shapes depending on the endpoint
        const text = response.data?.choices?.[0]?.message?.content?.trim()
          || response.data?.result?.response?.trim();

        if (text && text.length > 100) {
          console.log(`     ✅ Cloudflare returned ${text.length} chars`);
          return text;
        }
        console.warn(`     ⚠️ Cloudflare returned empty/short response`);
      } catch (e) {
        console.warn(`     ⚠️ Cloudflare attempt ${attempt + 1} failed: ${e.response?.data?.errors?.[0]?.message || e.message}`);
        await delay(4000);
      }
    }
  }

  throw new Error('All AI providers exhausted');
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 Civic News & Jobs Agent Starting...");
  console.log(`📅 Current Year: ${CURRENT_YEAR} | Max Item Age: ${MAX_AGE_HOURS}h`);
  console.log('━'.repeat(55));
  
  let published = 0;
  let skipped = 0;
  let stale = 0;
  let failed = 0;

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`\n📡 Fetching [${feed.type}]: ${feed.url.substring(0, 80)}...`);
      const res = await axios.get(feed.url, { timeout: 15000 });
      const data = parser.parse(res.data);
      const items = data.rss?.channel?.item || [];
      console.log(`   Found ${items.length} items in feed`);

      // Process top 8 items per feed
      for (const item of items.slice(0, 8)) {
        // Filter stale items
        if (!isFreshItem(item)) {
          stale++;
          continue;
        }
        
        const result = await processItem(item, feed.type);
        if (result === 'published') published++;
        else if (result === 'skipped') skipped++;
        else failed++;
      }
    } catch (e) {
      console.error(`❌ Feed failure: ${e.message}`);
    }
  }

  console.log('\n' + '━'.repeat(55));
  console.log(`🏁 Finished! Published: ${published} | Skipped: ${skipped} | Stale (filtered): ${stale} | Failed: ${failed}`);
}

async function processItem(item, hintType) {
  const sourceUrl = item.link;
  const rawTitle = item.title;
  const cleanedTitle = cleanTitle(rawTitle);
  const sourceHash = crypto.createHash('md5').update(sourceUrl).digest('hex');

  // 1. Check if already exists
  const { data: existing } = await supabase
    .from('schemes')
    .select('id')
    .eq('source_hash', sourceHash)
    .single();

  if (existing) return 'skipped';

  console.log(`\n✨ New: ${cleanedTitle}`);

  // 2. Generate English content using AI
  const aiResult = await rewriteWithAI(cleanedTitle, sourceUrl, hintType);
  if (!aiResult) return 'failed';

  // 3. Translate to Hindi
  let contentHi = null;
  try {
    console.log(`   ⏳ Translating to Hindi...`);
    const hiPrompt = `Translate the following government news article to Hindi.
Rules:
- Use natural, conversational Hindi. Write as if talking to a friend.
- Do NOT use any markdown symbols like **, #, or bullet points.
- Keep the same paragraph structure as the original.
- Do NOT add any extra sections or headers.

Original:
${aiResult.content_en}`;
    contentHi = await callAI(hiPrompt);
    console.log(`   ✅ Hindi: ${contentHi?.length || 0} chars`);
  } catch (e) {
    console.warn(`   ⚠️ Hindi translation failed: ${e.message}`);
  }

  // 4. Translate to Telugu
  let contentLocal = null;
  try {
    console.log(`   ⏳ Translating to Telugu...`);
    const tePrompt = `Translate the following government news article to Telugu.
Rules:
- Use natural, conversational Telugu. Write as if talking to a friend.
- Do NOT use any markdown symbols like **, #, or bullet points.
- Keep the same paragraph structure as the original.
- Do NOT add any extra sections or headers.

Original:
${aiResult.content_en}`;
    contentLocal = await callAI(tePrompt);
    console.log(`   ✅ Telugu: ${contentLocal?.length || 0} chars`);
  } catch (e) {
    console.warn(`   ⚠️ Telugu translation failed: ${e.message}`);
  }

  // 5. Save to Supabase (with all 3 languages)
  const { error } = await supabase.from('schemes').insert({
    name: aiResult.name,
    slug: aiResult.slug,
    category: aiResult.category,
    country_code: 'IN',
    content_en: aiResult.content_en,
    content_hi: contentHi,
    content_local: contentLocal,
    local_language: 'te',
    what_you_get: aiResult.what_you_get,
    eligibility: aiResult.eligibility,
    how_to_apply: aiResult.how_to_apply,
    source_url: sourceUrl,
    source_hash: sourceHash,
    is_published: true,
    is_central: true,
    is_active: true
  });

  if (error) {
    console.error(`❌ DB Error: ${error.message}`);
    return 'failed';
  }
  console.log(`✅ Published: ${aiResult.name} [${aiResult.category}] (EN + HI + TE)`);
  return 'published';
}

async function rewriteWithAI(title, url, hintType) {
  const prompt = `
    You are an expert Government News Editor for SchemeAtlas. Rewrite the following government update/job notification into a clear, helpful guide for common citizens.
    
    Source Title: "${title}"
    Source URL: "${url}"
    Hinted Category: ${hintType}
    
    Return ONLY a JSON object with this exact structure:
    {
      "name": "Short Clear Name (max 10 words). Do NOT include any website names like Adda247, Careers360, NDTV, etc.",
      "slug": "url-friendly-slug-without-website-names",
      "category": "Choose one: job, news, alert, budget",
      "what_you_get": "For JOBS: Salary/Pay scale. For NEWS: The core benefit or decision summary.",
      "eligibility": {
        "vacancies": "For JOBS: Number of posts (e.g. 500+). For NEWS: null",
        "audience": "Who is affected / Who can apply",
        "impact": "For NEWS: What exactly changes for citizens?"
      },
      "how_to_apply": {
        "steps": ["Step 1", "Step 2"],
        "deadline": "Last date if found, else null"
      },
      "content_en": "A human-like overview of the decision/job in 2-3 paragraphs. Write in friendly, conversational tone. Do NOT include markdown headers, asterisks, or any source website names. Just plain text with newlines."
    }
    
    CRITICAL RULES:
    - NEVER include source website names (Adda247, Careers360, NDTV, Times of India, Economic Times, BankersAdda, etc.) anywhere in the output.
    - The "name" field should be a clean, generic government-style title like "SSC CGL 2026 Recruitment Notification" not "SSC CGL 2026 - Adda247".
    - If it's a JOB, provide EXACT vacancy numbers and salary if mentioned in the title.
    - If it is about a Government Decision (Cabinet), explain exactly how it impacts the ordinary person.
    - Keep formatting simple. NO '#' or '**'.
    - Only include information relevant to the CURRENT year (${new Date().getFullYear()}).
  `;

  try {
    const text = await callAI(prompt);
    // Clear any markdown code block artifacts
    const jsonStr = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Final safety net: strip any remaining source names from the name/slug
    const sourcePatterns = /\s*[-–|:]\s*(Adda247|Careers360|NDTV|Times of India|Economic Times|BankersAdda|India Today|The Hindu|Hindustan Times|LiveMint|Jagran Josh|Sarkari Result|FreeJobAlert|Employment News|News18|OneIndia|Moneycontrol).*$/gi;
    parsed.name = (parsed.name || '').replace(sourcePatterns, '').trim();
    parsed.slug = (parsed.slug || '').replace(/(adda247|careers360|ndtv|bankersadda|jagran-josh|sarkari-result|freejob)/gi, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

    return parsed;
  } catch (e) {
    console.warn(`⚠️ AI failure for ${title}: ${e.message}`);
    return null;
  }
}

main().catch(e => { console.error('💥 Fatal error:', e); process.exit(1); });
