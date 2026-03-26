// ============================================
// CLAIMIT — SCHEME FINDER AGENT
// agents/findSchemes.js
// Runs via GitHub Actions every 6 hours
// ============================================

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Parser = require('rss-parser');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const parser = new Parser();

// ============================================
// RSS FEED SOURCES PER COUNTRY
// ============================================
const RSS_SOURCES = {
  IN: [
    'https://pib.gov.in/RssMain.aspx',
    'https://www.myscheme.gov.in/rss',
    'https://news.google.com/rss/search?q=government+scheme+india+2025&hl=en-IN&gl=IN'
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
async function schemeExists(title, country) {
  const { data } = await supabase
    .from('schemes')
    .select('id')
    .eq('country_code', country)
    .ilike('name', `%${title.substring(0, 30)}%`)
    .limit(1);

  return data && data.length > 0;
}

// ============================================
// STEP 3: EXTRACT SCHEME DETAILS WITH GEMINI
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
  "summary": "2 sentence simple explanation for common people"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Gemini extraction failed:', err.message);
    return { is_scheme: false };
  }
}

// ============================================
// STEP 4: GENERATE TRANSLATIONS
// ============================================
const COUNTRY_LANGUAGES = {
  IN: ['hi', 'te'],
  GB: [],
  US: ['es'],
  NG: ['yo'],
  KE: ['sw']
};

const LANGUAGE_NAMES = {
  hi: 'Hindi',
  te: 'Telugu',
  es: 'Spanish',
  yo: 'Yoruba',
  sw: 'Swahili'
};

async function generateTranslation(scheme, language) {
  const langName = LANGUAGE_NAMES[language];

  const prompt = `
You are a ${langName} content writer for a government scheme website.

Translate and rewrite this government scheme information in simple, natural ${langName}.
Write as if explaining to a village elder who has never used a computer.

Scheme Name: ${scheme.name}
What You Get: ${scheme.what_you_get}
Benefit Amount: ${scheme.benefit_amount}
How to Apply Steps: ${JSON.stringify(scheme.how_to_apply?.steps)}

Return ONLY valid JSON, nothing else:
{
  "name": "Scheme name in ${langName}",
  "explanation": "2-3 sentence simple explanation in ${langName}",
  "steps": "Step by step how to apply in ${langName} (numbered)",
  "example": "One sentence example like: Raju, 45 year old farmer from village got benefit from this"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error(`Translation failed for ${language}:`, err.message);
    return null;
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
// STEP 6: SAVE TO SUPABASE
// ============================================
async function saveScheme(schemeData, country, sourceUrl) {
  const slug = createSlug(schemeData.name, country);

  const { data: scheme, error } = await supabase
    .from('schemes')
    .insert({
      country_code: country,
      name: schemeData.name,
      slug,
      category: schemeData.category,
      what_you_get: schemeData.what_you_get,
      benefit_amount: schemeData.benefit_amount,
      eligibility: schemeData.eligibility,
      how_to_apply: schemeData.how_to_apply,
      documents: schemeData.documents,
      official_url: schemeData.official_url || sourceUrl,
      image_keyword: schemeData.image_keyword,
      is_published: true,
      source: 'agent'
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase insert error:', error.message);
    return null;
  }

  console.log(`✅ Scheme saved: ${schemeData.name}`);

  // Save English translation
  await supabase.from('scheme_translations').insert({
    scheme_id: scheme.id,
    language: 'en',
    name: schemeData.name,
    explanation: schemeData.summary,
    steps: schemeData.how_to_apply?.steps?.join('\n'),
    example: null
  });

  // Save local language translations
  const languages = COUNTRY_LANGUAGES[country] || [];
  for (const lang of languages) {
    console.log(`Translating to ${lang}...`);
    const translation = await generateTranslation(schemeData, lang);
    if (translation) {
      await supabase.from('scheme_translations').insert({
        scheme_id: scheme.id,
        language: lang,
        name: translation.name,
        explanation: translation.explanation,
        steps: translation.steps,
        example: translation.example
      });
    }
    // Small delay to avoid API rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  return scheme;
}

// ============================================
// MAIN AGENT RUNNER
// ============================================
async function runFindAgent() {
  console.log('🤖 ClaimIt Scheme Finder Agent Starting...');
  console.log(`Time: ${new Date().toISOString()}`);

  let newSchemesFound = 0;

  // Step 1: Fetch all RSS feeds
  const rssItems = await fetchRSSFeeds();

  // Step 2: Process each item
  for (const item of rssItems) {
    // Check if already in DB
    const exists = await schemeExists(item.title, item.country);
    if (exists) {
      console.log(`⏭️  Already exists: ${item.title}`);
      continue;
    }

    // Extract scheme details with Gemini
    console.log(`🔍 Analyzing: ${item.title}`);
    const schemeData = await extractSchemeDetails(item);

    if (!schemeData.is_scheme) {
      console.log(`❌ Not a scheme: ${item.title}`);
      continue;
    }

    // Save to Supabase
    const saved = await saveScheme(schemeData, item.country, item.link);
    if (saved) {
      newSchemesFound++;
    }

    // Delay between API calls
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n✅ Agent Complete. New schemes found: ${newSchemesFound}`);
  return newSchemesFound;
}

// Run the agent
runFindAgent()
  .then(count => {
    console.log(`Done. ${count} new schemes added.`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Agent failed:', err);
    process.exit(1);
  });
