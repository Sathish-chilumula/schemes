/**
 * SchemeAtlas — Civic News & Jobs Discovery Agent
 * 
 * Specifically hunts for non-scheme content: 
 * 1. Govt Job Recruitment (Vacancies, Salary)
 * 2. Cabinet Decisions & Policy Changes
 * 3. Document Alerts (Aadhaar, PAN, Passport)
 * 
 * Powered by Google News RSS + Gemini 2.0 Flash.
 */

const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require('crypto');

// --- CONFIG ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error("❌ Missing environment variables (SUPABASE or GEMINI).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const parser = new XMLParser();

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

async function main() {
  console.log("🚀 Civic News & Jobs Agent Starting...");
  
  for (const feed of RSS_FEEDS) {
    try {
      console.log(`📡 Fetching: ${feed.url}`);
      const res = await axios.get(feed.url, { timeout: 15000 });
      const data = parser.parse(res.data);
      const items = data.rss?.channel?.item || [];

      // Process top 10 items per feed to avoid exhaustion
      for (const item of items.slice(0, 10)) {
        await processItem(item, feed.type);
      }
    } catch (e) {
      console.error(`❌ Feed failure: ${e.message}`);
    }
  }
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

  if (existing) return;

  console.log(`✨ New Content Found: ${title}`);

  // 2. Extract and Rewrite using AI
  const aiResult = await rewriteWithAI(title, sourceUrl, hintType);
  if (!aiResult) return;

  // 3. Save to Supabase
  const { error } = await supabase.from('schemes').insert({
    name: aiResult.name,
    slug: aiResult.slug,
    category: aiResult.category,
    country_code: 'IN', // Default to India for these feeds
    content_en: aiResult.content_en,
    what_you_get: aiResult.what_you_get, // Salary for jobs, Summary for news
    eligibility: aiResult.eligibility, // {vacancies, criteria} for jobs, {impact} for news
    how_to_apply: aiResult.how_to_apply,
    source_url: sourceUrl,
    source_hash: sourceHash,
    is_published: true,
    is_central: true, // Most news/jobs from these feeds are central
    is_active: true
  });

  if (error) console.error(`❌ DB Error: ${error.message}`);
  else console.log(`✅ Published: ${aiResult.name} [Type: ${aiResult.category}]`);
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
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clear any markdown code block artifacts
    const jsonStr = text.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.warn(`⚠️ AI failure for ${title}: ${e.message}`);
    return null;
  }
}

main();
