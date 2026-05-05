import * as fs from 'fs'
import * as path from 'path'
import { parseStringPromise } from 'xml2js'
import axios from 'axios'

const GROQ_KEY = process.env.GROQ_API_KEY!
const GEMINI_KEY = process.env.GEMINI_API_KEY || ''
const OPENAI_KEY = process.env.OPENAI_API_KEY || ''
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || ''
const NEWSDATA_KEY = process.env.NEWSDATA_API_KEY || ''
const FORCE_TOPIC = process.env.FORCE_TOPIC || ''
const ARTICLES_IN = parseInt(process.env.ARTICLES_IN || '4')
const ARTICLES_US = parseInt(process.env.ARTICLES_US || '2')
const DIR = path.join(process.cwd(), 'content/articles')
const INDEX_FILE = path.join(process.cwd(), 'content/articles-index.json')
const MODEL = 'llama-3.3-70b-versatile'

const FINANCE_SEEDS_IN = [
  // Loans — very high CPC
  'personal loan India 2026', 'SBI personal loan apply online', 'home loan interest rate India 2026',
  'instant personal loan without documents India', 'gold loan interest rate India',
  'business loan for small business India', 'education loan India without collateral',
  'mudra loan apply online 2026', 'PMEGP loan scheme apply', 'EV vehicle loan scheme India',
  // Insurance — high CPC
  'best health insurance plan India 2026', 'term insurance plan comparison India',
  'PM Jeevan Jyoti Bima Yojana benefits', 'LIC policy for poor India',
  // Investment & Tax — high CPC
  'income tax saving tips India 2026', 'ELSS tax saving mutual fund India',
  'best SIP plan 2026 India', 'PPF vs NPS which is better 2026',
  'Sukanya Samriddhi Yojana interest rate 2026', 'Atal Pension Yojana benefits 2026',
  // Schemes — moderate-high CPC
  'PM scheme apply 2026 new', 'scholarship India 2026 apply online',
  'PMKVY registration 2026', 'earn money online India legally',
  'work from home government scheme India'
]

const FINANCE_SEEDS_US = [
  // Loans — high CPC
  'best personal loan USA 2026', 'home equity loan vs HELOC 2026',
  'FHA loan requirements 2026', 'student loan forgiveness update 2026',
  'small business loan USA apply 2026',
  // Credit & Banking
  'best credit cards USA cashback 2026', 'high yield savings account rates 2026',
  'best mortgage rates USA 2026',
  // Investment & Tax
  'IRS tax filing tips 2026', 'Roth IRA vs traditional IRA 2026',
  'best index funds 2026 USA', '401k contribution limits 2026',
  'how to invest 10000 dollars USA 2026',
  // Benefits
  'health insurance plans marketplace 2026 USA', 'unemployment benefits USA 2026',
  'disability benefits apply SSA 2026', 'SNAP food stamp benefits 2026',
  'social security benefits increase 2026'
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
    body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: system }, { role: 'user', content: user }] })
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
      console.error(`❌ All translation providers failed: ${e2}`)
      throw e2
    }
  }
}

function parseJSON(raw: string) {
  return JSON.parse(raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim())
}

// Replaces Google Trends (blocked on GitHub Actions IPs)
// Uses newsdata.io to find real trending finance/scheme topics
async function fetchNewsTopics(isUS = false): Promise<string[]> {
  if (!NEWSDATA_KEY) {
    console.warn('⚠️ NEWSDATA_API_KEY not set. Using seed topics.')
    return isUS ? FINANCE_SEEDS_US : FINANCE_SEEDS_IN
  }
  try {
    const q = isUS
      ? 'personal finance loan insurance investment tax USA'
      : 'personal finance loan scheme insurance investment India'
    const country = isUS ? 'us' : 'in'
    const url = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_KEY}&q=${encodeURIComponent(q)}&country=${country}&language=en&size=10`
    const res = await axios.get(url, { timeout: 15000 })
    const articles = res.data?.results || []
    const titles = articles.map((a: any) => a.title).filter(Boolean)
    console.log(`✅ newsdata.io → ${titles.length} finance topics (${isUS ? 'US' : 'IN'})`)
    // Combine with seed queries so we always have fallback content
    return [...titles, ...(isUS ? FINANCE_SEEDS_US : FINANCE_SEEDS_IN)]
  } catch (e) {
    console.warn(`⚠️ newsdata.io fetch failed: ${e}. Using seeds.`)
    return isUS ? FINANCE_SEEDS_US : FINANCE_SEEDS_IN
  }
}

async function pickTopics(all: string[], done: Set<string>, count: number, country = 'IN') {
  const fresh = all.filter(t=>!done.has(slug(t))).slice(0,60)
  if (!fresh.length) return []

  const system = `You are head of content at SchemeAtlas.com. Niche: high CPC finance, loans, mutual funds, taxes, investments, insurance.
Return only valid JSON.`
  const user = `Target Country: ${country}. Topics:\n${fresh.join('\n')}\n
Pick ${count} best high-intent, high-CPC finance topics. Avoid duplicates.
Return JSON: { "selected": [{ "articleTitle": "...", "category": "...", "slug": "...", "whyNow": "..." }] }`

  const raw = await groq(user, system, 2000)
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
      console.error(`❌ All content providers failed: ${err2}`)
      throw err2
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
  console.log(`🚀 SchemeAtlas Pipeline | ${new Date().toISOString()}`)
  const done = existingSlugs()
  
  // Get topics from newsdata.io (replaces blocked Google Trends)
  const [newsIN, newsUS] = await Promise.all([
    fetchNewsTopics(false), fetchNewsTopics(true)
  ])
  
  const topicsIN = await pickTopics(newsIN, done, ARTICLES_IN, 'IN')
  const topicsUS = await pickTopics(newsUS, done, ARTICLES_US, 'US')
  const allSelected = [...topicsIN, ...topicsUS]
  
  for (const item of allSelected) {
    try {
      console.log(`\n─── Writing: ${item.articleTitle} (${item.country}) ───`)
      const article = await writeArticle(item.articleTitle, item.category, item.slug, item.country)
      fs.writeFileSync(path.join(DIR, `${item.slug}.json`), JSON.stringify(article, null, 2))
      
      // Translate if not US
      if (item.country !== 'US') {
        for (const lang of ['hi', 'te']) {
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
