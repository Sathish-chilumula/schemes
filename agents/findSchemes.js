// ============================================
// CLAIMIT — SCHEME FINDER AGENT
// agents/findSchemes.js
// Runs via GitHub Actions every 6 hours
// ============================================

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Parser = require('rss-parser');
const axios = require('axios');

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const groqKey = process.env.GROQ_API_KEY;
const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;

if (!url || !key) {
  console.error('\n❌ CRITICAL STARTUP ERROR ❌');
  console.error('Supabase environment variables are missing!');
  process.exit(1);
}

const supabase = createClient(url, key);
const parser = new Parser();

// Initialize Gemini SDK if key exists
let genAI = null;
let geminiModel = null;
if (geminiKey) {
  try {
    genAI = new GoogleGenerativeAI(geminiKey);
    // Use gemini-2.0-flash for Tier 1
    geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  } catch (e) {
    console.warn('⚠️ Gemini SDK init failed, will use fallbacks.');
  }
}

// ============================================
// UNIFIED AI COMPLETION (2-TIER FALLBACK)
// ============================================
async function generateAICompletion(prompt) {
  // --- TIER 1: CLOUDFLARE WORKERS AI ---
  if (cfAccountId && cfApiToken) {
    try {
      console.log('🤖 Attempting Tier 1: Cloudflare Workers AI (Llama 3.1 8B)...');
      const response = await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/v1/chat/completions`,
        {
          model: '@cf/meta/llama-3.1-8b-instruct',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: { 
            'Authorization': `Bearer ${cfApiToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 25000
        }
      );
      const text = response.data?.result?.response?.trim() || response.data?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 1 (Cloudflare) failed: ${err.message}`);
    }
  }

  // --- TIER 2: GROQ ---
  if (groqKey) {
    try {
      console.log('🤖 Attempting Tier 2: Groq (Llama 3.1 8B instant)...');
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: { 'Authorization': `Bearer ${groqKey}` },
        timeout: 15000
      });
      const text = response.data?.choices?.[0]?.message?.content?.trim();
      if (text) return text;
    } catch (err) {
      console.warn(`⚠️ Tier 2 (Groq) failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  return ""; // Failsafe fallback
}

// ============================================
// RSS FEED SOURCES PER COUNTRY
// ============================================
const RSS_SOURCES = {
  IN: [
    'https://pib.gov.in/RssMain.aspx',
    'https://news.google.com/rss/search?q=government+scheme+india+new+welfare+program&hl=en-IN&gl=IN'
  ],
  GB: [
    'https://www.gov.uk/search/news-and-communications.atom',
    'https://news.google.com/rss/search?q=UK+benefits+scheme+2025&hl=en-GB&gl=GB'
  ],
  US: [
    'https://www.federalregister.gov/api/v1/articles.rss?conditions[type][]=RULE',
    'https://news.google.com/rss/search?q=USA+government+assistance+program+2025&hl=en-US&gl=US'
  ],
  NG: [
    'https://news.google.com/rss/search?q=Nigeria+government+welfare+scheme+2025&hl=en-NG&gl=NG'
  ],
  KE: [
    'https://news.google.com/rss/search?q=Kenya+government+benefit+program+2025&hl=en-KE&gl=KE'
  ]
};

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
  RSS_SOURCES.IN.push(`https://news.google.com/rss/search?q=government+scheme+${encodeURIComponent(state.name)}+new&hl=en-IN&gl=IN`);
});

MINISTRIES.forEach(min => {
  RSS_SOURCES.IN.push(`https://news.google.com/rss/search?q=${encodeURIComponent(min)}+scheme+new&hl=en-IN&gl=IN`);
});

// Removed duplicate array

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

  // 1. Fetch Central Schemes
  console.log('   🏛️  Fetching Central (National) Schemes...');
  for (const keyword of MYSCHEME_KEYWORDS) {
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
      await new Promise(r => setTimeout(r, 800));
    } catch (e) {
      const msg = e.response ? e.response.status : e.message;
      console.warn(`   ⚠️  Central keyword "${keyword}" failed: ${msg}`);
    }
  }

  // 2. Fetch State-specific Schemes
  for (const state of INDIAN_STATES) {
    console.log(`   📍 Fetching schemes for ${state.name} (${state.code})...`);
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
        await new Promise(r => setTimeout(r, 600));
      } catch (e) {
        const msg = e.response ? e.response.status : e.message;
        console.warn(`   ⚠️  State "${state.code}" keyword "${keyword}" failed: ${msg}`);
      }
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n✅ myScheme Discovery Complete. Found ${allSchemes.length} raw entries.`);
  return allSchemes;
}

// ============================================
// STEP 1: FETCH RSS FEEDS
// ============================================
async function fetchRSSFeeds() {
  const allItems = [];
  for (const [country, feeds] of Object.entries(RSS_SOURCES)) {
    for (const feedUrl of feeds) {
      try {
        console.log(`Fetching RSS: ${feedUrl}`);
        const feed = await parser.parseURL(feedUrl);
        for (const item of feed.items.slice(0, 10)) {
          allItems.push({
            country,
            title: item.title,
            link: item.link,
            summary: item.contentSnippet || item.content || '',
            published: item.pubDate
          });
        }
      } catch (err) {
        console.error(`RSS fetch failed for ${feedUrl}:`, err.message);
      }
    }
  }
  console.log(`Total RSS items found: ${allItems.length}`);
  return allItems;
}

// ============================================
// STEP 2: CHECK IF SCHEME ALREADY EXISTS
// ============================================
async function getExistingScheme(title, country) {
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
  "summary": "2 sentence simple explanation for common people"
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
    total: 0,
    new: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  };

  // --- STEP 1: API Discovery (India myScheme) ---
  const mySchemeItems = await fetchIndiamyScheme();
  stats.total += mySchemeItems.length;

  for (const item of mySchemeItems) {
    try {
      const existing = await getExistingScheme(item.name, 'IN');
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
        const hasChanged = 
          existing.category !== schemeData.category || 
          existing.benefit_amount !== schemeData.benefit_amount ||
          existing.official_url !== schemeData.official_url;

        if (hasChanged) {
          console.log(`🔄 Updating myScheme: ${item.name}`);
          await saveScheme(schemeData, 'IN', schemeData.official_url, existing.id);
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } else {
        console.log(`🆕 New myScheme: ${item.name} (${item.state_code || 'Central'})`);
        const saved = await saveScheme(schemeData, 'IN', schemeData.official_url);
        if (saved) stats.new++;
      }
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error(`❌ Error processing myScheme ${item.name}:`, e.message);
      stats.errors++;
    }
  }

  // --- STEP 2: RSS Discovery (All Countries) ---
  const rssItems = await fetchRSSFeeds();
  stats.total += rssItems.length;

  for (const item of rssItems) {
    try {
      const existing = await getExistingScheme(item.title, item.country);
      if (existing) {
        console.log(`⏭️  Already exists (RSS): ${item.title}`);
        stats.skipped++;
        continue;
      }

      console.log(`🔍 Analyzing RSS: ${item.title}`);
      const schemeData = await extractSchemeDetails(item);

      if (!schemeData.is_scheme) {
        console.log(`❌ Not a scheme: ${item.title}`);
        stats.skipped++;
        continue;
      }

      const saved = await saveScheme(schemeData, item.country, item.link);
      if (saved) stats.new++;
      await new Promise(r => setTimeout(r, 1500));
    } catch (e) {
      console.error(`❌ Error processing RSS ${item.title}:`, e.message);
      stats.errors++;
    }
  }

  console.log('\n📊 SYNC SUMMARY');
  console.log('━━━━━━━━━━━━━━');
  console.log(`Total Handled: ${stats.total}`);
  console.log(`New Added:     ${stats.new}`);
  console.log(`Updated:       ${stats.updated}`);
  console.log(`Skipped:       ${stats.skipped}`);
  console.log(`Errors:        ${stats.errors}`);
  console.log('━━━━━━━━━━━━━━');
  
  return stats;
}

// Run the agent
runFindAgent()
  .then(stats => {
    console.log(`Done. ${stats.new} new, ${stats.updated} updated.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Agent failed:', err);
    process.exit(1);
  });
