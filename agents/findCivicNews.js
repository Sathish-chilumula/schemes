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

const RSS_FEEDS = [
  // Job specific
  { url: 'https://news.google.com/rss/search?q=government+jobs+notification+india+ssc+upsc+railway+2025+2026&hl=en-IN&gl=IN&ceid=IN:en', type: 'job' },
  // Aadhaar/Document specific
  { url: 'https://news.google.com/rss/search?q=Aadhaar+update+UIDAI+PAN+card+deadline+news&hl=en-IN&gl=IN&ceid=IN:en', type: 'news' },
  // Budget/Cabinet
  { url: 'https://news.google.com/rss/search?q=cabinet+decisions+india+news+today+pib&hl=en-IN&gl=IN&ceid=IN:en', type: 'news' },
  // Finance/Budget
  { url: 'https://news.google.com/rss/search?q=india+finance+budget+decisions+highlights+2026&hl=en-IN&gl=IN&ceid=IN:en', type: 'news' }
];

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
            timeout: 30000
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
  console.log('━'.repeat(55));
  
  let published = 0;
  let skipped = 0;
  let failed = 0;

  for (const feed of RSS_FEEDS) {
    try {
      console.log(`\n📡 Fetching: ${feed.url}`);
      const res = await axios.get(feed.url, { timeout: 15000 });
      const data = parser.parse(res.data);
      const items = data.rss?.channel?.item || [];

      // Process top 10 items per feed to avoid exhaustion
      for (const item of items.slice(0, 10)) {
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
  console.log(`🏁 Finished! Published: ${published} | Skipped (existing): ${skipped} | Failed: ${failed}`);
}

async function processItem(item, hintType) {
  const sourceUrl = item.link;
  const title = item.title;
  const sourceHash = crypto.createHash('md5').update(sourceUrl).digest('hex');

  // 1. Check if already exists
  const { data: existing } = await supabase
    .from('schemes')
    .select('id')
    .eq('source_hash', sourceHash)
    .single();

  if (existing) return 'skipped';

  console.log(`\n✨ New Content Found: ${title}`);

  // 2. Extract and Rewrite using AI
  const aiResult = await rewriteWithAI(title, sourceUrl, hintType);
  if (!aiResult) return 'failed';

  // 3. Save to Supabase
  const { error } = await supabase.from('schemes').insert({
    name: aiResult.name,
    slug: aiResult.slug,
    category: aiResult.category,
    country_code: 'IN',
    content_en: aiResult.content_en,
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
  console.log(`✅ Published: ${aiResult.name} [Type: ${aiResult.category}]`);
  return 'published';
}

async function rewriteWithAI(title, url, hintType) {
  const prompt = `
    You are an expert Government News Editor. Rewrite the following government update/job notification into a clear, helpful guide for common citizens.
    
    Source Title: "${title}"
    Source URL: "${url}"
    Hinted Category: ${hintType}
    
    Return ONLY a JSON object with this exact structure:
    {
      "name": "Short Clear Name (max 10 words)",
      "slug": "url-friendly-slug",
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
      "content_en": "A human-like Overview of the decision/job. Wrap this in 2 paragraphs. Do NOT include markdown headers. Just plain text with newlines."
    }
    
    IMPORTANT: 
    - If it's a JOB, provide EXACT vacancy numbers and salary if mention in the title or common knowledge for this post.
    - If it is about a Government Decision (Cabinet), explain exactly how it impacts the ordinary person.
    - Keep formatting simple. NO '#' or '**'.
  `;

  try {
    const text = await callAI(prompt);
    // Clear any markdown code block artifacts
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`⚠️ AI failure for ${title}: ${e.message}`);
    return null;
  }
}

main().catch(e => { console.error('💥 Fatal error:', e); process.exit(1); });
