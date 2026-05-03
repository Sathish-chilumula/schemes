/**
 * SchemeAtlas Article Generator
 * Source 1: Google Trends RSS India (free, no key)
 * Source 2: google-trends-api related queries for finance seeds
 * Filter + Write: Groq llama-3.3-70b-versatile (fast, free tier)
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseStringPromise } from 'xml2js'

const GROQ_KEY = process.env.GROQ_API_KEY!
const FORCE_TOPIC = process.env.FORCE_TOPIC || ''
const PER_RUN = parseInt(process.env.ARTICLES_PER_RUN || '3')
const DIR = path.join(process.cwd(), 'content/articles')
const MODEL = 'llama-3.3-70b-versatile'

const FINANCE_SEEDS = [
  'personal loan India', 'health insurance India', 'earn money online India',
  'government scheme 2025', 'home loan India', 'SBI loan apply',
  'income tax saving India', 'mutual fund SIP India', 'business loan India',
  'scholarship India 2025', 'PM scheme apply', 'insurance plan India',
  'freelancing India', 'work from home India', 'PMKVY registration',
]

function slug(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').slice(0,80).trim()
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

function parseJSON(raw: string) {
  return JSON.parse(raw.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim())
}

// ── SOURCE 1: Google Trends Daily RSS India ──────────────────
async function getTrendingIndia(): Promise<string[]> {
  try {
    const r = await fetch('https://trends.google.com/trending/rss?geo=IN', {
      headers:{ 'User-Agent':'Mozilla/5.0 (compatible; SchemeAtlas/1.0)', 'Accept':'application/rss+xml' }
    })
    if (!r.ok) return []
    const xml = await r.text()
    const parsed = await parseStringPromise(xml)
    const items = parsed?.rss?.channel?.[0]?.item || []
    const topics = items.slice(0,30).map((i:any)=>i?.title?.[0]||'').filter(Boolean)
    console.log(`📡 Google Trends India: ${topics.length} topics | Top: ${topics.slice(0,5).join(' · ')}`)
    return topics
  } catch(e) {
    console.warn('⚠️  Trends RSS failed:', e)
    return []
  }
}

// ── SOURCE 2: Related finance queries from Trends ────────────
async function getRelatedFinanceQueries(): Promise<string[]> {
  try {
    const gt = (await import('google-trends-api')).default;
    const results: string[] = []
    const seeds = FINANCE_SEEDS.sort(()=>Math.random()-0.5).slice(0,5)
    for (const seed of seeds) {
      try {
        const raw = await gt.relatedQueries({ keyword:seed, geo:'IN',
          startTime: new Date(Date.now() - 7*24*60*60*1000) })
        const data = JSON.parse(raw)
        const rising = data?.default?.rankedList?.[0]?.rankedKeyword || []
        rising.slice(0,4).map((k:any)=>k?.query).filter(Boolean).forEach((q:string)=>results.push(q))
        await new Promise(r=>setTimeout(r,1500))
      } catch { /* skip this seed */ }
    }
    const unique = [...new Set(results)]
    console.log(`📊 Related finance queries: ${unique.length} topics`)
    return unique
  } catch {
    console.warn('⚠️  google-trends-api not available')
    return []
  }
}

// ── GROQ: Filter + pick best topics ─────────────────────────
async function pickTopics(all: string[], done: Set<string>, count: number) {
  const fresh = [...new Set(all)].filter(t=>!done.has(slug(t))).slice(0,60)
  if (!fresh.length) throw new Error('No new topics — all published already.')

  const today = new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Kolkata'})
  const list = fresh.map((t,i)=>`${i+1}. ${t}`).join('\n')

  const system = `You are head of content at SchemeAtlas.com — India's top finance and government schemes site.
Today is ${today}. Niche: loans, insurance, government schemes, earn money, investment, tax, scholarships.
Reject anything outside this niche even if trending. Return only valid JSON, no extra text.`

  const user = `Today's trending Google India searches + rising finance queries:\n\n${list}\n\n
Pick the best ${count} topics to write articles on SchemeAtlas TODAY.
Rank by: niche relevance → search intent value → urgency for Indian users.
For each, craft a compelling specific article title (not the raw keyword).
Example: "SBI loan" → "SBI Personal Loan 2025: Interest Rate, Eligibility & How to Apply"

Return JSON:
{
  "selected": [
    {
      "rawTopic": "...",
      "articleTitle": "compelling, specific, SEO-optimised title with year",
      "category": "loans|insurance|earn-money|schemes|investment|tax|scholarship",
      "slug": "url-slug",
      "whyNow": "one sentence"
    }
  ]
}`

  const raw = await groq(user, system, 2000)
  const parsed = parseJSON(raw)
  console.log(`\n🎯 Selected ${parsed.selected?.length || 0} topics:`)
  parsed.selected?.forEach((s:any,i:number)=>console.log(`  ${i+1}. [${s.category}] ${s.articleTitle}\n     → ${s.whyNow}`))
  return (parsed.selected||[]).slice(0,count)
}

// ── GROQ: Write full article ─────────────────────────────────
async function writeArticle(title: string, category: string, s: string): Promise<object> {
  const today = new Date().toISOString().split('T')[0]

  const system = `You are a senior financial writer at SchemeAtlas.com writing for Indian readers.
Rules: accurate real data (bank names, scheme names, amounts, eligibility),
structured for Google Featured Snippets, never mention AI or writing tools,
write like a knowledgeable Indian financial advisor. Return ONLY valid JSON, no markdown.`

  const user = `Write a complete 1500-word SEO article for SchemeAtlas.com.
Topic: "${title}" | Category: ${category}

Return this exact JSON (every field required):
{
  "slug": "${s}",
  "title": "${title}",
  "metaTitle": "<max 60 chars with keyword + year>",
  "metaDescription": "<max 155 chars, compelling, ends with benefit>",
  "category": "${category}",
  "publishedAt": "${today}",
  "updatedAt": "${today}",
  "readTime": "<X min read>",
  "wordCount": <number>,
  "tableOfContents": ["<h2 1>","<h2 2>","<h2 3>","<h2 4>","<h2 5>"],
  "intro": "<2-3 punchy sentences, hook the reader, include main keyword>",
  "sections": [
    { "heading": "<H2 — answer main question directly>", "content": "<400+ words, real data, facts, names>" },
    { "heading": "<H2 — comparison table or ranked list>", "content": "<structured comparison with real banks/schemes/amounts>" },
    { "heading": "<H2 — eligibility and who qualifies>", "content": "<specific criteria, income limits, documents needed>" },
    { "heading": "Step-by-Step: How to Apply or Get Started", "content": "<numbered steps with real URLs where applicable>" },
    { "heading": "Important Things to Know Before You Decide", "content": "<warnings, hidden costs, common mistakes, pro tips>" }
  ],
  "faqs": [
    { "q": "<#1 most searched question from real Indian users>", "a": "<direct 2-3 sentence answer with a fact/number>" },
    { "q": "<second question>", "a": "<answer>" },
    { "q": "<eligibility or documents question>", "a": "<answer>" },
    { "q": "<comparison or best-option question>", "a": "<answer>" }
  ],
  "relatedSchemes": ["<scheme-slug>","<scheme-slug>"],
  "relatedArticles": [],
  "tags": ["<tag1>","<tag2>","<tag3>","<tag4>"]
}`

  const raw = await groq(user, system, 4000)
  const parsed = parseJSON(raw)
  if (!parsed.title || !parsed.sections || parsed.sections.length < 3)
    throw new Error('Article missing required fields')
  return parsed
}

// ── MAIN ─────────────────────────────────────────────────────
async function main() {
  console.log(`🚀 SchemeAtlas Article Generator | ${new Date().toISOString()}`)
  const done = existingSlugs()
  console.log(`📚 Already published: ${done.size} articles`)

  let selected: any[]

  if (FORCE_TOPIC) {
    selected = [{ articleTitle: FORCE_TOPIC, category: 'schemes', slug: slug(FORCE_TOPIC) }]
  } else {
    const [trending, related] = await Promise.all([getTrendingIndia(), getRelatedFinanceQueries()])
    const allTopics = [...trending, ...related]
    if (!allTopics.length) throw new Error('No topics fetched from any source')
    selected = await pickTopics(allTopics, done, PER_RUN)
  }

  const published: string[] = []

  for (let i = 0; i < selected.length; i++) {
    const { articleTitle: title, category, slug: s } = selected[i]
    const finalSlug = s || slug(title)
    try {
      console.log(`\n─── Article ${i+1}/${selected.length}: ${title} ───`)
      const article = await writeArticle(title, category, finalSlug)
      fs.writeFileSync(path.join(DIR, `${finalSlug}.json`), JSON.stringify(article, null, 2))
      console.log(`✅ Saved: content/articles/${finalSlug}.json`)
      published.push(finalSlug)
      done.add(finalSlug)
      if (i < selected.length-1) await new Promise(r=>setTimeout(r,3000))
    } catch(e) {
      console.error(`❌ Failed article ${i+1}:`, e)
    }
  }

  console.log(`\n✅ Done. Published ${published.length}/${selected.length}: ${published.join(', ')}`)
}

main().catch(e=>{ console.error('Fatal:', e); process.exit(1) })
