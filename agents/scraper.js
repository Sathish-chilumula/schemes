/**
 * CLAIMIT GLOBAL SCRAPER & AI GENERATOR
 * Fetches RSS/API feeds (PIB, MyGov), removes duplicates,
 * explicitly prompts Gemini AI for detailed structural formatting
 * and saves direct out to Supabase `schemes` table.
 */

import crypto from 'crypto';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local strictly to get SUPABASE_SERVICE_KEY, GEMINI_API_KEY
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // MUST be Service Key for writing
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error("Missing SUPABASE_URL, SUPABASE_SERVICE_KEY, or GEMINI_API_KEY. Ensure .env.local is set up.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 1. DATA SOURCES
// ==========================================

async function fetchPibRSS() {
  console.log('Fetching PIB RSS...');
  try {
    const res = await fetch('https://pib.gov.in/RssMain.aspx');
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || [];
    
    // Process items. Standardize to a RawScheme object.
    return (Array.isArray(items) ? items : [items]).map(item => ({
      title: item.title,
      description: item.description,
      url: item.link,
      source: 'pib'
    }));
  } catch (error) {
    console.error('Error fetching PIB RSS:', error);
    return [];
  }
}

async function fetchMyGovRSS() {
  console.log('Fetching MyGov (Google News) RSS...');
  try {
    const res = await fetch('https://news.google.com/rss/search?q=mygov+india+schemes+yojana+welfare+new&hl=en-IN&gl=IN&ceid=IN:en');
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item || [];
    
    return (Array.isArray(items) ? items : [items]).map(item => ({
      title: item.title,
      description: item.description, // Google News descriptions can be messy, we pass it to AI to distill
      url: item.link,
      source: 'mygov'
    }));
  } catch (error) {
    console.error('Error fetching MyGov RSS:', error);
    return [];
  }
}

// ==========================================
// 2. UNSPLASH IMAGE FETCHING
// ==========================================
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'mRrS9UjMl45wy4Hy-Pm6oMv7TGG55Sb-o6VLDxcJQOA';

async function fetchUnsplashImage(keyword) {
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(keyword)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1&orientation=landscape`);
    const data = await res.json();
    if (data && data.results && data.results.length > 0) {
      return data.results[0].urls.regular;
    }
    return null; // fallback will be used on UI
  } catch (error) {
    console.error('Unsplash API error:', error);
    return null;
  }
}

// ==========================================
// 3. DEDUP & GEMINI PROCESSING
// ==========================================

function getHash(text) {
  return crypto.createHash('md5').update(text || '').digest('hex');
}

async function processWithGemini(rawScheme) {
  const prompt = `
    You are an expert Government Scheme Analyst. You are given a piece of raw news or RSS data about a new government scheme, program, or welfare benefit in India.
    Your task is to extract structured details and write a clear, professional article.
    
    RAW DATA:
    Title: ${rawScheme.title}
    Description: ${rawScheme.description}

    Read the data and return a pure JSON block describing the scheme. If the raw data is NOT about a government scheme/subsidy/welfare program, return {"is_scheme": false}.

    IMPORTANT JSON FORMAT (NO Markdown, strictly raw JSON):
    {
      "is_scheme": true,
      "name": "Full name of the scheme (e.g. PM Kisan Samman Nidhi)",
      "slug": "url-friendly-slug-with-in-suffix-eg-pm-kisan-in",
      "category": "One of: cash, housing, health, education, agriculture, women, elderly, disability, business, food, employment",
      "what_you_get": "1-2 sentence summary of exact benefits",
      "benefit_amount": "Short text e.g., '₹6000/year', 'Free Housing', or 'Variables dependent'",
      "target_group": ["Array of social categories applying. Options: SC, ST, OBC, BC, Minority, General, EWS, Women, BPL. Can have multiple."],
      "state_codes": ["Array of state codes if restricted to states. e.g. 'TS', 'AP'. Use 'ALL' if it's a central nationwide scheme."],
      "scheme_type": "central OR state",
      "eligibility": [{"title": "Requirement name", "description": "Detail about requirement"}],
      "how_to_apply": [{"title": "Step 1", "description": "What to do"}],
      "documents": ["List of string document names required"],
      "min_age": 18, // Integer or null if none
      "max_age": 60, // Integer or null if none
      "income_limit": 250000, // Number or null if none
      "article_content": "A detailed, blog-like, HTML-formatted article (<p>, <h3>, <ul> tags) elaborating on everything the user needs to know about the scheme."
    }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    let jsonContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonContent) return null;

    // Sanitize slightly in case of rogue markdown tags
    jsonContent = jsonContent.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(jsonContent);

  } catch (error) {
    console.error('Gemini processing error for', rawScheme.title);
    return null;
  }
}

// ==========================================
// MAIN EXECUTION
// ==========================================

async function main() {
  console.log('--- STARTING GLOBAL SCRAPER ---');
  
  // 1. Fetch raw data
  const pibData = await fetchPibRSS();
  const mygovData = await fetchMyGovRSS();
  // We take top 20 entries to populate the site faster
  const allRawData = [...pibData.slice(0, 20), ...mygovData.slice(0, 20)];
  
  console.log(`Discovered ${allRawData.length} total raw items to process.`);

  let inserted = 0;
  
  // 2. Process and Dedup
  for (const item of allRawData) {
    if (!item.title) continue;

    const sourceHash = getHash(item.title);
    
    // Check DB for existing hash (Dedup)
    const { data: existing } = await supabase
      .from('schemes')
      .select('id')
      .eq('source_hash', sourceHash)
      .limit(1);
      
    if (existing && existing.length > 0) {
      console.log(`[SKIP] Already processed: ${item.title}`);
      continue;
    }

    // Pass to Gemini
    console.log(`[AI] Processing: ${item.title}`);
    const schemeData = await processWithGemini(item);

    if (!schemeData || !schemeData.is_scheme) {
      console.log(`[REJECTED by AI] Not a scheme: ${item.title}`);
      continue;
    }

    // Enhance with Unsplash Image
    console.log(`[IMAGE] Fetching image for category: ${schemeData.category}`);
    const imageUrl = await fetchUnsplashImage(schemeData.category + ' india');

    console.log(`[DB] Inserting: ${schemeData.name}`);

    // Insert into DB
    const { error } = await supabase.from('schemes').insert({
      country_code: 'IN', // Based on sources currently
      name: schemeData.name,
      slug: schemeData.slug + '-' + Math.floor(Math.random() * 1000), // Ensure uniqueness
      category: schemeData.category,
      what_you_get: schemeData.what_you_get,
      benefit_amount: schemeData.benefit_amount,
      target_group: schemeData.target_group || [],
      state_codes: schemeData.state_codes || ['ALL'],
      scheme_type: schemeData.scheme_type || 'central',
      eligibility: schemeData.eligibility,
      how_to_apply: schemeData.how_to_apply,
      documents: schemeData.documents,
      min_age: schemeData.min_age || null,
      max_age: schemeData.max_age || null,
      income_limit: schemeData.income_limit || null,
      source_url: item.url,
      source_hash: sourceHash,
      article_content: schemeData.article_content,
      image_url: imageUrl,
      image_keyword: schemeData.category,
      is_active: true,
      is_published: true, // Auto-publish for the new premium feel
      source: item.source
    });

    if (error) {
      console.error('DB Insert Error:', error.message);
    } else {
      inserted++;
    }
  }

  console.log(`--- SCRAPING COMPLETE. Inserted ${inserted} new schemes. ---`);
}

main();
