require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════
// CLAIMIT — SCHEME FINDER AGENT
// APIs Used:
//   India: API Setu (myScheme) + data.gov.in + PIB RSS
//   UK: GOV.UK Content API + News API (free, no key)
//   USA: Benefits.gov API + Federal Register API (free, no key)
//   Nigeria: Google News RSS (no official API exists)
//   Kenya: Kenya Open Data API + Google News RSS
//   All: Gemini AI for extraction + translation
// ═══════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const parser = new Parser({ timeout: 15000 });

const TRANSLATE_LANGS = {
  IN: [{ code: 'hi', name: 'Hindi' }, { code: 'te', name: 'Telugu' }],
  GB: [],
  US: [{ code: 'es', name: 'Spanish' }],
  NG: [{ code: 'yo', name: 'Yoruba' }],
  KE: [{ code: 'sw', name: 'Swahili' }],
};

const RSS_FEEDS = {
  IN: [
    'https://pib.gov.in/RssMain.aspx',
    'https://news.google.com/rss/search?q=government+scheme+india+2025+new+launch&hl=en-IN&gl=IN',
    'https://news.google.com/rss/search?q=pradhan+mantri+yojana+2025&hl=en-IN&gl=IN',
  ],
  GB: [
    'https://www.gov.uk/search/news-and-communications.atom?keywords=benefits+scheme',
    'https://news.google.com/rss/search?q=UK+government+benefits+new+2025&hl=en-GB&gl=GB',
  ],
  US: [
    'https://www.federalregister.gov/api/v1/articles.rss?conditions[type][]=RULE&conditions[agencies][]=social-security-administration',
    'https://news.google.com/rss/search?q=USA+federal+assistance+program+new+2025&hl=en-US&gl=US',
  ],
  NG: [
    'https://news.google.com/rss/search?q=Nigeria+government+welfare+benefit+2025&hl=en-NG&gl=NG',
    'https://news.google.com/rss/search?q=Nigeria+federal+palliative+scheme+2025',
  ],
  KE: [
    'https://news.google.com/rss/search?q=Kenya+government+Huduma+benefit+2025&hl=en-KE&gl=KE',
    'https://news.google.com/rss/search?q=Kenya+social+protection+cash+transfer+2025',
  ],
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

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

async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 },
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return text.replace(/```json|```/g, '').trim();
}

// ── INDIA: API SETU myScheme API ─────────────────────────
// Key: Register at apisetu.gov.in → search myScheme → Subscribe
// Env: APISETU_KEY
async function fetchIndiamyScheme() {
  const key = process.env.APISETU_KEY;
  if (!key) { console.log('⚠️  No APISETU_KEY — register at apisetu.gov.in for India schemes'); return []; }
  const schemes = [];
  for (const keyword of ['welfare', 'scholarship', 'housing', 'health', 'agriculture', 'women', 'disability']) {
    try {
      console.log(`  📡 myScheme API: ${keyword}...`);
      const res = await axios.get('https://api.myscheme.gov.in/search/v4/schemes', {
        headers: { 'X-Api-Key': key },
        params: { lang: 'en', keyword, central: 'Y', page: 1, limit: 15 },
        timeout: 10000,
      });
      const list = res.data?.data?.schemes || res.data?.schemes || [];
      for (const s of list) {
        if (!s.schemeName && !s.title) continue;
        schemes.push({
          country: 'IN', source: 'myscheme_api',
          name: s.schemeName || s.title,
          category: mapCategory(keyword),
          what_you_get: s.schemeShortTitle || s.description || '',
          benefit_amount: s.benefitType || 'Check official site',
          eligibility: { other: s.eligibility || '', categories: s.beneficiary || [] },
          how_to_apply: { steps: s.applicationProcess ? [s.applicationProcess] : ['Visit myscheme.gov.in'] },
          documents: s.documents ? [s.documents] : [],
          official_url: s.schemeUrl || 'https://myscheme.gov.in',
          image_keyword: `${keyword} india government`,
        });
      }
      await delay(1000);
    } catch (e) { console.error(`  myScheme ${keyword} failed: ${e.message}`); }
  }
  console.log(`  India myScheme API: ${schemes.length} schemes`);
  return schemes;
}

// ── INDIA: data.gov.in API ───────────────────────────────
// Key: Register at data.gov.in/user/register
// Env: DATAGOV_IN_KEY
async function fetchIndiaDataGov() {
  const key = process.env.DATAGOV_IN_KEY;
  if (!key) { console.log('⚠️  No DATAGOV_IN_KEY — register at data.gov.in/user/register'); return []; }
  try {
    console.log('  📡 data.gov.in API...');
    const res = await axios.get('https://data.gov.in/api/datastore/resource.json', {
      params: { 'api-key': key, limit: 30 },
      timeout: 10000,
    });
    const records = res.data?.records || [];
    return records.filter(r => r['Scheme Name'] || r.scheme_name).map(r => ({
      country: 'IN', source: 'datagov_in',
      name: r['Scheme Name'] || r.scheme_name,
      category: mapCategory(r.Category || r.category || ''),
      what_you_get: r.Benefits || r.description || '',
      benefit_amount: r['Benefit Amount'] || 'Check official site',
      eligibility: { other: r.Eligibility || '' },
      how_to_apply: { steps: [r['How to Apply'] || 'Visit india.gov.in'] },
      documents: [],
      official_url: r.URL || 'https://data.gov.in',
      image_keyword: 'india government welfare scheme',
    }));
  } catch (e) { console.error(`  data.gov.in failed: ${e.message}`); return []; }
}

// ── UK: GOV.UK API (FREE, no key needed) ─────────────────
async function fetchUKGovAPI() {
  const schemes = [];
  try {
    console.log('  📡 GOV.UK Content API...');
    const res = await axios.get('https://www.gov.uk/api/search.json', {
      params: { filter_format: 'guide', filter_part_of_taxonomy_tree: 'benefits', count: 25, fields: 'title,description,link' },
      timeout: 10000,
    });
    for (const item of (res.data?.results || [])) {
      if (!item.title) continue;
      schemes.push({
        country: 'GB', source: 'govuk_api',
        name: item.title,
        category: mapCategory(item.title + ' ' + (item.description || '')),
        what_you_get: item.description || '',
        benefit_amount: 'Check gov.uk for exact amount',
        eligibility: {},
        how_to_apply: { steps: [`Visit https://www.gov.uk${item.link}`, 'Create a Government Gateway account', 'Complete the online application'] },
        documents: ['National Insurance number', 'Bank account details', 'Proof of identity'],
        official_url: `https://www.gov.uk${item.link}`,
        image_keyword: 'uk government benefits welfare office',
      });
    }
    console.log(`  GOV.UK API: ${schemes.length} schemes`);
  } catch (e) { console.error(`  GOV.UK API failed: ${e.message}`); }
  return schemes;
}

// ── USA: Benefits.gov + Federal Register (FREE, no key) ──
async function fetchUSAAPIs() {
  const schemes = [];

  // Benefits.gov
  try {
    console.log('  📡 Benefits.gov API...');
    const res = await axios.get('https://www.benefits.gov/api/benefits', {
      params: { format: 'json', query: 'financial assistance', size: 20 },
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.benefits || []);
    for (const b of list) {
      const name = b.title || b.programTitle || b.name;
      if (!name) continue;
      schemes.push({
        country: 'US', source: 'benefits_gov',
        name,
        category: mapCategory(b.category || b.programType || ''),
        what_you_get: b.summary || b.description || '',
        benefit_amount: b.benefitAmount || 'Check benefits.gov',
        eligibility: { other: b.eligibility || '' },
        how_to_apply: { steps: [b.applicationProcess || 'Visit benefits.gov to apply online', 'Gather required documents', 'Submit application'] },
        documents: ['Photo ID', 'Social Security number', 'Proof of income'],
        official_url: b.agencyWebsite || b.url || 'https://www.benefits.gov',
        image_keyword: 'usa government assistance federal benefits',
      });
    }
    console.log(`  Benefits.gov: ${list.length} programs`);
  } catch (e) { console.error(`  Benefits.gov failed: ${e.message}`); }

  // Federal Register
  try {
    console.log('  📡 Federal Register API...');
    const res = await axios.get('https://www.federalregister.gov/api/v1/articles.json', {
      params: { 'conditions[type][]': 'RULE', 'per_page': 8, order: 'newest', 'fields[]': ['title', 'abstract', 'html_url'] },
      timeout: 10000,
    });
    for (const rule of (res.data?.results || [])) {
      if (!rule.title) continue;
      schemes.push({
        country: 'US', source: 'federal_register',
        name: rule.title,
        category: mapCategory(rule.title),
        what_you_get: rule.abstract || '',
        benefit_amount: 'Check Federal Register for details',
        eligibility: {},
        how_to_apply: { steps: ['Visit Federal Register', rule.html_url || ''] },
        documents: [],
        official_url: rule.html_url || 'https://www.federalregister.gov',
        image_keyword: 'usa federal government rule regulation',
      });
    }
  } catch (e) { console.error(`  Federal Register failed: ${e.message}`); }

  return schemes;
}

// ── KENYA: Open Data API (FREE, no key) ──────────────────
async function fetchKenyaAPI() {
  try {
    console.log('  📡 Kenya Open Data API...');
    const res = await axios.get('https://opendata.go.ke/api/views', {
      params: { category: 'Social', limit: 15 },
      timeout: 10000,
    });
    const list = Array.isArray(res.data) ? res.data : [];
    return list.filter(v => v.name || v.title).map(v => ({
      country: 'KE', source: 'kenya_opendata',
      name: v.name || v.title,
      category: 'cash',
      what_you_get: v.description || '',
      benefit_amount: 'Check official site',
      eligibility: {},
      how_to_apply: { steps: ['Visit opendata.go.ke', 'Contact your Sub-County office'] },
      documents: ['National ID', 'Recent passport photo'],
      official_url: `https://opendata.go.ke/dataset/${v.id || ''}`,
      image_keyword: 'kenya government social program africa',
    }));
  } catch (e) { console.error(`  Kenya OpenData failed: ${e.message}`); return []; }
}

// ── RSS: All countries ────────────────────────────────────
async function fetchAllRSS() {
  const items = [];
  for (const [country, feeds] of Object.entries(RSS_FEEDS)) {
    for (const url of feeds) {
      try {
        const feed = await parser.parseURL(url);
        for (const item of (feed.items || []).slice(0, 8)) {
          if (!item.title || item.title.length < 10) continue;
          items.push({ country, title: item.title, link: item.link || '', summary: item.contentSnippet || '' });
        }
        await delay(500);
      } catch (e) { console.error(`  RSS failed: ${url.substring(0, 50)}: ${e.message}`); }
    }
  }
  return items;
}

// ── Gemini: Extract scheme from RSS item ──────────────────
async function extractFromRSS(item) {
  const prompt = `You are a government scheme analyst.
News: "${item.title}"
Summary: "${item.summary}"
Country: ${item.country}

Is this a government benefit scheme or financial assistance program?
If NOT, return {"is_scheme":false}
If YES, return ONLY this JSON:
{
  "is_scheme":true,
  "name":"scheme name",
  "category":"cash|housing|health|education|agriculture|women|elderly|disability|business|food|employment|family",
  "what_you_get":"what beneficiaries receive",
  "benefit_amount":"amount with currency or Not specified",
  "eligibility":{"age_min":null,"age_max":null,"income_max":null,"profession":[],"other":""},
  "how_to_apply":{"steps":["step1","step2","step3"]},
  "documents":["doc1","doc2"],
  "official_url":"url or null",
  "image_keyword":"3 word photo search",
  "summary":"2 sentence plain explanation"
}`;
  try {
    const text = await callGemini(prompt);
    return JSON.parse(text);
  } catch (e) { return { is_scheme: false }; }
}

// ── Gemini: Enhance API data ─────────────────────────────
async function enhanceScheme(scheme) {
  if (!scheme?.name) return null;
  const prompt = `Government scheme expert. Complete missing details for:
Name: ${scheme.name}
Country: ${scheme.country}
Known: ${scheme.what_you_get || 'unknown'}
Category: ${scheme.category}

Return ONLY JSON:
{
  "what_you_get":"clear description",
  "benefit_amount":"estimated amount with currency",
  "eligibility":{"age_min":null,"age_max":null,"income_max":null,"profession":[],"other":""},
  "how_to_apply":{"steps":["step1","step2","step3"]},
  "documents":["doc1","doc2"],
  "image_keyword":"3 word photo term",
  "summary":"2 sentence plain language explanation"
}`;
  try {
    const text = await callGemini(prompt);
    const enhanced = JSON.parse(text);
    return { ...scheme, ...enhanced };
  } catch (e) { return scheme; }
}

// ── Gemini: Translate ─────────────────────────────────────
async function translateScheme(scheme, lang) {
  const prompt = `Translate this government scheme into simple ${lang.name} for rural users.

Name: ${scheme.name}
Benefit: ${scheme.what_you_get}
Amount: ${scheme.benefit_amount}
Steps: ${JSON.stringify(scheme.how_to_apply?.steps || [])}

Return ONLY JSON:
{
  "name":"name in ${lang.name}",
  "explanation":"2-3 sentence explanation in ${lang.name}",
  "steps":"numbered steps in ${lang.name}",
  "example":"one sentence story of someone who got this benefit"
}`;
  try {
    const text = await callGemini(prompt);
    return JSON.parse(text);
  } catch (e) { return null; }
}

// ── Save to Supabase ──────────────────────────────────────
async function alreadyExists(name, country) {
  if (!name) return true;
  const { data } = await supabase.from('schemes').select('id').eq('country_code', country)
    .ilike('name', `%${name.substring(0, 20)}%`).limit(1);
  return data && data.length > 0;
}

function makeSlug(name, country) {
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
    .replace(/-+/g, '-').trim().substring(0, 55) + '-' + country.toLowerCase();
}

async function saveScheme(scheme) {
  if (!scheme?.name || !scheme?.country) return null;
  if (await alreadyExists(scheme.name, scheme.country)) return null;

  const { data: saved, error } = await supabase.from('schemes').insert({
    country_code: scheme.country,
    name: scheme.name,
    slug: makeSlug(scheme.name, scheme.country),
    category: scheme.category || 'cash',
    what_you_get: scheme.what_you_get || '',
    benefit_amount: scheme.benefit_amount || 'Check official site',
    eligibility: scheme.eligibility || {},
    how_to_apply: scheme.how_to_apply || { steps: [] },
    documents: scheme.documents || [],
    official_url: scheme.official_url || '',
    image_keyword: scheme.image_keyword || scheme.category,
    is_published: true,
    source: scheme.source || 'agent',
  }).select().single();

  if (error) {
    if (error.code !== '23505') console.error(`DB error: ${error.message}`);
    return null;
  }

  console.log(`  ✅ Saved: ${scheme.name.substring(0, 55)}`);

  // English
  await supabase.from('scheme_translations').insert({
    scheme_id: saved.id, language: 'en',
    name: scheme.name,
    explanation: scheme.summary || scheme.what_you_get,
    steps: (scheme.how_to_apply?.steps || []).join('\n'),
    example: null,
  }).catch(() => {});

  // Local languages
  for (const lang of (TRANSLATE_LANGS[scheme.country] || [])) {
    console.log(`    🌐 → ${lang.name}`);
    const t = await translateScheme(scheme, lang);
    if (t) await supabase.from('scheme_translations').insert({
      scheme_id: saved.id, language: lang.code,
      name: t.name, explanation: t.explanation, steps: t.steps, example: t.example,
    }).catch(() => {});
    await delay(1500);
  }
  return saved;
}

// ── MAIN ─────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('🤖 ClaimIt Scheme Finder Agent');
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════════════\n');

  let totalAdded = 0;
  const allSchemes = [];

  // Step 1: Official APIs
  console.log('── STEP 1: Official APIs ──────────────────────');
  const apiData = [
    ...await fetchIndiamyScheme(),
    ...await fetchIndiaDataGov(),
    ...await fetchUKGovAPI(),
    ...await fetchUSAAPIs(),
    ...await fetchKenyaAPI(),
  ];
  console.log(`\nAPI total: ${apiData.length} raw items`);

  // Enhance with Gemini
  for (const s of apiData) {
    const enhanced = await enhanceScheme(s);
    if (enhanced) allSchemes.push(enhanced);
    await delay(400);
  }

  // Step 2: RSS feeds
  console.log('\n── STEP 2: RSS Feeds ──────────────────────────');
  const rssItems = await fetchAllRSS();
  console.log(`RSS total: ${rssItems.length} items`);

  for (const item of rssItems) {
    const extracted = await extractFromRSS(item);
    if (extracted?.is_scheme) {
      allSchemes.push({ country: item.country, source: 'rss', ...extracted, official_url: extracted.official_url || item.link });
    }
    await delay(800);
  }

  // Step 3: Save
  console.log(`\n── STEP 3: Saving ${allSchemes.length} schemes ──────────`);
  for (const scheme of allSchemes) {
    const saved = await saveScheme(scheme);
    if (saved) totalAdded++;
    await delay(200);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log(`✅ Done. Added ${totalAdded} new schemes to database.`);
  console.log('═══════════════════════════════════════════════');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
