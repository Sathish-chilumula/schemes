import * as fs from 'fs'
import * as path from 'path'
import { parseStringPromise } from 'xml2js'
import axios from 'axios'

const GROQ_KEY = process.env.GROQ_API_KEY!
const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const OPENAI_KEY = process.env.OPENAI_API_KEY || ''
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ''
const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY || ''
const GNEWS_KEY = process.env.GNEWS_API_KEY || ''
const FORCE_TOPIC = process.env.FORCE_TOPIC || ''
const ARTICLES_IN = parseInt(process.env.ARTICLES_IN || '5')   // 5 guides per day
const ARTICLES_US = parseInt(process.env.ARTICLES_US || '0')   // US guides disabled by default
const ENABLE_HINDI = process.env.ENABLE_HINDI === 'true'       // Hindi translation only
const DIR = path.join(process.cwd(), 'content/articles')
const INDEX_FILE = path.join(process.cwd(), 'content/articles-index.json')
const MODEL = 'llama-3.3-70b-versatile'

// Government loans & financial products Indians don't know about
// Real demand — massively underserved content with high-intent searchers
const AUTOCOMPLETE_SEEDS_IN = [
  'PM MUDRA loan apply online 2026',
  'government business loan without collateral india 2026',
  'PM SVANidhi street vendor loan 10000 apply 2026',
  'Stand Up India loan SC ST women 2026',
  'Kisan Credit Card KCC apply bank 2026',
  'PM Vishwakarma scheme artisan loan 2026',
  'CGTMSE collateral free loan MSME 2026',
  'PMAY urban subsidy home loan EWS LIG apply 2026',
  'Atal Pension Yojana register online bank 2026',
  'PM Fasal Bima Yojana apply crop insurance 2026',
  'Sukanya Samriddhi Yojana open account post office 2026',
  'government scheme women self employment SHG india 2026',
  'ayushman bharat health card apply 2026',
  'MSME emergency credit loan government india 2026',
  'state government scheme new launched 2026 india',
]

const AUTOCOMPLETE_SEEDS_US = [
  'personal loan usa 2026',
  'mortgage rates usa 2026',
  'health insurance plans usa 2026',
  'student loan forgiveness 2026',
  'IRS tax filing tips 2026',
  'best credit cards usa 2026',
  'government benefits usa 2026',
  'best index funds usa 2026',
]

// Fallback if autocomplete fails completely
const FALLBACK_SEEDS_IN = [
  'SBI personal loan apply 2026', 'best health insurance India 2026',
  'income tax saving tips India 2026', 'PM scheme apply online 2026',
  'mutual fund SIP best plan India 2026', 'gold loan interest rate India',
]
const FALLBACK_SEEDS_US = [
  'best mortgage rates USA 2026', 'health insurance marketplace 2026',
  'Roth IRA vs 401k 2026', 'student loan forgiveness update 2026',
]

const CATEGORY_IMAGES: Record<string, string> = {
  'loans': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200',
  'insurance': 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1200',
  'earn-money': 'https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&q=80&w=1200',
  'investment': 'https://images.unsplash.com/photo-1611974714658-dd4d18c01c11?auto=format&fit=crop&q=80&w=1200',
  'tax': 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=1200',
  'scholarship': 'https://images.unsplash.com/photo-15230503530b0-6984da937e12?auto=format&fit=crop&q=80&w=1200',
  'schemes': 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&q=80&w=1200'
}

function slug(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,80).trim()
}

async function fetchImage(keyword: string): Promise<string | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const cleanKeyword = keyword.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 40) + ' professional';
    const res = await axios.get(`https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanKeyword)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: PEXELS_API_KEY },
      timeout: 8000
    });
    if (res.data && res.data.photos && res.data.photos.length > 0) {
      return res.data.photos[0].src.large;
    }
  } catch (error) {
    console.warn(`⚠️ Pexels fetch failed for "${keyword}"`);
  }
  return null;
}

function existingSlugs(): Set<string> {
  if (!fs.existsSync(DIR)) { fs.mkdirSync(DIR, { recursive: true }); return new Set() }
  return new Set(fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).map(f=>f.replace('.json','')))
}

async function groq(user: string, system: string, tokens=4000): Promise<string> {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:'POST',
    headers:{ 'Authorization':`Bearer ${GROQ_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({ model:MODEL, max_tokens:tokens, temperature:0.6,
      messages:[{ role:'system', content:system },{ role:'user', content:user }] })
  })
  if (!r.ok) throw new Error(`Groq ${r.status}: ${await r.text()}`)
  return (await r.json()).choices[0].message.content.trim()
}

async function gemini(user: string, system: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY missing')
  
  // Rate limit protection: Max 15 RPM
  await new Promise(r => setTimeout(r, 4500)) 

  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${system}\n\n${user}` }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.2 }
    })
  })
  if (!r.ok) {
    const errText = await r.text()
    if (r.status === 429) {
      console.warn('⚠️ Gemini Rate Limited (429). Retrying in 10s...')
      await new Promise(r => setTimeout(r, 10000))
      return gemini(user, system) // Recursive retry once
    }
    throw new Error(`Gemini ${r.status}: ${errText}`)
  }
  return (await r.json()).candidates[0].content.parts[0].text.trim()
}

async function openai(user: string, system: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY missing')
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o-mini', response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
  })
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`)
  return (await r.json()).choices[0].message.content.trim()
}

async function translate(text: string, targetLang: string): Promise<string> {
  const system = `You are a professional translator for ${targetLang}. 
Translate the provided JSON content accurately while maintaining the JSON structure. 
Do not change slugs or URLs. Only translate user-facing text (title, intro, headings, content, faqs).`
  const user = `Translate this content to ${targetLang}:\n\n${text}`
  
  try {
    return await groq(user, system)
  } catch (e) {
    console.warn(`⚠️ Groq translation failed, falling back to Gemini: ${e}`)
    try {
      return await gemini(user, system)
    } catch (e2) {
      console.warn(`⚠️ Gemini translation failed, falling back to OpenAI: ${e2}`)
      try {
        return await openai(user, system)
      } catch (e3) {
        console.error(`❌ All translation providers failed: ${e3}`)
        throw e3
      }
    }
  }
}

function parseJSON(raw: string) {
  return JSON.parse(raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim())
}

// ── Google Autocomplete: get real user search phrases ──────────────────
async function fetchAutocomplete(seed: string): Promise<string[]> {
  try {
    const enc = encodeURIComponent(seed)
    const res = await axios.get(
      `https://suggestqueries.google.com/complete/search?output=firefox&q=${enc}`,
      { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const suggestions = (res.data?.[1] || []).filter((s: any) => typeof s === 'string')
    return suggestions as string[]
  } catch {
    return []
  }
}

// ── Demand-driven finance topic discovery ──────────────────────────────
// Collects what users actually search, not what we guess
async function discoverFinanceTopics(isUS: boolean): Promise<string[]> {
  const seeds = isUS ? AUTOCOMPLETE_SEEDS_US : AUTOCOMPLETE_SEEDS_IN
  const fallback = isUS ? FALLBACK_SEEDS_US : FALLBACK_SEEDS_IN
  const collected = new Set<string>()

  console.log(`\n🔍 Discovering ${isUS ? 'US' : 'IN'} finance topics via autocomplete (${seeds.length} seeds)...`)

  for (const seed of seeds) {
    const completions = await fetchAutocomplete(seed)
    completions.forEach(c => collected.add(c))
    await new Promise(r => setTimeout(r, 150))
  }

  const live = [...collected]
  console.log(`   → ${live.length} real user search phrases discovered`)

  // If autocomplete returned enough, use those. Otherwise fall back to seeds.
  const topics = live.length >= 5 ? live : fallback

  // Also fetch newsdata.io for trending finance news as additional context
  if (NEWSDATA_KEY) {
    try {
      const q = isUS ? 'personal finance loan insurance investment USA' : 'personal finance loan scheme insurance India'
      const country = isUS ? 'us' : 'in'
      const url = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent(q)}&country=${country}&language=en&size=10`
      const res = await axios.get(url, { timeout: 15000 })
      const articles = res.data?.results || []
      const newsTitles = articles.map((a: any) => a.title).filter(Boolean)
      console.log(`   → ${newsTitles.length} trending news articles added as extra context`)
      return [...topics, ...newsTitles, ...fallback] // topics first so AI prioritises them
    } catch {
      // newsdata failed, just use autocomplete
    }
  }

  return [...topics, ...fallback]
}

async function pickTopics(all: string[], done: Set<string>, count: number, country = 'IN') {
  const fresh = all.filter(t=>!done.has(slug(t))).slice(0,60)
  if (!fresh.length) return []

  const system = `You are head of content at SchemeAtlas.com. Niche: high CPC finance, loans, mutual funds, taxes, investments, insurance.
Return only valid JSON.`
  const user = `Target Country: ${country}. Topics:\n${fresh.join('\n')}\n
Pick ${count} best high-intent, high-CPC finance topics. Avoid duplicates.
Return JSON: { "selected": [{ "articleTitle": "...", "category": "...", "slug": "...", "whyNow": "..." }] }`

  let raw: string;
  try {
    raw = await groq(user, system, 2000)
  } catch (err) {
    console.warn(`⚠️ Groq pickTopics failed, falling back to Gemini: ${err}`)
    try {
      raw = await gemini(user, system)
    } catch (err2) {
      console.warn(`⚠️ Gemini pickTopics failed, falling back to OpenAI: ${err2}`)
      try {
        raw = await openai(user, system)
      } catch (err3) {
        console.error(`❌ All providers failed for pickTopics: ${err3}`)
        throw err3
      }
    }
  }

  const parsed = parseJSON(raw)
  return (parsed.selected||[]).slice(0,count).map((s:any) => ({ ...s, country }))
}

async function writeArticle(title: string, category: string, s: string, country = 'IN'): Promise<any> {
  const today = new Date().toISOString().split('T')[0]
  
  console.log(`   📸 Fetching image for "${title}"...`);
  let imageUrl = await fetchImage(category) || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['schemes']

  const system = `You are a senior financial writer. Writing for ${country === 'US' ? 'American' : 'Indian'} readers.
Niche: ${category}. No AI mentions. ONLY valid JSON.`
  const user = `Write a highly engaging 1500-word SEO article for "${title}". 
REQUIREMENTS:
- Include relevant emojis (🤑, 📈, 🏦, ✅, etc.) and symbols in the title, headings, and content to make it visually appealing and easy to read.
- Write in a friendly, conversational tone.
- JSON schema: { slug, title, metaTitle, metaDescription, category, publishedAt, updatedAt, readTime, wordCount, tableOfContents, intro, sections: [{heading, content}], faqs: [{q,a}], relatedSchemes, relatedArticles, tags }`

  try {
    const raw = await groq(user, system, 4000)
    const parsed = parseJSON(raw)
    return { ...parsed, slug: s, category, publishedAt: today, updatedAt: today, imageUrl, country }
  } catch (err) {
    console.warn(`⚠️ Groq write failed, falling back to Gemini: ${err}`)
    try {
      const raw = await gemini(user, system)
      const parsed = parseJSON(raw)
      return { ...parsed, slug: s, category, publishedAt: today, updatedAt: today, imageUrl, country }
    } catch (err2) {
      console.warn(`⚠️ Gemini write failed, falling back to OpenAI: ${err2}`)
      try {
        const raw = await openai(user, system)
        const parsed = parseJSON(raw)
        return { ...parsed, slug: s, category, publishedAt: today, updatedAt: today, imageUrl, country }
      } catch (err3) {
        console.error(`❌ All content providers failed: ${err3}`)
        throw err3
      }
    }
  }
}

function buildIndex() {
  if (!fs.existsSync(DIR)) return
  const files = fs.readdirSync(DIR).filter(f=>f.endsWith('.json'))
  const index = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf-8'))
    return {
      slug: data.slug, title: data.title, category: data.category,
      publishedAt: data.publishedAt, country: data.country || 'IN',
      desc: data.metaDescription || data.intro?.slice(0,100)
    }
  }).sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))
  console.log(`✅ Index regenerated: ${index.length} articles`)
}

async function main() {
  console.log(`🚀 SchemeAtlas Finance Articles Pipeline | ${new Date().toISOString()}`)
  const done = existingSlugs()

  // Demand-driven: discover what users are actually searching right now
  console.log('\n🤖 Starting demand-driven topic discovery...')
  const [topicsIN, topicsUS] = await Promise.all([
    discoverFinanceTopics(false),
    discoverFinanceTopics(true),
  ])

  const selectedIN = await pickTopics(topicsIN, done, ARTICLES_IN, 'IN')
  const selectedUS = await pickTopics(topicsUS, done, ARTICLES_US, 'US')
  const allSelected = [...selectedIN, ...selectedUS]
  
  for (const item of allSelected) {
    try {
      console.log(`\n─── Writing: ${item.articleTitle} (${item.country}) ───`)
      const article = await writeArticle(item.articleTitle, item.category, item.slug, item.country)
      fs.writeFileSync(path.join(DIR, `${item.slug}.json`), JSON.stringify(article, null, 2))
      
      // Translate to Hindi only (if ENABLE_HINDI=true and not US article)
      if (item.country !== 'US' && ENABLE_HINDI) {
        for (const lang of ['hi']) {
          console.log(`   Translating to ${lang}...`)
          try {
            const translated = parseJSON(await translate(JSON.stringify(article), lang === 'hi' ? 'Hindi' : 'Telugu'))
            const langSlug = `${item.slug}-${lang}`
            fs.writeFileSync(path.join(DIR, `${langSlug}.json`), JSON.stringify({ ...translated, slug: langSlug, country: item.country, lang }, null, 2))
          } catch (te) { console.error(`   ❌ ${lang} translation failed`) }
          await new Promise(r => setTimeout(r, 10000))
        }
      }
      
      await new Promise(r => setTimeout(r, 20000))
    } catch (e) { console.error(`❌ Failed:`, e) }
  }
  
  buildIndex()
}

main().catch(e=>{ console.error('Fatal:', e); process.exit(1) })
