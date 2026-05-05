// ============================================
// CLAIMIT — SCHEME FINDER AGENT
// agents/findSchemes.js
// Runs via GitHub Actions every 6 hours
// ============================================

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Parser = require('rss-parser');
const axios = require('axios');
const crypto = require('crypto');

const DRY_RUN = process.env.DRY_RUN === 'true';

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const groqKey = process.env.GROQ_API_KEY;
const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
const newsdataKey = process.env.NEWSDATA_API_KEY;

if (!url || !key) {
  console.error('\n❌ CRITICAL STARTUP ERROR ❌');
  console.error('Supabase environment variables are missing!');
  process.exit(1);
}

const supabase = createClient(url, key);
const parser = new Parser();

// Initialize Gemini SDK
let genAI = null;
let geminiModel = null;
if (geminiKey) {
  try {
    genAI = new GoogleGenerativeAI(geminiKey);
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  } catch (e) {
    console.warn('⚠️ Gemini SDK init failed.');
  }
}

// ============================================
// UNIFIED AI COMPLETION (Groq → Gemini → OpenAI)
// ============================================
async function generateAICompletion(prompt, maxTokens = 2000) {
  // --- TIER 1: GROQ (Primary) ---
  if (groqKey) {
    try {
      console.log('🤖 Tier 1: Groq llama-3.3-70b-versatile...');
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      }, {
        headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
        timeout: 20000
      });
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 50) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 1 (Groq) failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // --- TIER 2: GEMINI (Fallback 1) ---
  if (geminiModel) {
    try {
      console.log('🤖 Tier 2: Gemini 2.5 Flash Lite (fallback 1)...');
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      if (text && text.length > 50) return text;
    } catch (err) {
      if (err.message?.includes('429') || err.message?.includes('quota')) {
        console.warn('     ⏳ Gemini Quota Reached. Falling back...');
      } else {
        console.warn(`⚠️ Tier 2 (Gemini) failed: ${err.message}`);
      }
    }
  }

  // --- TIER 3: OPENAI (Fallback 2) ---
  if (openaiKey) {
    try {
      console.log('🤖 Tier 3: OpenAI GPT-4o-mini (fallback 2)...');
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4
      }, {
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        timeout: 30000
      });
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 50) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 3 (OpenAI) failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // --- TIER 4: CLOUDFLARE (Last resort) ---
  if (cfAccountId && cfApiToken) {
    try {
      console.log('🤖 Tier 4: Cloudflare Workers AI (last resort)...');
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/v1/chat/completions`,
        { model: '@cf/meta/llama-3.1-8b-instruct', messages: [{ role: 'user', content: prompt }] },
        { headers: { 'Authorization': `Bearer ${cfApiToken}`, 'Content-Type': 'application/json' }, timeout: 25000 }
      );
      const text = response.data?.result?.response?.trim() || response.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 50) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 4 (Cloudflare) failed: ${err.message}`);
    }
  }

  return ""; // All tiers exhausted
}

// ============================================
// NEWSDATA.IO — SCHEME DISCOVERY QUERIES
// Replaces Google News RSS (blocked on GitHub Actions IPs)
// ============================================
const NEWSDATA_QUERIES = [
  // ── INDIA: General scheme discovery ────────────────────────────────
  { q: 'government scheme yojana welfare launched india', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'pradhan mantri scheme new benefit subsidy 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'mukhyamantri yojana state government scheme announced', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'scholarship pension housing health scheme india', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'ministry welfare scheme kisan rozgar empowerment', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'government benefit program assistance poor women india', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },

  // ── INDIA: State-specific scheme discovery ──────────────────────────
  // Major states searched individually so we catch CM-level state schemes
  { q: 'government scheme Uttar Pradesh new yojana benefit 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'UP' },
  { q: 'government scheme Maharashtra mukhyamantri yojana 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'MH' },
  { q: 'government scheme Telangana benefit launched 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'TS' },
  { q: 'government scheme Andhra Pradesh AP yojana welfare 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'AP' },
  { q: 'government scheme Karnataka new benefit welfare 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'KA' },
  { q: 'government scheme Tamil Nadu TN yojana launched 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'TN' },
  { q: 'government scheme West Bengal yojana new benefit 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'WB' },
  { q: 'government scheme Gujarat yojana welfare scheme 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'GJ' },
  { q: 'government scheme Rajasthan welfare benefit launched 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'RJ' },
  { q: 'government scheme Kerala welfare benefit yojana 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: 'KL' },

  // ── INDIA: Ministry-specific discovery ─────────────────────────────
  { q: 'Ministry Agriculture scheme kisan farmer benefit india 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'Ministry Education scholarship scheme students india 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'Ministry Health scheme hospital insurance poor india 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'Ministry MSME business loan scheme startup india 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'Ministry Women Child scheme welfare benefit india 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
  { q: 'Ministry Social Justice SC ST OBC disability scheme 2026', country: 'in', lang: 'en', countryCode: 'IN', stateCode: null },
];

// ============================================
// RELIABLE GOV RSS (NON-GOOGLE, WON'T BE BLOCKED)
// ============================================
const RELIABLE_RSS = [
  { url: 'https://pib.gov.in/RssMain.aspx', country: 'IN' },
];

// ============================================
// INDIA: myScheme.gov.in API CONFIG
// ============================================
const INDIAN_STATES = [
  { code: 'AP', name: 'Andhra Pradesh', language: 'te' },
  { code: 'AR', name: 'Arunachal Pradesh', language: 'en' },
  { code: 'AS', name: 'Assam', language: 'as' },
  { code: 'BR', name: 'Bihar', language: 'hi' },
  { code: 'CG', name: 'Chhattisgarh', language: 'hi' },
  { code: 'GA', name: 'Goa', language: 'kok' },
  { code: 'GJ', name: 'Gujarat', language: 'gu' },
  { code: 'HR', name: 'Haryana', language: 'hi' },
  { code: 'HP', name: 'Himachal Pradesh', language: 'hi' },
  { code: 'JH', name: 'Jharkhand', language: 'hi' },
  { code: 'KA', name: 'Karnataka', language: 'kn' },
  { code: 'KL', name: 'Kerala', language: 'ml' },
  { code: 'MP', name: 'Madhya Pradesh', language: 'hi' },
  { code: 'MH', name: 'Maharashtra', language: 'mr' },
  { code: 'MN', name: 'Manipur', language: 'en' },
  { code: 'ML', name: 'Meghalaya', language: 'en' },
  { code: 'MZ', name: 'Mizoram', language: 'en' },
  { code: 'NL', name: 'Nagaland', language: 'en' },
  { code: 'OR', name: 'Odisha', language: 'or' },
  { code: 'PB', name: 'Punjab', language: 'pa' },
  { code: 'RJ', name: 'Rajasthan', language: 'hi' },
  { code: 'SK', name: 'Sikkim', language: 'en' },
  { code: 'TN', name: 'Tamil Nadu', language: 'ta' },
  { code: 'TS', name: 'Telangana', language: 'te' },
  { code: 'TR', name: 'Tripura', language: 'bn' },
  { code: 'UP', name: 'Uttar Pradesh', language: 'hi' },
  { code: 'UK', name: 'Uttarakhand', language: 'hi' },
  { code: 'WB', name: 'West Bengal', language: 'bn' },
  { code: 'DL', name: 'Delhi', language: 'hi' },
  { code: 'JK', name: 'Jammu and Kashmir', language: 'en' },
  { code: 'AN', name: 'Andaman and Nicobar Islands', language: 'en' },
  { code: 'CH', name: 'Chandigarh', language: 'pa' },
  { code: 'DN', name: 'Dadra & Nagar Haveli and Daman & Diu', language: 'gu' },
  { code: 'LA', name: 'Ladakh', language: 'en' },
  { code: 'LD', name: 'Lakshadweep', language: 'ml' },
  { code: 'PY', name: 'Puducherry', language: 'ta' }
];

const MINISTRIES = [
  'Ministry Of Agriculture', 'Ministry Of Commerce', 'Ministry of Education', 'Ministry of Electronics',
  'Ministry of Fisheries', 'Ministry Of Finance', 'Ministry Of Home Affairs', 'Ministry Of MSME',
  'Ministry Of Science', 'Ministry Of Minority Affairs', 'Ministry Of Social Justice', 'Ministry Of Youth Affairs'
];

INDIAN_STATES.forEach(state => {
  RSS_SOURCES.IN.push(`https://news.google.com/rss/search?q=government+scheme+${encodeURIComponent(state.name)}+launched+2026&hl=en-IN&gl=IN&ceid=IN:en&tbs=qdr:w`);
});

MINISTRIES.forEach(min => {
  RSS_SOURCES.IN.push(`https://news.google.com/rss/search?q=${encodeURIComponent(min)}+scheme+launched+2026&hl=en-IN&gl=IN&ceid=IN:en&tbs=qdr:w`);
});

// Newsdata.io replaces the old per-state Google News RSS loop

const MYSCHEME_KEYWORDS = ['welfare', 'scholarship', 'housing', 'health', 'agriculture', 'women', 'disability'];

function mapCategory(raw) {
  const r = (raw || '').toLowerCase();
  if (r.includes('agri') || r.includes('farm') || r.includes('crop')) return 'agriculture';
  if (r.includes('health') || r.includes('medical') || r.includes('hospital')) return 'health';
  if (r.includes('hous') || r.includes('shelter')) return 'housing';
  if (r.includes('edu') || r.includes('school') || r.includes('scholar')) return 'education';
  if (r.includes('women') || r.includes('girl') || r.includes('maternal')) return 'women';
  if (r.includes('elder') || r.includes('senior') || r.includes('pension')) return 'elderly';
  if (r.includes('disab')) return 'disability';
  if (r.includes('business') || r.includes('enterprise') || r.includes('loan')) return 'business';
  if (r.includes('food') || r.includes('nutrition') || r.includes('ration')) return 'food';
  if (r.includes('employ') || r.includes('job')) return 'employment';
  if (r.includes('child') || r.includes('family')) return 'family';
  return 'cash';
}

async function fetchIndiamyScheme() {
  console.log('\n📡 Starting myScheme.gov.in API Discovery (State-wise)...');
  const allSchemes = [];
  const key = process.env.APISETU_KEY;
  
  if (!key || key.trim() === '') {
    console.log('   ⏭️  APISETU_KEY is missing. Skipping direct API polling to prevent 401 errors.');
    console.log('      (RSS feeds will still be used for discovery instead).');
    return [];
  }
  
  const headers = { 'X-APISETU-APIKEY': key };

  // --- API Health Check to pre-validate key ---
  try {
    await axios.get('https://api.myscheme.gov.in/search/v4/schemes', {
        headers, params: { lang: 'en', limit: 1 }, timeout: 8000
    });
  } catch (e) {
    if (e.response && (e.response.status === 401 || e.response.status === 403)) {
      console.warn(`   ⚠️  APISETU_KEY is invalid/expired (Status ${e.response.status}). Skipping API sync.`);
      return [];
    }
  }

  const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));

  // 1. Fetch Central Schemes
  console.log('   🏛️  Fetching Central (National) Schemes...');
  const centralBatches = chunk(MYSCHEME_KEYWORDS, 4);
  for (const batch of centralBatches) {
    await Promise.allSettled(batch.map(async (keyword) => {
      try {
        const res = await axios.get('https://api.myscheme.gov.in/search/v4/schemes', {
          headers,
          params: { lang: 'en', keyword, central: 'Y', page: 1, limit: 10 },
          timeout: 10000
        });
        const list = res.data?.data?.schemes || res.data?.schemes || [];
        list.forEach(s => {
          if (s.schemeName || s.title) {
            allSchemes.push({
              name: s.schemeName || s.title,
              keyword,
              state_code: 'india',
              state_name: null,
              raw: s
            });
          }
        });
      } catch (e) {}
    }));
    await new Promise(r => setTimeout(r, 1000));
  }

  // 2. Fetch State-specific Schemes
  console.log('   📍 Fetching State-specific Schemes (Parallel Batches)...');
  const stateBatches = chunk(INDIAN_STATES, 5);
  for (const batch of stateBatches) {
    await Promise.allSettled(batch.map(async (state) => {
      for (const keyword of MYSCHEME_KEYWORDS.slice(0, 3)) {
        try {
          const res = await axios.get('https://api.myscheme.gov.in/search/v4/schemes', {
            headers,
            params: { lang: 'en', keyword, state: state.name, central: 'N', page: 1, limit: 10 },
            timeout: 10000
          });
          const list = res.data?.data?.schemes || res.data?.schemes || [];
          list.forEach(s => {
            if (s.schemeName || s.title) {
              allSchemes.push({
                name: s.schemeName || s.title,
                keyword,
                state_code: state.code,
                state_name: state.name,
                local_language: state.language || null,
                raw: s
              });
            }
          });
        } catch (e) {}
      }
    }));
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n✅ myScheme Discovery Complete. Found ${allSchemes.length} raw entries.`);
  return allSchemes;
}

// ============================================
// STEP 1: FETCH NEWS via NEWSDATA.IO API
// Replaces blocked Google News RSS feeds
// ============================================
async function fetchNewsdata() {
  const allItems = [];

  if (!newsdataKey) {
    console.warn('⚠️  NEWSDATA_API_KEY not set. Falling back to PIB RSS only.');
  } else {
    console.log(`\n📡 Fetching from newsdata.io (${NEWSDATA_QUERIES.length} queries)...`);
    for (const q of NEWSDATA_QUERIES) {
      try {
        const url = `https://newsdata.io/api/1/latest?apikey=${newsdataKey}&q=${encodeURIComponent(q.q)}&country=${q.country}&language=${q.lang}&size=10`;
        const res = await axios.get(url, { timeout: 15000 });
        const articles = res.data?.results || [];
        console.log(`  ✅ "${q.q.substring(0,40)}..." → ${articles.length} articles`);
        for (const a of articles) {
          allItems.push({
            country: q.countryCode,
            stateCode: q.stateCode || null,
            title: a.title || '',
            link: a.link || '',
            summary: a.description || '',
            published: a.pubDate || ''
          });
        }
        await new Promise(r => setTimeout(r, 500)); // gentle rate limit
      } catch (err) {
        console.warn(`  ⚠️  Newsdata query failed: ${err.message}`);
      }
    }
  }

  // Also fetch PIB RSS (reliable government source, not Google)
  for (const feed of RELIABLE_RSS) {
    try {
      console.log(`  📡 Fetching PIB RSS...`);
      const parsed = await parser.parseURL(feed.url);
      for (const item of (parsed.items || []).slice(0, 15)) {
        allItems.push({
          country: feed.country,
          title: item.title || '',
          link: item.link || '',
          summary: item.contentSnippet || item.content || '',
          published: item.pubDate || ''
        });
      }
      console.log(`  ✅ PIB RSS → ${Math.min(15, parsed.items?.length || 0)} articles`);
    } catch (err) {
      console.warn(`  ⚠️  PIB RSS failed: ${err.message}`);
    }
  }

  // Deduplicate by link
  const seen = new Set();
  const unique = allItems.filter(item => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  console.log(`\n📊 Total unique news items fetched: ${unique.length}`);
  return unique;
}

// ============================================
// STEP 2: PRE-AI FUNNEL FILTERS
// ============================================
const ACCEPT_KEYWORDS = ['scheme', 'yojana', 'benefit', 'welfare', 'subsidy', 'pension', 'scholarship', 'insurance', 'allowance', 'grant', 'relief', 'fund', 'launched', 'announced', 'introduced', 'eligibility', 'pradhan mantri', 'mukhyamantri', 'cm ', 'assistance', 'empowerment', 'mission', 'abhiyan', 'krishi', 'kisan', 'rozgar', 'awas', 'swasthya', 'bima', 'ration', 'free', 'stipend', 'honorarium'];
const REJECT_KEYWORDS = ['result', 'election', 'cricket', 'ipl', 'weather', 'stock market', 'sensex', 'nifty', 'bollywood', 'movie', 'arrested', 'accident', 'obituary', 'unknown', 'not specified', 'none', 'no official name', 'assumed', 'not mentioned', 'press note'];

function isRelevant(title, summary) {
  const text = (title + ' ' + summary).toLowerCase();
  
  for (const word of REJECT_KEYWORDS) {
    if (text.includes(word)) return false;
  }
  
  for (const word of ACCEPT_KEYWORDS) {
    if (text.includes(word)) return true;
  }
  
  return false;
}

function isFresh(pubDate) {
  if (!pubDate) return true;
  const published = new Date(pubDate);
  const diffHours = (new Date() - published) / (1000 * 60 * 60);
  return diffHours <= (7 * 24); // 7 days
}

async function fetchFullArticle(url, rssSummary) {
  if (rssSummary && rssSummary.length > 200) {
    return rssSummary; // Summary is rich enough
  }
  try {
    const res = await axios.get(url, { 
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const text = res.data.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
    if (text.length < 200) return rssSummary; // Paywalled or too short
    return text.substring(0, 3000); 
  } catch (e) {
    return rssSummary; // Fallback to RSS summary on 403, 404, 429, timeout
  }
}

async function getExistingScheme(title, sourceUrl, country) {
  const sourceHash = crypto.createHash('md5').update(sourceUrl).digest('hex');
  
  // Check by hash first (faster, strictly accurate)
  const { data: hashMatch } = await supabase.from('schemes').select('id').eq('source_hash', sourceHash).limit(1).single();
  if (hashMatch) return hashMatch;

  // Fallback to title similarity check
  const { data } = await supabase
    .from('schemes')
    .select('*')
    .eq('country_code', country)
    .ilike('name', `%${title.substring(0, 30)}%`)
    .limit(1);

  return data && data.length > 0 ? data[0] : null;
}

// ============================================
// STEP 3: EXTRACT SCHEME DETAILS WITH AI
// ============================================
async function extractSchemeDetails(item) {
  const prompt = `
You are a government scheme analyst. Analyze this news item and extract scheme details.

News Title: ${item.title}
News Summary: ${item.summary}
Country: ${item.country}
Source URL: ${item.link}

If this is a government benefit scheme, welfare program, or financial assistance program, extract details.
If this is NOT a government scheme, return {"is_scheme": false}.

Return ONLY valid JSON, nothing else:
{
  "is_scheme": true,
  "name": "Official scheme name",
  "category": "one of: cash/housing/health/education/agriculture/women/elderly/disability/business",
  "what_you_get": "Simple description of the benefit",
  "benefit_amount": "Exact amount like ₹6000/year or £500/month or Not specified",
  "eligibility": {
    "age_min": null,
    "age_max": null,
    "income_max": null,
    "profession": [],
    "other": "any other eligibility criteria"
  },
  "how_to_apply": {
    "steps": ["step 1", "step 2", "step 3"]
  },
  "documents": ["document 1", "document 2"],
  "official_url": "official government URL if found",
  "image_keyword": "3-4 word search term for relevant photo",
  "state_name": "Full state name or null if central",
  "state_code": "Standard code like IN-AP, IN-KL, or india for central",
  "summary": "2 sentence simple explanation for common people",
  "confidence_score": "float between 0.0 and 1.0 representing confidence this is a government scheme"
}
`;

  try {
    const text = await generateAICompletion(prompt);
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('AI extraction failed:', err.message);
    return { is_scheme: false };
  }
}

// ============================================
// STEP 5: CREATE URL SLUG
// ============================================
function createSlug(name, country) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60) + '-' + country.toLowerCase();
}

// ============================================
// IMAGE INTEGRATION (PEXELS + UNSPLASH FALLBACK)
// ============================================
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'ew5YCrng0KjGO4zOZvLg2Vq4XNJ20arQsBERm9v10Ydz4hWsDQpYIx42';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'mRrS9UjMl45wy4Hy-Pm6oMv7TGG55Sb-o6VLDxcJQOA';

async function fetchUnsplashImage(keyword) {
  try {
    const enhancedKeyword = `${keyword} government and people support india`.substring(0, 60);
    const res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(enhancedKeyword)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`, { timeout: 10000 });
    if (res.data && res.data.results && res.data.results.length > 0) {
      const img = res.data.results[0];
      return img.urls.regular;
    }
    return null;
  } catch (error) {
    console.error('     ⚠️ Unsplash API error:', error.message);
    return null;
  }
}

async function fetchSchemeImage(keyword) {
  if (!keyword) return null;
  try {
    const enhancedKeyword = `${keyword} indian people`.substring(0, 60);
    const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(enhancedKeyword)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_API_KEY },
      timeout: 10000
    });
    
    if (res.data && res.data.photos && res.data.photos.length > 0) {
      const img = res.data.photos[0];
      console.log(`     📸 Found Pexels Image for "${keyword}": ${img.src.large}`);
      return img.src.large;
    }
    
    // If Pexels returns empty, fallback
    console.log(`     ⚠️ Pexels returned no results. Falling back to Unsplash...`);
    return await fetchUnsplashImage(keyword);
  } catch (error) {
    console.error('     ⚠️ Pexels API error:', error.message);
    console.log(`     🔄 Falling back to Unsplash...`);
    const unsplashUrl = await fetchUnsplashImage(keyword);
    if (unsplashUrl) {
      console.log(`     📸 Found Unsplash Image (Fallback) for "${keyword}": ${unsplashUrl}`);
    }
    return unsplashUrl;
  }
}

// ============================================
// STEP 6: SAVE OR UPDATE IN SUPABASE
// ============================================
async function saveScheme(schemeData, country, sourceUrl, existingId = null) {
  const slug = existingId ? null : createSlug(schemeData.name, country);
  const searchKeyword = schemeData.image_keyword || schemeData.category;
  
  const payload = {
    country_code: country,
    name: schemeData.name,
    category: schemeData.category,
    what_you_get: schemeData.what_you_get,
    benefit_amount: schemeData.benefit_amount,
    eligibility: schemeData.eligibility,
    how_to_apply: schemeData.how_to_apply,
    documents: schemeData.documents,
    official_url: schemeData.official_url || sourceUrl,
    image_keyword: schemeData.image_keyword,
    state_name: schemeData.state_name || null,
    state_code: schemeData.state_code || 'india',
    local_language: schemeData.local_language || null,
    is_published: true,
    source: 'agent',
    last_updated: new Date().toISOString()
  };

  if (!existingId) {
    console.log(`📸 Fetching image for new scheme: ${searchKeyword}`);
    const imageUrl = await fetchSchemeImage(`${searchKeyword} photograph`);
    payload.image_url = imageUrl;
    payload.slug = slug;
    payload.discovered_at = new Date().toISOString();
  }

  const query = existingId 
    ? supabase.from('schemes').update(payload).eq('id', existingId)
    : supabase.from('schemes').insert(payload);

  const { data: result, error } = await query.select().single();
  if (error) {
    console.error(`Supabase ${existingId ? 'update' : 'insert'} error:`, error.message);
    return null;
  }

  console.log(`✅ Scheme ${existingId ? 'updated' : 'saved'}: ${schemeData.name}`);
  return result;
}

// ============================================
// MAIN AGENT RUNNER
// ============================================
async function runFindAgent() {
  console.log('\n🚀 SchemeAtlas Sync Agent Starting...');
  console.log(`⏰ Start Time: ${new Date().toISOString()}`);

  const stats = {
    rssTotal: 0,
    passedDate: 0,
    passedRelevance: 0,
    notInDb: 0,
    fullArticleFetched: 0,
    aiConfirmed: 0,
    published: 0,
    rejected: 0,
    errors: 0
  };

  // --- STEP 1: API Discovery (India myScheme) ---
  const mySchemeItems = await fetchIndiamyScheme();
  
  if (!DRY_RUN) {
    for (const item of mySchemeItems) {
      try {
        const existing = await getExistingScheme(item.name, 'myscheme', 'IN');
        const s = item.raw;
        
        const schemeData = {
          name: item.name,
          category: mapCategory(item.keyword + ' ' + (s.schemeShortTitle || '')),
          what_you_get: s.schemeShortTitle || s.description || '',
          benefit_amount: s.benefitType || 'Check official site',
          eligibility: { other: s.eligibility || '', categories: s.beneficiary || [] },
          how_to_apply: { steps: s.applicationProcess ? [s.applicationProcess] : ['Visit myscheme.gov.in'] },
          documents: s.documents ? (Array.isArray(s.documents) ? s.documents : [s.documents]) : [],
          official_url: s.schemeUrl || 'https://myscheme.gov.in',
          image_keyword: `${item.keyword} india government`,
          state_name: item.state_name,
          state_code: item.state_code || 'india',
          is_scheme: true
        };

        if (existing) {
          const hasChanged = existing.category !== schemeData.category || existing.official_url !== schemeData.official_url;
          if (hasChanged) {
            await saveScheme(schemeData, 'IN', schemeData.official_url, existing.id);
          }
        } else {
          const saved = await saveScheme(schemeData, 'IN', schemeData.official_url);
        }
      } catch (e) {
        stats.errors++;
      }
    }
  }

  // --- STEP 2: News Discovery via newsdata.io + PIB RSS ---
  console.log('\n📡 Starting News Discovery & Funnel...');
  const rssItems = await fetchNewsdata();
  stats.rssTotal = rssItems.length;

  for (const item of rssItems) {
    try {
      // Funnel Stage 1: Date
      if (!isFresh(item.published)) continue;
      stats.passedDate++;

      // Funnel Stage 2: Relevance
      if (!isRelevant(item.title, item.summary)) continue;
      stats.passedRelevance++;

      // Funnel Stage 3: Deduplication
      const existing = await getExistingScheme(item.title, item.link, item.country);
      if (existing) continue;
      stats.notInDb++;

      // Funnel Stage 4: Full Article Fetching
      console.log(`\n🔍 Promising Item: ${item.title}`);
      const fullText = await fetchFullArticle(item.link, item.summary);
      if (fullText !== item.summary) stats.fullArticleFetched++;
      
      // Override summary with full text for AI
      item.summary = fullText;

      if (DRY_RUN) {
        console.log(`   [DRY RUN] Would send to AI & DB.`);
        continue;
      }

      // Funnel Stage 5: AI Extraction
      const schemeData = await extractSchemeDetails(item);

      // Funnel Stage 6: Quality Gate
      if (!schemeData.is_scheme || schemeData.confidence_score < 0.75 || !schemeData.name || schemeData.name.length < 10) {
        console.log(`   ❌ Rejected by AI Quality Gate`);
        stats.rejected++;
        continue;
      }
      stats.aiConfirmed++;

      // Funnel Stage 7: Publish
      const saved = await saveScheme(schemeData, item.country, item.link);
      if (saved) stats.published++;
      
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error(`   ❌ Error processing RSS ${item.title}:`, e.message);
      stats.errors++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 RSS items fetched:        ${stats.rssTotal}`);
  console.log(`📅 Passed date filter:       ${stats.passedDate}`);
  console.log(`🔍 Passed relevance filter:  ${stats.passedRelevance}`);
  console.log(`🗄️  Not in DB:                ${stats.notInDb}`);
  console.log(`🌐 Full article fetched:     ${stats.fullArticleFetched}`);
  if (!DRY_RUN) {
    console.log(`🤖 AI confirmed schemes:     ${stats.aiConfirmed}`);
    console.log(`✅ Published:                ${stats.published}`);
    console.log(`🗑️  Quality rejected:         ${stats.rejected}`);
  } else {
    console.log(`\n⚠️  DRY RUN MODE ENABLED. Zero AI tokens used. Zero DB writes.`);
  }
  console.log(`❌ Errors:                   ${stats.errors}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return stats;
}

// Run the agent
runFindAgent()
  .then(stats => {
    console.log(`Done. ${stats?.published || 0} new schemes found.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Agent failed:', err);
    process.exit(1);
  });
