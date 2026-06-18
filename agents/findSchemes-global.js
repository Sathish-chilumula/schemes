/**
 * SchemeAtlas — Global Scheme Discovery (Non-India)
 * ==================================================
 * Countries: USA, UK, Canada, Australia, EU
 * Sources  : GNews API + RSS feeds per country
 * Separate from India pipeline to avoid conflicts
 * ==================================================
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GNEWS_KEY = process.env.GNEWS_API_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('❌ Supabase env vars required'); process.exit(1); }
if (!GROQ_KEY && !OPENAI_KEY) { console.error('❌ At least one AI API key required'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Country-specific GNews queries ─────────────────────────────────────────
const GLOBAL_GNEWS_QUERIES = [
  // USA
  { countryCode: 'US', gnewsCountry: 'us', q: 'government benefit program apply 2026 federal state' },
  { countryCode: 'US', gnewsCountry: 'us', q: 'SNAP Medicaid Section 8 SSDI SSI eligibility 2026' },
  { countryCode: 'US', gnewsCountry: 'us', q: 'SBA loan FAFSA Pell Grant government program 2026' },
  { countryCode: 'US', gnewsCountry: 'us', q: 'state government assistance program low income 2026' },
  { countryCode: 'US', gnewsCountry: 'us', q: 'veterans benefits disability housing assistance 2026' },

  // UK
  { countryCode: 'GB', gnewsCountry: 'gb', q: 'UK government benefit scheme grant 2026 apply' },
  { countryCode: 'GB', gnewsCountry: 'gb', q: 'Universal Credit PIP DLA ESA Housing Benefit 2026' },
  { countryCode: 'GB', gnewsCountry: 'gb', q: 'GOV.UK benefit entitlement DWP 2026 update' },
  { countryCode: 'GB', gnewsCountry: 'gb', q: 'Innovate UK start up loan business grant 2026' },

  // Canada
  { countryCode: 'CA', gnewsCountry: 'ca', q: 'Canada government benefit program apply 2026' },
  { countryCode: 'CA', gnewsCountry: 'ca', q: 'CPP OAS EI CCB Canada child benefit 2026' },
  { countryCode: 'CA', gnewsCountry: 'ca', q: 'provincial benefit assistance Ontario BC Quebec 2026' },

  // Australia
  { countryCode: 'AU', gnewsCountry: 'au', q: 'Australia government benefit payment apply 2026' },
  { countryCode: 'AU', gnewsCountry: 'au', q: 'Centrelink JobSeeker Age Pension NDIS 2026' },
  { countryCode: 'AU', gnewsCountry: 'au', q: 'Family Tax Benefit First Home Owner Grant 2026' },

  // EU
  { countryCode: 'EU', gnewsCountry: 'ie', q: 'Horizon Europe grant funding 2026 apply' },
  { countryCode: 'EU', gnewsCountry: 'ie', q: 'Erasmus EIC Accelerator EU fund 2026' },
];

// ─── AI: Extract scheme data from a news article ────────────────────────────
async function extractSchemeFromArticle(article, countryCode) {
  const currencyMap = { US: '$', GB: '£', CA: 'CA$', AU: 'A$', EU: '€' };
  const currency = currencyMap[countryCode] || '$';

  const prompt = `You extract government benefit/grant scheme data from news articles.

Country: ${countryCode} | Currency: ${currency}

Article Title: ${article.title}
Article Summary: ${article.summary}

If this article describes a specific government benefit, grant, or scheme, extract:
- name: Full official scheme name
- category: one of [cash, food, housing, health, education, disability, elderly, employment, family, business, agriculture, research, climate]
- what_you_get: What beneficiaries receive (use ${currency} amounts, not ₹)
- benefit_amount: Specific amount e.g. "${currency}500/month" or "Up to ${currency}10,000"
- eligibility: JSON object with age_min, age_max, income_max, citizenship fields
- how_to_apply: JSON object with steps array and portal_url
- official_url: Official government URL (must be .gov, .gc.ca, .gov.au, or europa.eu)
- jurisdiction_level: "federal" | "state" | "national" | "eu-wide" | "provincial"
- is_active: true

If this is NOT about a specific named government scheme, or if it is a financial product/loan/mortgage with repayment, return {"skip": true}.

Return ONLY valid JSON, no markdown:`;

  for (const [keyName, apiKey, model, baseUrl] of [
    ['GROQ', GROQ_KEY, 'llama-3.3-70b-versatile', 'https://api.groq.com/openai/v1'],
    ['OPENAI', OPENAI_KEY, 'gpt-4o-mini', 'https://api.openai.com/v1'],
  ]) {
    if (!apiKey) continue;
    try {
      const res = await axios.post(`${baseUrl}/chat/completions`, {
        model, temperature: 0.2, max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }, {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 25000,
      });
      const raw = res.data?.choices?.[0]?.message?.content?.trim();
      if (!raw) continue;
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.skip) return null;
      if (!parsed.name || parsed.name.length < 5) return null;
      return parsed;
    } catch { continue; }
  }
  return null;
}

// ─── Generate a URL-safe slug ────────────────────────────────────────────────
function toSlug(name, countryCode) {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim().slice(0, 80);
  return `${base}-${countryCode.toLowerCase()}`;
}

// ─── Save discovered scheme to Supabase ─────────────────────────────────────
async function saveScheme(schemeData, countryCode, sourceUrl) {
  const slug = toSlug(schemeData.name, countryCode);

  // Check for duplicates
  const { data: existing } = await supabase.from('schemes').select('id').eq('slug', slug).single();
  if (existing) return false;

  const { error } = await supabase.from('schemes').insert({
    name: schemeData.name,
    slug,
    country_code: countryCode,
    category: schemeData.category || 'cash',
    what_you_get: schemeData.what_you_get || '',
    benefit_amount: schemeData.benefit_amount || '',
    eligibility: schemeData.eligibility || {},
    how_to_apply: schemeData.how_to_apply || {},
    official_url: schemeData.official_url || sourceUrl || '',
    jurisdiction_level: schemeData.jurisdiction_level || 'national',
    is_active: true,
    is_published: true,
    is_seo_optimized: false,
    is_translated: false,
    discovered_at: new Date().toISOString(),
    source_url: sourceUrl || '',
    // Ensure currency never mixes
    currency_code: { US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', EU: 'EUR' }[countryCode] || 'USD',
  });

  return !error;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🌍 SchemeAtlas — Global Scheme Discovery (Non-India)');
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`🌐 Countries: USA, UK, Canada, Australia, EU\n`);

  if (!GNEWS_KEY) {
    console.warn('⚠️  GNEWS_API_KEY not set — no news articles to process.');
    process.exit(0);
  }

  let totalFound = 0;
  let totalSaved = 0;

  for (const query of GLOBAL_GNEWS_QUERIES) {
    console.log(`\n📰 [${query.countryCode}] "${query.q.substring(0, 50)}..."`);
    try {
      const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query.q)}&country=${query.gnewsCountry}&lang=en&max=10&apikey=${GNEWS_KEY}`;
      const res = await axios.get(url, { timeout: 10000 });
      const articles = res.data?.articles || [];
      console.log(`  📥 ${articles.length} articles found`);

      for (const article of articles) {
        if (!article.title || article.title.length < 20) continue;
        totalFound++;

        const extracted = await extractSchemeFromArticle({
          title: article.title,
          summary: article.description || (article.content || '').substring(0, 600),
        }, query.countryCode);

        if (extracted) {
          const saved = await saveScheme(extracted, query.countryCode, article.url);
          if (saved) {
            totalSaved++;
            console.log(`  ✅ Saved: "${extracted.name}" [${query.countryCode}]`);
          } else {
            console.log(`  ⏭️  Duplicate: "${extracted?.name}"`);
          }
        }
        await delay(800);
      }
      await delay(2000); // GNews rate limit
    } catch (err) {
      console.warn(`  ⚠️  GNews failed: ${err.message}`);
    }
  }

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`📊 Articles processed: ${totalFound}`);
  console.log(`✅ New schemes saved:  ${totalSaved}`);
  console.log(`${'━'.repeat(50)}\n`);
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
