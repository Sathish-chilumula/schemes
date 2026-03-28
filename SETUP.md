# SchemeAtlas — Complete Setup Guide

## STEP 1: Run Supabase SQL
Open supabase_schema.sql → paste in Supabase SQL Editor → Run

## STEP 2: Add GitHub Secrets
Go to: your repo → Settings → Secrets → Actions → New secret

| Secret Name | Where to get |
|-------------|-------------|
| GEMINI_API_KEY | aistudio.google.com → Get API Key |
| SUPABASE_URL | Supabase → Settings → API → Project URL |
| SUPABASE_SERVICE_KEY | Supabase → Settings → API → service_role key |
| NEXT_PUBLIC_SUPABASE_URL | Same as SUPABASE_URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase → Settings → API → anon key |
| TELEGRAM_BOT_TOKEN | Telegram → @BotFather → /newbot |
| TELEGRAM_CHANNEL_ID | Your channel like @mychannel |
| REDDIT_CLIENT_ID | reddit.com/prefs/apps → create app |
| REDDIT_CLIENT_SECRET | same page |
| REDDIT_USERNAME | your reddit username |
| REDDIT_PASSWORD | your reddit password |
| LINKEDIN_ACCESS_TOKEN | linkedin.com/developers |
| LINKEDIN_PERSON_ID | your LinkedIn ID |
| SITE_URL | https://your-app.vercel.app |

## STEP 3: Deploy to Vercel
1. Go to vercel.com → Add New Project → Import GitHub repo
2. Add environment variables:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_KEY
   - GEMINI_API_KEY
   - NEXT_PUBLIC_SITE_URL (your vercel URL)
3. Click Deploy

## STEP 4: Push Code to GitHub
```bash
cd /path/to/downloaded/schemeatlas
git init
git remote add origin https://github.com/Sathish-chilumula/schemes.git
git add .
git commit -m "Initial SchemeAtlas build"
git push -u origin main
```

## STEP 5: Test Automation
GitHub → your repo → Actions → "Scheme Discovery" → Run workflow

## BLUEPRINT — What Each File Does

```
schemeatlas/
├── app/
│   ├── page.tsx                    ← Home: hero + country selector + recent schemes
│   ├── layout.tsx                  ← Root layout with fonts and meta
│   ├── globals.css                 ← All styles (Tailwind + custom)
│   ├── [country]/
│   │   ├── page.tsx                ← Country page: all schemes with filter/search
│   │   └── check/page.tsx          ← 3-step profile wizard form
│   ├── results/[sessionId]/
│   │   └── page.tsx                ← AI eligibility results page
│   ├── schemes/
│   │   ├── page.tsx                ← All schemes listing (all countries)
│   │   └── [slug]/page.tsx         ← Individual scheme detail page
│   └── api/eligibility/
│       └── route.ts                ← Backend: calls Gemini for matching
├── lib/
│   ├── config.ts                   ← ALL country data, APIs, languages, income ranges
│   └── supabase.ts                 ← Supabase client + TypeScript types
├── agents/
│   ├── findSchemes.js              ← Finds new schemes via RSS + Gemini AI
│   ├── postSocial.js               ← Posts to Telegram, Reddit, LinkedIn
│   └── package.json                ← Agent dependencies
├── .github/workflows/
│   └── scheme-agent.yml            ← Runs agents every 6 hours automatically
├── supabase_schema.sql             ← Complete database schema + seed data
├── package.json                    ← Next.js dependencies
├── tailwind.config.js              ← Tailwind CSS config
├── next.config.js                  ← Next.js config
├── tsconfig.json                   ← TypeScript config
└── .env.example                    ← Copy to .env.local with your keys
```

## USER FLOW
1. User visits schemeatlas.vercel.app
2. IP auto-detects country OR user selects country
3. User fills 3-step form (age, profession, income, location)
4. AI checks eligibility against all schemes in Supabase
5. Results page shows eligible schemes with apply buttons
6. User shares on WhatsApp → viral growth

## AUTOMATION FLOW (every 6 hours)
1. GitHub Actions triggers
2. findSchemes.js fetches RSS feeds from 5 countries
3. Gemini AI extracts scheme details
4. Translations generated (Hindi, Telugu, Swahili, etc.)
5. Saved to Supabase → appears on website instantly
6. postSocial.js posts to Telegram + Reddit + LinkedIn

## COUNTRIES & DATA SOURCES
- India: PIB RSS + myScheme API + Google News
- UK: gov.uk API + Google News (free, no key needed)
- USA: Federal Register + Google News (free, no key needed)
- Nigeria: Google News + web scraping (no official API)
- Kenya: opendata.go.ke + Google News

## ADDING NEW COUNTRIES (takes 30 mins)
1. Add to lib/config.ts COUNTRIES object
2. Add RSS feeds in agents/findSchemes.js
3. Add subreddits in agents/postSocial.js
4. Add to supabase countries table
5. Run agent → done!
