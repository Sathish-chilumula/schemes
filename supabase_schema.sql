-- ============================================
-- CLAIMIT — GLOBAL SCHEME FINDER
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. COUNTRIES TABLE
create table if not exists countries (
  code        text primary key,       -- IN, GB, US, NG, KE
  name        text not null,
  flag        text,                   -- emoji flag
  currency    text,
  languages   text[],                 -- ['te','hi','en']
  is_active   boolean default true,
  created_at  timestamp default now()
);

-- 2. SCHEMES TABLE (core)
create table if not exists schemes (
  id              uuid primary key default gen_random_uuid(),
  country_code    text references countries(code),
  name            text not null,
  slug            text unique not null,
  category        text not null,      -- cash/housing/health/education/agriculture/women/elderly
  what_you_get    text,               -- exact benefit description
  benefit_amount  text,               -- "₹6,000/year" or "£1,200/year"
  eligibility     jsonb,              -- structured eligibility rules
  how_to_apply    jsonb,              -- step by step JSON
  documents       text[],             -- required documents list
  deadline        text,
  official_url    text,
  image_url       text,
  image_keyword   text,               -- for Unsplash search
  is_active       boolean default true,
  is_published    boolean default false,
  source          text,               -- api/scrape/manual
  discovered_at   timestamp default now(),
  updated_at      timestamp default now()
);

-- 3. SCHEME TRANSLATIONS
create table if not exists scheme_translations (
  id          uuid primary key default gen_random_uuid(),
  scheme_id   uuid references schemes(id) on delete cascade,
  language    text not null,          -- te, hi, en, yo, sw, es
  name        text,
  explanation text,                   -- simple language explanation
  steps       text,                   -- how to apply in local language
  example     text,                   -- relatable real example story
  created_at  timestamp default now(),
  unique(scheme_id, language)
);

-- 4. USER PROFILES (session based, no login needed)
create table if not exists user_profiles (
  id              uuid primary key default gen_random_uuid(),
  session_id      text unique not null,
  country_code    text references countries(code),
  age             integer,
  gender          text,
  profession      text,
  annual_income   bigint,             -- in local currency
  state_region    text,
  family_size     integer,
  categories      text[],             -- interests
  language        text default 'en',
  created_at      timestamp default now()
);

-- 5. ELIGIBILITY RESULTS
create table if not exists eligibility_results (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references user_profiles(id) on delete cascade,
  scheme_id       uuid references schemes(id),
  is_eligible     boolean,
  confidence      text,               -- high/medium/low
  reason          text,               -- why eligible or not
  benefit_amount  text,               -- exact amount for this person
  next_step       text,               -- what to do first
  checked_at      timestamp default now()
);

-- 6. SOCIAL POSTS LOG
create table if not exists social_posts (
  id          uuid primary key default gen_random_uuid(),
  scheme_id   uuid references schemes(id),
  platform    text not null,          -- reddit/linkedin/telegram/x
  post_id     text,                   -- platform's post id
  post_url    text,
  posted_at   timestamp default now(),
  status      text default 'posted'   -- posted/failed
);

-- ============================================
-- INDEXES for fast queries
-- ============================================
create index if not exists idx_schemes_country on schemes(country_code);
create index if not exists idx_schemes_category on schemes(category);
create index if not exists idx_schemes_published on schemes(is_published);
create index if not exists idx_translations_scheme on scheme_translations(scheme_id);
create index if not exists idx_results_profile on eligibility_results(profile_id);

-- ============================================
-- SEED DATA — 5 Countries
-- ============================================
insert into countries (code, name, flag, currency, languages) values
  ('IN', 'India',   '🇮🇳', 'INR', ARRAY['en','hi','te','ta','kn']),
  ('GB', 'UK',      '🇬🇧', 'GBP', ARRAY['en']),
  ('US', 'USA',     '🇺🇸', 'USD', ARRAY['en','es']),
  ('NG', 'Nigeria', '🇳🇬', 'NGN', ARRAY['en','yo','ha']),
  ('KE', 'Kenya',   '🇰🇪', 'KES', ARRAY['en','sw'])
on conflict do nothing;

-- ============================================
-- SEED DATA — Sample India Schemes
-- ============================================
insert into schemes (
  country_code, name, slug, category,
  what_you_get, benefit_amount,
  eligibility, how_to_apply, documents,
  official_url, image_keyword,
  is_active, is_published, source
) values
(
  'IN',
  'PM Kisan Samman Nidhi',
  'pm-kisan-samman-nidhi',
  'agriculture',
  'Direct cash transfer to farmer families',
  '₹6,000/year (₹2,000 every 4 months)',
  '{"age_min": 18, "profession": ["farmer"], "land_ownership": "required", "income_max": null, "excluded": ["government employees", "taxpayers"]}',
  '{"steps": ["Visit pmkisan.gov.in", "Click New Farmer Registration", "Enter Aadhaar number", "Fill land details", "Submit and track status"]}',
  ARRAY['Aadhaar card', 'Land ownership documents', 'Bank account details'],
  'https://pmkisan.gov.in',
  'indian farmer field agriculture',
  true, true, 'manual'
),
(
  'IN',
  'Ayushman Bharat PM-JAY',
  'ayushman-bharat-pmjay',
  'health',
  'Free health insurance for hospitalisation',
  '₹5,00,000/year per family',
  '{"income_max": 150000, "categories": ["BPL families", "SECC listed families"], "family_size_min": null}',
  '{"steps": ["Visit pmjay.gov.in", "Check eligibility with Aadhaar", "Get Ayushman card from CSC center", "Use card at empanelled hospital"]}',
  ARRAY['Aadhaar card', 'Ration card', 'SECC/BPL certificate if available'],
  'https://pmjay.gov.in',
  'hospital health insurance india family',
  true, true, 'manual'
),
(
  'IN',
  'PM Awas Yojana (Gramin)',
  'pm-awas-yojana-gramin',
  'housing',
  'Financial assistance to build a pucca house',
  '₹1,20,000 (plain areas) / ₹1,30,000 (hilly areas)',
  '{"residence": "rural", "housing": "homeless or kutcha house", "categories": ["SC/ST", "minorities", "BPL", "EWS"]}',
  '{"steps": ["Contact Gram Panchayat", "Apply through Awaas+ app or portal", "Get registered on AwaasSoft", "Receive funds in installments after construction milestones"]}',
  ARRAY['Aadhaar card', 'Bank account', 'Job card (MGNREGA)', 'Caste certificate if applicable'],
  'https://pmayg.nic.in',
  'rural house construction india village',
  true, true, 'manual'
),
(
  'GB',
  'Universal Credit',
  'universal-credit-uk',
  'cash',
  'Monthly payment to help with living costs',
  'Up to £1,229/month depending on circumstances',
  '{"age_min": 18, "age_max": 66, "residence": "UK", "work_status": ["unemployed", "low income", "part time"]}',
  '{"steps": ["Create account at universal-credit.service.gov.uk", "Complete online application (40 mins)", "Verify identity", "Attend job centre interview", "Receive first payment after 5 weeks"]}',
  ARRAY['National Insurance number', 'Bank account details', 'Rent/mortgage details', 'Earnings proof'],
  'https://www.gov.uk/universal-credit',
  'UK benefits welfare support person',
  true, true, 'manual'
),
(
  'US',
  'SNAP Food Assistance',
  'snap-food-assistance-usa',
  'cash',
  'Monthly benefits to buy food at stores',
  'Up to $291/month per person',
  '{"income_max_percent_poverty": 130, "citizenship": ["US citizen", "legal resident"], "work_requirement": "20hrs/week if 18-49 without dependents"}',
  '{"steps": ["Find your state SNAP office at fns.usda.gov/snap", "Complete state application online or in person", "Attend eligibility interview", "Receive EBT card within 30 days"]}',
  ARRAY['Photo ID', 'Proof of income', 'Social Security number', 'Proof of residence'],
  'https://www.fns.usda.gov/snap',
  'food assistance grocery store USA family',
  true, true, 'manual'
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table schemes enable row level security;
alter table scheme_translations enable row level security;
alter table countries enable row level security;
alter table user_profiles enable row level security;
alter table eligibility_results enable row level security;

-- Public read access for schemes and translations
create policy "Public read schemes" on schemes for select using (is_published = true);
create policy "Public read translations" on scheme_translations for select using (true);
create policy "Public read countries" on countries for select using (is_active = true);

-- Users can create and read their own profiles
create policy "Users manage own profile" on user_profiles
  for all using (session_id = current_setting('app.session_id', true));

create policy "Users read own results" on eligibility_results
  for select using (
    profile_id in (
      select id from user_profiles
      where session_id = current_setting('app.session_id', true)
    )
  );

-- Service role can do everything (for backend agents)
create policy "Service full access schemes" on schemes for all
  using (auth.role() = 'service_role');

create policy "Service full access translations" on scheme_translations for all
  using (auth.role() = 'service_role');

create policy "Service insert profiles" on user_profiles for insert
  with check (true);

create policy "Service insert results" on eligibility_results for insert
  with check (true);
