# SchemeAtlas — Lovable.dev Frontend Prompt
# Copy this prompt into Lovable.dev to build the complete UI

---

## PROMPT FOR LOVABLE.DEV

Build a complete web app called "SchemeAtlas" — a global government scheme finder.

## Tech Stack
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Supabase (already configured)
- shadcn/ui components

## Design Style
- Clean, trustworthy like Wise.com
- Mobile-first (most users on phone)
- Primary color: #1B4FFF (deep blue)
- Success color: #00C853 (green)
- Large readable text
- Flag emoji for countries

---

## PAGES TO BUILD

### 1. Home Page (/)

Hero section:
- Headline: "Find every government benefit you qualify for"
- Subheadline: "Free. In your language. For 50+ countries worldwide."
- Large CTA button: "Check My Benefits →"

Country selector grid below hero:
- Show 5 country cards with flag + name
- India 🇮🇳, UK 🇬🇧, USA 🇺🇸, Nigeria 🇳🇬, Kenya 🇰🇪
- Each card clickable → goes to /[country]/check

Stats bar:
- "50+ Countries" | "1,000+ Schemes" | "Completely Free"

How it works section (3 steps):
1. Tell us about yourself (icon: person)
2. We find your schemes (icon: search)  
3. Claim your benefits (icon: money)

Recent schemes section:
- Fetch from Supabase: select * from schemes where is_published=true order by discovered_at desc limit 6
- Show as cards with: name, country flag, benefit_amount, category badge

---

### 2. Country Page (/[country])

URL params: country = IN, GB, US, NG, KE

- Show country flag + name as header
- "X schemes available in [Country]"
- Filter bar: All | Cash | Housing | Health | Education | Agriculture
- Grid of scheme cards
- Each card: scheme name, benefit amount, category badge, "Check Eligibility" button

Fetch: select * from schemes where country_code = [country] and is_published = true

---

### 3. Profile Form (/[country]/check)

Step-by-step wizard with progress bar (3 steps)

Step 1 — Basic Info:
- Age (number input)
- Gender (radio: Male / Female / Other)
- Country auto-filled from URL

Step 2 — Financial Info:
- Profession (dropdown: Farmer / Employee / Self-employed / Student / Unemployed / Homemaker / Retired)
- Annual Income (number + currency based on country)
- Family Size (1-10 stepper)

Step 3 — Location:
- State/Region (text input)
- Language preference (based on country: English + local languages)

Submit button: "Find My Schemes →"

On submit:
- Save profile to Supabase user_profiles table
- Generate session_id with uuid
- Store session_id in localStorage
- Redirect to /results/[session_id]

---

### 4. Results Page (/results/[session_id])

Loading state: "Checking 47 schemes for you..."

After loading:
- Show count: "✅ X schemes found for you!"
- Eligible schemes first (highlighted green border)
- Each scheme card shows:
  - Scheme name (bold)
  - ✅ You qualify! (green) or ℹ️ Might qualify (yellow)
  - Benefit amount (large, blue)
  - Reason (1 line)
  - "View Details" button
  - "Share on WhatsApp" button

WhatsApp share button should open:
https://wa.me/?text=I found X government schemes worth ₹XX,XXX that I qualify for! Check yours → [link]

---

### 5. Scheme Detail Page (/schemes/[slug])

Full scheme information:
- Scheme name (h1)
- Country flag + name
- Benefit amount (large, highlighted)
- Category badge

Tabs:
1. Overview — what_you_get description
2. Eligibility — checklist of who qualifies
3. How to Apply — numbered steps
4. Documents — list of required documents

CTA button: "Apply Now →" (links to official_url)

Share section:
- "Share with family" WhatsApp button
- Copy link button

Related schemes section:
- Fetch 3 schemes from same country and category

---

### 6. Language Toggle Component

Small toggle in header:
- Shows current language
- For India: English | हिंदी | తెలుగు
- For USA: English | Español
- For Nigeria: English | Yoruba
- Saves preference to localStorage
- Re-fetches translations from scheme_translations table

---

## SUPABASE INTEGRATION

Environment variables needed:
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

Key queries to implement:

```typescript
// Get schemes by country
const { data } = await supabase
  .from('schemes')
  .select('*')
  .eq('country_code', country)
  .eq('is_published', true)
  .order('discovered_at', { ascending: false });

// Get translation for scheme
const { data } = await supabase
  .from('scheme_translations')
  .select('*')
  .eq('scheme_id', schemeId)
  .eq('language', userLanguage)
  .single();

// Save user profile
const { data } = await supabase
  .from('user_profiles')
  .insert({
    session_id: generateUUID(),
    country_code: country,
    age, gender, profession,
    annual_income, state_region,
    family_size, language
  })
  .select()
  .single();
```

---

## SEO REQUIREMENTS

Each page needs:
- Dynamic meta title: "[Scheme Name] — Free Government Benefits | SchemeAtlas"
- Meta description based on scheme content
- hreflang tags for multilingual pages
- Open Graph tags for social sharing

Country pages URL structure:
- /in/schemes → India
- /gb/schemes → UK  
- /us/schemes → USA

---

## MOBILE REQUIREMENTS

- All buttons minimum 44px height
- Large fonts (minimum 16px body)
- Bottom navigation on mobile:
  Home | Search | Saved | Profile

---

Build this complete app with clean, professional design.
Make it feel trustworthy for government benefits information.
Focus on simplicity — users may not be tech-savvy.
