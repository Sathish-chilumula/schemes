# SchemeAtlas — Global Government Scheme Finder 🌍

Find every government benefit you qualify for. Free. In your language. For 50+ countries.

---

## 🚀 Quick Setup Guide (Do This First)

### Step 1 — Supabase Database
1. Go to supabase.com → Your project → SQL Editor
2. Copy entire contents of `supabase_schema.sql`
3. Paste and click Run
4. Database is ready with 5 countries + sample schemes

### Step 2 — Get Your Secret Keys
Collect these (all free):

| Key | Where to Get |
|-----|-------------|
| GEMINI_API_KEY | aistudio.google.com |
| SUPABASE_URL | Supabase → Settings → API |
| SUPABASE_SERVICE_KEY | Supabase → Settings → API → service_role |
| TELEGRAM_BOT_TOKEN | Telegram → @BotFather → /newbot |
| TELEGRAM_CHANNEL_ID | Your channel username with @ |
| REDDIT_CLIENT_ID | reddit.com/prefs/apps |
| REDDIT_CLIENT_SECRET | reddit.com/prefs/apps |
| REDDIT_USERNAME | Your Reddit username |
| REDDIT_PASSWORD | Your Reddit password |
| SITE_URL | Your Vercel URL after deployment |

### Step 3 — Add GitHub Secrets
1. Go to your GitHub repo → Settings → Secrets → Actions
2. Add each key from Step 2 as a secret

### Step 4 — Frontend (Lovable.dev)
1. Open LOVABLE_PROMPT.md
2. Copy the entire prompt
3. Paste into Lovable.dev
4. Add your Supabase URL and anon key
5. Deploy → connect to this GitHub repo

### Step 5 — Test Agents Locally
```bash
cd agents
npm install
node findSchemes.js   # Find new schemes
node postSocial.js    # Post to social media
```

### Step 6 — Automation is Live!
GitHub Actions runs automatically every 6 hours.
New schemes → published to website → posted to social media.
Zero manual work needed.

---

## 📁 Project Structure

```
schemes/
├── agents/
│   ├── findSchemes.js      # Finds new schemes from RSS + AI
│   ├── checkEligibility.js # Matches user to schemes
│   ├── postSocial.js       # Posts to Telegram/Reddit/LinkedIn
│   └── package.json
├── .github/
│   └── workflows/
│       └── scheme-agent.yml # Runs every 6 hours
├── supabase_schema.sql      # Database setup (run first!)
├── LOVABLE_PROMPT.md        # Build frontend with Lovable
└── README.md
```

---

## 🌍 Supported Countries

| Country | API Source | Languages |
|---------|-----------|-----------|
| 🇮🇳 India | myScheme API + PIB RSS | English, Hindi, Telugu |
| 🇬🇧 UK | gov.uk API | English |
| 🇺🇸 USA | USA.gov + Benefits.gov | English, Spanish |
| 🇳🇬 Nigeria | Web scraping | English, Yoruba |
| 🇰🇪 Kenya | opendata.go.ke | English, Swahili |

---

## 💰 Monetization

- Google AdSense (high CPM for government/finance content)
- Premium eligibility reports (₹49)
- Application assistance (₹199-499)
- NGO partnerships

---

## 🔧 Adding New Countries

1. Add country to `supabase_schema.sql` countries table
2. Add RSS feeds to `agents/findSchemes.js` RSS_SOURCES
3. Add subreddits to `agents/postSocial.js` SUBREDDITS
4. Add languages to COUNTRY_LANGUAGES
5. Run the agent — new country live!

---

## 📱 Social Media Setup

### Telegram (Easiest — Do This First)
1. Open Telegram → search @BotFather
2. Send /newbot
3. Follow instructions → get token
4. Create a channel
5. Add bot as admin
6. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID to GitHub secrets

### Reddit
1. Go to reddit.com/prefs/apps
2. Click "create another app"
3. Type: script
4. Add redirect URI: http://localhost:8080
5. Get client_id and secret

### LinkedIn
1. Go to linkedin.com/developers
2. Create app
3. Get access token (valid 60 days, needs refresh)

---

Built with ❤️ by one person using:
- Next.js + Supabase (free)
- Gemini Flash API (free)
- GitHub Actions (free)
- Vercel (free)
- Total cost: ₹800/year (domain only)
