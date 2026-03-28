# ClaimIt — Complete Site Blueprint
# ═══════════════════════════════════════════════════════

## 1. SITE MAP — Every Page

```
claimit.vercel.app/
│
├── /                          HOME PAGE
│   ├── Hero section
│   ├── Country selector (5 countries)
│   ├── How it works (3 steps)
│   ├── Recent schemes (auto-updated)
│   └── Footer
│
├── /IN                        INDIA SCHEMES PAGE
├── /GB                        UK SCHEMES PAGE
├── /US                        USA SCHEMES PAGE
├── /NG                        NIGERIA SCHEMES PAGE
├── /KE                        KENYA SCHEMES PAGE
│   ├── Search bar
│   ├── Category filter tabs
│   ├── Scheme cards grid
│   └── Check eligibility CTA
│
├── /IN/check                  PROFILE WIZARD (India)
├── /GB/check                  PROFILE WIZARD (UK)
├── /US/check                  PROFILE WIZARD (USA)
├── /NG/check                  PROFILE WIZARD (Nigeria)
├── /KE/check                  PROFILE WIZARD (Kenya)
│   ├── Step 1: Age, Gender, Language
│   ├── Step 2: Profession, Income, Family Size
│   └── Step 3: State/Region + Summary
│
├── /results/[sessionId]       ELIGIBILITY RESULTS
│   ├── Summary card (how many qualify)
│   ├── Eligible schemes (green border)
│   ├── Not eligible schemes (grayed)
│   ├── Apply buttons + WhatsApp share
│   └── Try another country
│
├── /schemes                   ALL SCHEMES (all countries)
│   ├── Country filter
│   └── Grid of all schemes
│
├── /schemes/[slug]            SCHEME DETAIL PAGE
│   ├── Scheme name + benefit amount
│   ├── Who can apply (eligibility)
│   ├── How to apply (step by step)
│   ├── Documents required
│   ├── Official apply link
│   ├── WhatsApp share
│   └── Related schemes
│
└── /api/eligibility           BACKEND API (internal)
    └── POST → Calls Gemini AI → Returns matched schemes
```

---

## 2. USER FLOW — Step by Step

```
User lands on claimit.vercel.app
         │
         ▼
IP auto-detects country (ipapi.co)
         │
         ▼
Sees country schemes + "Check My Benefits" CTA
         │
         ▼
Clicks → Goes to /[country]/check
         │
         ▼
Step 1: Fills age + gender + language preference
         │
         ▼
Step 2: Fills profession + income range + family size
         │
         ▼
Step 3: Selects state/region → Reviews summary → Submits
         │
         ▼
Profile saved to Supabase user_profiles table
         │
         ▼
Redirected to /results/[sessionId]
         │
         ▼
POST /api/eligibility called with session_id
         │
         ▼
API fetches all schemes for that country
         │
         ▼
For each scheme → Gemini AI checks eligibility
         │
         ▼
Results saved to eligibility_results table
         │
         ▼
Page shows: ✅ Eligible schemes first
            ℹ️ Not eligible schemes below
         │
         ▼
User clicks "Apply Now" → Goes to official govt site
User clicks "Share" → Opens WhatsApp
User clicks "View Details" → Goes to /schemes/[slug]
```

---

## 3. AUTOMATION FLOW — Every 6 Hours

```
GitHub Actions triggers (cron: 0 */6 * * *)
         │
         ▼
findSchemes.js runs
         │
    ┌────┴────┐
    │         │
    ▼         ▼
API calls   RSS feeds
(myScheme,  (PIB, gov.uk,
 gov.uk,     Google News)
 benefits.gov)
    │         │
    └────┬────┘
         │
         ▼
For each new item:
  - Check if already in DB (avoid duplicates)
  - Send to Gemini AI for extraction
  - Gemini returns structured JSON
         │
         ▼
Translate to local languages:
  India → Hindi + Telugu
  USA → Spanish
  Nigeria → Yoruba
  Kenya → Swahili
         │
         ▼
Save to Supabase:
  schemes table (main data)
  scheme_translations table
         │
         ▼
Website auto-shows new schemes (no deployment needed)
         │
         ▼
postSocial.js runs:
  → Post to Telegram channel (free, unlimited)
  → Post to Reddit (free API)
  → Post to LinkedIn (free API)
         │
         ▼
Log to social_posts table
```

---

## 4. DATABASE TABLES

```
countries
  code, name, flag, currency, languages[]

schemes
  id, country_code, name, slug, category
  what_you_get, benefit_amount
  eligibility (JSON), how_to_apply (JSON)
  documents[], official_url, image_keyword
  is_published, source, discovered_at

scheme_translations
  scheme_id, language, name, explanation, steps, example

user_profiles
  session_id, country_code, age, gender
  profession, annual_income, state_region
  family_size, language

eligibility_results
  profile_id, scheme_id
  is_eligible, confidence, reason
  benefit_amount, next_step

social_posts
  scheme_id, platform, post_url, status, posted_at
```

---

## 5. API SOURCES PER COUNTRY

### 🇮🇳 INDIA
| Source | Type | URL | Key Needed |
|--------|------|-----|-----------|
| myScheme API | Official API | api.myscheme.gov.in | Yes — API Setu |
| API Setu | API Gateway | apisetu.gov.in | Yes — free |
| data.gov.in | Open Data | data.gov.in | Yes — free |
| PIB RSS | RSS Feed | pib.gov.in/RssMain.aspx | No |
| Google News | RSS Feed | news.google.com/rss | No |

### 🇬🇧 UK
| Source | Type | URL | Key Needed |
|--------|------|-----|-----------|
| GOV.UK Content API | Official API | www.gov.uk/api/content | No |
| GOV.UK Search API | Official API | www.gov.uk/api/search.json | No |
| GOV.UK News Atom | RSS Feed | www.gov.uk/search/news.atom | No |
| Google News UK | RSS Feed | news.google.com/rss | No |

### 🇺🇸 USA
| Source | Type | URL | Key Needed |
|--------|------|-----|-----------|
| Benefits.gov API | Official API | www.benefits.gov/api/benefits | No |
| Federal Register API | Official API | www.federalregister.gov/api/v1 | No |
| USA.gov | Scraping | www.usa.gov/benefit-finder | No |
| Google News USA | RSS Feed | news.google.com/rss | No |

### 🇳🇬 NIGERIA (No Official API)
| Source | Type | URL | Key Needed |
|--------|------|-----|-----------|
| NASIMS | Scraping | www.nasims.gov.ng | No |
| N-Power | Scraping | npower.gov.ng | No |
| NSIP | Scraping | nsip.gov.ng | No |
| Google News NG | RSS Feed | news.google.com/rss | No |
| Gemini Vision | AI Scraping | pages → screenshot → AI reads | Gemini key |

### 🇰🇪 KENYA
| Source | Type | URL | Key Needed |
|--------|------|-----|-----------|
| Kenya Open Data | Official API | opendata.go.ke/api | No |
| Social Protection | Scraping | socialprotection.go.ke | No |
| Google News KE | RSS Feed | news.google.com/rss | No |

---

## 6. ALL API KEYS — WHERE TO GET EACH ONE

### GEMINI API (Most Important — AI Brain)
```
1. Go to: aistudio.google.com
2. Click "Get API Key"
3. Click "Create API Key"
4. Copy the key
Free tier: 1,500 requests/day, 15 requests/minute
Cost: Free for this usage
```

### SUPABASE (Database)
```
1. Go to: supabase.com
2. Create project → choose free tier
3. Settings → API
4. Copy: Project URL → NEXT_PUBLIC_SUPABASE_URL
5. Copy: anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
6. Copy: service_role key → SUPABASE_SERVICE_KEY
Cost: Free (500MB database, 2GB storage)
```

### API SETU — myScheme India (Official India API)
```
1. Go to: apisetu.gov.in
2. Click "Sign Up" (top right)
3. Register with email and mobile
4. After login → Search "myScheme" in API catalog
5. Click "Subscribe" on myScheme API
6. Go to My Applications → Copy API Key
7. Also register at: data.gov.in for more India data
Cost: Free
API URL: https://api.myscheme.gov.in/search/v4/schemes?lang=en&q=&keyword=&state=&central=Y&page=1&limit=50
```

### TELEGRAM BOT (Social — Easiest)
```
1. Open Telegram app
2. Search for @BotFather
3. Send: /newbot
4. Choose a name: "ClaimIt Schemes"
5. Choose a username: "claimit_schemes_bot"
6. Copy the token → TELEGRAM_BOT_TOKEN
7. Create a Telegram Channel
8. Add your bot as admin to the channel
9. Channel username → TELEGRAM_CHANNEL_ID (like @claimitschemes)
Cost: Free, unlimited posts
```

### REDDIT API (Social)
```
1. Go to: reddit.com/prefs/apps
2. Click "Create Another App"
3. Name: ClaimIt
4. Type: Select "script"
5. Redirect URI: http://localhost:8080
6. Click "Create App"
7. Copy: app ID (under app name) → REDDIT_CLIENT_ID
8. Copy: secret → REDDIT_CLIENT_SECRET
9. REDDIT_USERNAME: your reddit username
10. REDDIT_PASSWORD: your reddit password
Cost: Free (limited posts per day)
```

### LINKEDIN API (Social)
```
1. Go to: linkedin.com/developers
2. Create App → fill details
3. Products → Request access to "Share on LinkedIn"
4. Auth → OAuth 2.0 Settings
5. Get Access Token with scope: w_member_social
6. Copy token → LINKEDIN_ACCESS_TOKEN
7. Profile API → get your person ID → LINKEDIN_PERSON_ID
Cost: Free (personal posting)
Note: Token expires every 60 days — needs renewal
```

### UNSPLASH (Images)
```
1. Go to: unsplash.com/developers
2. Click "New Application"
3. Accept terms → fill app details
4. Copy Access Key → UNSPLASH_ACCESS_KEY
Free tier: 50 requests/hour
Cost: Free
```

---

## 7. GITHUB SECRETS TO ADD

Go to: github.com/Sathish-chilumula/schemes → Settings → Secrets → Actions

```
GEMINI_API_KEY          = (from aistudio.google.com)
SUPABASE_URL            = (from supabase.com settings)
SUPABASE_SERVICE_KEY    = (from supabase.com settings)
APISETU_KEY             = (from apisetu.gov.in)
TELEGRAM_BOT_TOKEN      = (from @BotFather)
TELEGRAM_CHANNEL_ID     = @yourchannel
REDDIT_CLIENT_ID        = (from reddit.com/prefs/apps)
REDDIT_CLIENT_SECRET    = (from reddit.com/prefs/apps)
REDDIT_USERNAME         = your_reddit_username
REDDIT_PASSWORD         = your_reddit_password
LINKEDIN_ACCESS_TOKEN   = (from linkedin.com/developers)
LINKEDIN_PERSON_ID      = your_linkedin_id
UNSPLASH_ACCESS_KEY     = (from unsplash.com/developers)
SITE_URL                = https://your-app.vercel.app
```

---

## 8. VERCEL ENVIRONMENT VARIABLES

Go to: vercel.com → your project → Settings → Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL     = https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_KEY          = your-service-role-key
GEMINI_API_KEY                = your-gemini-key
NEXT_PUBLIC_SITE_URL          = https://your-app.vercel.app
```

---

## 9. MONETIZATION PLAN

### Phase 1 (Month 1-2): AdSense
```
Apply for Google AdSense once 30+ articles live
Government/finance content = high CPM (₹100-400)
Place ads on:
  - Country scheme listing pages
  - Individual scheme detail pages
  - Results page
Expected: ₹5,000–20,000/month when traffic builds
```

### Phase 2 (Month 3): Premium Features
```
Free: See schemes you qualify for
Paid (₹49): Full PDF report with all documents checklist
Paid (₹199): Application assistance — we guide you step by step
Stripe integration for payments
```

### Phase 3 (Month 4+): Partnerships
```
NGO partnerships: They pay to reach beneficiaries
Government contracts: States pay to promote their schemes
Telemedicine referral for health schemes
Loan referral for MUDRA-type schemes
```

---

## 10. SEO STRATEGY

### URL Structure (Google loves this)
```
claimit.vercel.app/in/schemes          → "India government schemes"
claimit.vercel.app/in/schemes/pm-kisan → "PM Kisan eligibility"
claimit.vercel.app/gb/schemes          → "UK benefits checker"
claimit.vercel.app/us/schemes          → "USA assistance programs"
```

### hreflang Tags (tells Google which country)
```html
<link rel="alternate" hreflang="en-IN" href="/in/schemes" />
<link rel="alternate" hreflang="hi-IN" href="/in/schemes?lang=hi" />
<link rel="alternate" hreflang="en-GB" href="/gb/schemes" />
<link rel="alternate" hreflang="en-US" href="/us/schemes" />
```

### Submit To
```
Google Search Console: search.google.com/search-console
Bing Webmaster Tools: bing.com/webmasters
Submit sitemap: claimit.vercel.app/sitemap.xml
```

---

## 11. ADDING NEW COUNTRIES (30 mins each)

```
Step 1: Add to lib/config.ts
  - Country code, name, flag, currency
  - Languages array
  - Income ranges
  - States list
  - RSS feeds
  - Scraping targets
  - Subreddits

Step 2: Add to supabase_schema.sql countries table
  insert into countries values ('BR', 'Brazil', '🇧🇷', 'BRL', ...)

Step 3: Add to agents/findSchemes.js
  - Add RSS feeds to RSS_SOURCES object
  - Add translation languages to TRANSLATE_LANGS

Step 4: Add to agents/postSocial.js
  - Add subreddits to SUBREDDITS object

Step 5: Run agent manually
  GitHub → Actions → Run workflow

Next 5 countries to add:
  Brazil 🇧🇷 → R$ billions unclaimed
  South Africa 🇿🇦 → SASSA grants
  Philippines 🇵🇭 → 4Ps programme
  Bangladesh 🇧🇩 → Social safety net
  Indonesia 🇮🇩 → PKH programme
```

---

## 12. GROWTH STRATEGY

### Week 1-2: Launch
```
Push code to GitHub → Deploy on Vercel
Run Supabase SQL → Seed data appears
Share on WhatsApp groups manually
Create Telegram channel
```

### Month 1: Content
```
GitHub Actions runs every 6 hours
New schemes auto-published daily
Telegram channel grows organically
Reddit posts drive traffic
Google starts indexing pages
```

### Month 2: Scale
```
Apply for Google AdSense
Add 5 more countries
Submit to Bing, Google, Yandex
Start YouTube Shorts (scheme explainers)
```

### Month 3+: Revenue
```
AdSense revenue starts
Premium reports launch
NGO partnership outreach
Media coverage (first mover advantage)
```

---

## 13. WHAT HAPPENS WHEN USER SHARES ON WHATSAPP

```
User qualifies for PM Kisan
Clicks "Share with Family"
WhatsApp opens with pre-filled message:

"I found 8 government schemes worth ₹84,000/year 
I qualify for! Check yours free at ClaimIt 
→ https://claimit.vercel.app"

Family member clicks → Visits site
They fill their profile → Find their schemes
They share with their family → Viral growth

This is how Indian apps go viral:
WhatsApp sharing in villages and families
```

---

## 14. COMPLETE FILE LIST

```
claimit/
├── Frontend (Next.js)
│   ├── app/page.tsx                    Home page
│   ├── app/layout.tsx                  Root layout
│   ├── app/globals.css                 All styles
│   ├── app/[country]/page.tsx          Country schemes
│   ├── app/[country]/check/page.tsx    Profile wizard
│   ├── app/results/[sessionId]/        Results page
│   ├── app/schemes/page.tsx            All schemes
│   ├── app/schemes/[slug]/page.tsx     Scheme detail
│   └── app/api/eligibility/route.ts   Gemini API
│
├── Library
│   ├── lib/config.ts                   Country configs + APIs
│   └── lib/supabase.ts                Database client
│
├── Automation Agents
│   ├── agents/findSchemes.js           Finds new schemes
│   ├── agents/postSocial.js            Social media posting
│   └── agents/package.json            Dependencies
│
├── GitHub Actions
│   └── .github/workflows/
│       └── scheme-agent.yml           Runs every 6 hours
│
├── Database
│   └── supabase_schema.sql            Tables + seed data
│
└── Config Files
    ├── package.json
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── postcss.config.js
    ├── .eslintrc.json
    ├── .gitignore
    ├── .env.example
    └── next-env.d.ts
```

---

## 15. QUICK CHECKLIST — LAUNCH SEQUENCE

```
Day 1 — Setup (2 hours)
  □ Register on apisetu.gov.in → get myScheme API key
  □ Create Gemini API key at aistudio.google.com
  □ Run supabase_schema.sql in your Supabase project
  □ Push all code to GitHub
  □ Deploy on Vercel with env variables
  □ Create Telegram bot and channel

Day 2 — Test (1 hour)
  □ Visit your live site
  □ Select India → fill form → check results
  □ Verify schemes showing on country page
  □ Trigger GitHub Action manually
  □ Verify new schemes appear after agent runs
  □ Test Telegram posting

Day 3 — Launch
  □ Apply for Google AdSense
  □ Submit sitemap to Google Search Console
  □ Share on WhatsApp groups
  □ Post on LinkedIn about the launch
  □ Post on Reddit r/india and r/IndiaSpeaks
```
