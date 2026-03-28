-- ═══════════════════════════════════════════════════════════
-- CLAIMIT — COMPLETE SUPABASE SCHEMA
-- Run this ONCE in Supabase → SQL Editor → Paste → Run
-- ═══════════════════════════════════════════════════════════

-- ── TABLES ──────────────────────────────────────────────────

create table if not exists countries (
  code        text primary key,
  name        text not null,
  flag        text,
  currency    text,
  languages   text[],
  is_active   boolean default true,
  created_at  timestamptz default now()
);

create table if not exists schemes (
  id              uuid primary key default gen_random_uuid(),
  country_code    text references countries(code),
  name            text not null,
  slug            text unique not null,
  category        text not null,
  what_you_get    text,
  benefit_amount  text,
  eligibility     jsonb default '{}',
  how_to_apply    jsonb default '{"steps":[]}',
  documents       text[] default '{}',
  deadline        text,
  official_url    text,
  image_url       text,
  image_keyword   text,
  is_active       boolean default true,
  is_published    boolean default false,
  source          text default 'manual',
  discovered_at   timestamptz default now(),
  updated_at      timestamptz default now()
);

create table if not exists scheme_translations (
  id          uuid primary key default gen_random_uuid(),
  scheme_id   uuid references schemes(id) on delete cascade,
  language    text not null,
  name        text,
  explanation text,
  steps       text,
  example     text,
  created_at  timestamptz default now(),
  unique(scheme_id, language)
);

create table if not exists user_profiles (
  id              uuid primary key default gen_random_uuid(),
  session_id      text unique not null,
  country_code    text references countries(code),
  age             integer,
  gender          text,
  profession      text,
  annual_income   bigint default 0,
  state_region    text,
  family_size     integer default 1,
  language        text default 'en',
  created_at      timestamptz default now()
);

create table if not exists eligibility_results (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references user_profiles(id) on delete cascade,
  scheme_id       uuid references schemes(id) on delete cascade,
  is_eligible     boolean default false,
  confidence      text default 'low',
  reason          text,
  benefit_amount  text,
  next_step       text,
  checked_at      timestamptz default now()
);

create table if not exists social_posts (
  id          uuid primary key default gen_random_uuid(),
  scheme_id   uuid references schemes(id) on delete cascade,
  platform    text not null,
  post_id     text,
  post_url    text,
  status      text default 'posted',
  posted_at   timestamptz default now()
);

-- ── INDEXES ─────────────────────────────────────────────────

create index if not exists idx_schemes_country    on schemes(country_code);
create index if not exists idx_schemes_category   on schemes(category);
create index if not exists idx_schemes_published  on schemes(is_published);
create index if not exists idx_schemes_slug       on schemes(slug);
create index if not exists idx_translations_scheme on scheme_translations(scheme_id);
create index if not exists idx_results_profile    on eligibility_results(profile_id);
create index if not exists idx_social_scheme      on social_posts(scheme_id);
create index if not exists idx_profiles_session   on user_profiles(session_id);

-- ── SEED: COUNTRIES ─────────────────────────────────────────

insert into countries (code, name, flag, currency, languages) values
  ('IN', 'India',          '🇮🇳', 'INR', ARRAY['en','hi','te','ta','kn','mr']),
  ('GB', 'United Kingdom', '🇬🇧', 'GBP', ARRAY['en']),
  ('US', 'United States',  '🇺🇸', 'USD', ARRAY['en','es']),
  ('NG', 'Nigeria',        '🇳🇬', 'NGN', ARRAY['en','yo','ha']),
  ('KE', 'Kenya',          '🇰🇪', 'KES', ARRAY['en','sw'])
on conflict (code) do nothing;

-- ── SEED: INDIA SCHEMES ─────────────────────────────────────

insert into schemes (country_code, name, slug, category, what_you_get, benefit_amount, eligibility, how_to_apply, documents, official_url, image_keyword, is_published, source) values

('IN','PM Kisan Samman Nidhi','pm-kisan-samman-nidhi-in','agriculture',
'Direct income support cash transferred to farmer bank accounts every 4 months',
'₹6,000/year (₹2,000 every 4 months)',
'{"profession":["Farmer"],"land_ownership":"required","excluded":["government employees","income tax payers","professionals"]}',
'{"steps":["Visit pmkisan.gov.in","Click New Farmer Registration","Enter your Aadhaar number","Fill in land and bank details","Submit — funds arrive within 2-4 weeks"]}',
ARRAY['Aadhaar card','Land ownership document (Khasra/Khatauni)','Bank passbook (account linked to Aadhaar)'],
'https://pmkisan.gov.in','indian farmer field paddy','true','manual'),

('IN','Ayushman Bharat PM-JAY','ayushman-bharat-pmjay-in','health',
'Free health insurance for hospitalization at government and private empanelled hospitals',
'₹5,00,000/year per family',
'{"income_max":150000,"categories":["BPL families","SECC 2011 listed families","Antyodaya Anna Yojana card holders"]}',
'{"steps":["Visit pmjay.gov.in or call 14555","Check your eligibility using Aadhaar or ration card","Visit nearest CSC or Ayushman Mitra to get your Ayushman card (Golden Card)","Show card at any empanelled hospital for free treatment"]}',
ARRAY['Aadhaar card','Ration card or SECC certificate','BPL card if available'],
'https://pmjay.gov.in','hospital doctor patient india health','true','manual'),

('IN','PM Awas Yojana Gramin','pm-awas-yojana-gramin-in','housing',
'Financial assistance to build a permanent pucca house for homeless or kutcha house families',
'₹1,20,000 (plain areas) / ₹1,30,000 (hilly and difficult areas)',
'{"residence":"rural","housing":"homeless or kutcha/dilapidated house","categories":["SC/ST","minority communities","BPL families","EWS","freed bonded labour"]}',
'{"steps":["Contact your Gram Panchayat or Block Development Office","Get your name registered in Awaas+ app","Receive first installment after survey and approval","Build house as per guidelines","Receive remaining installments linked to construction progress"]}',
ARRAY['Aadhaar card','BPL/SECC certificate','Bank account (linked to Aadhaar)','Job card (MGNREGA)','Caste certificate if applicable'],
'https://pmayg.nic.in','rural house construction india village brick','true','manual'),

('IN','PM Matru Vandana Yojana','pm-matru-vandana-yojana-in','women',
'Cash incentive for pregnant and lactating mothers for first live birth to improve health and nutrition',
'₹5,000 in 3 installments (₹1000 + ₹2000 + ₹2000)',
'{"gender":"Female","condition":"pregnant first time","age_min":19,"work_status":"employed in unorganised sector or casual worker"}',
'{"steps":["Register at nearest Anganwadi Centre or approved health facility","Fill PMMVY Form 1-A","Submit required documents","Receive first installment after registration","Get subsequent installments after antenatal checkup and delivery"]}',
ARRAY['Aadhaar card','Bank account passbook','MCP (Mother and Child Protection) card','Ration card'],
'https://wcd.nic.in/schemes/pradhan-mantri-matru-vandana-yojana','pregnant woman mother india hospital','true','manual'),

('IN','PM MUDRA Yojana','pm-mudra-yojana-in','business',
'Collateral-free loans to small and micro businesses and entrepreneurs through bank and NBFCs',
'Shishu: up to ₹50,000 | Kishore: ₹50,001–₹5 lakh | Tarun: ₹5 lakh–₹10 lakh',
'{"profession":["Self-employed","Business owner","Artisan","Small trader","Micro enterprise"],"citizenship":"Indian"}',
'{"steps":["Visit nearest bank, MFI, or NBFC","Fill MUDRA loan application form","Submit business plan and required documents","Loan sanctioned within 7-14 working days","Receive MUDRA RuPay debit card with loan amount"]}',
ARRAY['Aadhaar card','PAN card','Business proof or plan','2 passport photos','Bank statements (6 months)','Quotation for machinery or equipment if applicable'],
'https://www.mudra.org.in','small business shop india entrepreneur','true','manual'),

('IN','Pradhan Mantri Ujjwala Yojana','pradhan-mantri-ujjwala-yojana-in','cash',
'Free LPG gas connection to women from BPL households for clean cooking fuel',
'Free LPG connection worth ₹1,600 + subsidized first refill',
'{"gender":"Female","income":"BPL household","age_min":18,"categories":["BPL","SC/ST","PMAY beneficiaries","Antyodaya Anna Yojana","forest dwellers"]}',
'{"steps":["Visit nearest LPG distributor (HP/Bharat/Indane gas)","Fill KYC form (Form 1 and Form 2)","Submit Aadhaar, BPL certificate, bank details","Connection installed at home within 7 days","First subsidized cylinder delivered"]}',
ARRAY['Aadhaar card','BPL ration card or certificate','Bank passbook','Passport photo','Self-declaration for no existing LPG connection'],
'https://www.pmujjwalayojana.com','woman cooking gas stove india kitchen','true','manual'),

('IN','National Scholarship Portal','national-scholarship-portal-in','education',
'Merit and means-based scholarships for students from minority, SC/ST/OBC communities for school and college',
'₹1,000 to ₹20,000/year depending on course and category',
'{"categories":["SC","ST","OBC","Minorities","EWS"],"income_max":250000,"condition":"student enrolled in school or college"}',
'{"steps":["Visit scholarships.gov.in","Register with Aadhaar and mobile number","Select the right scholarship scheme","Fill application with marks and income details","Upload documents","Submit before deadline — check portal for annual dates"]}',
ARRAY['Aadhaar card','Income certificate','Caste certificate','Bonafide student certificate','Previous year marksheet','Bank account details'],
'https://scholarships.gov.in','student study books india scholarship','true','manual')

on conflict (slug) do nothing;

-- ── SEED: UK SCHEMES ────────────────────────────────────────

insert into schemes (country_code, name, slug, category, what_you_get, benefit_amount, eligibility, how_to_apply, documents, official_url, image_keyword, is_published, source) values

('GB','Universal Credit','universal-credit-gb','cash',
'Monthly payment to help with living costs if you are on a low income or out of work',
'Up to £1,229/month depending on circumstances',
'{"age_min":18,"age_max":66,"residence":"UK","work_status":["unemployed","low income","part-time worker"],"savings_max":16000}',
'{"steps":["Go to universal-credit.service.gov.uk","Create a Government Gateway account","Complete online claim (takes about 40 minutes)","Verify your identity online or at Jobcentre","Attend new claimant interview","Receive first payment after 5-week wait"]}',
ARRAY['National Insurance number','Proof of identity (passport or driving licence)','Bank account details','Rent or mortgage information','Payslips or income proof if employed'],
'https://www.gov.uk/universal-credit','uk benefits welfare office person','true','manual'),

('GB','Child Benefit','child-benefit-gb','family',
'Regular payment for people responsible for bringing up a child under 16 (or under 20 in education or training)',
'£25.60/week for first child, £16.95/week for each additional child',
'{"condition":"responsible for a child under 16 or under 20 in approved education","residence":"UK"}',
'{"steps":["Complete Child Benefit claim form CH2 (download from gov.uk)","Send form to HMRC Child Benefit Office by post","Allow 12 weeks for first payment","Payments made every 4 weeks (Mondays or Tuesdays)"]}',
ARRAY['Childs birth certificate','Your National Insurance number','Bank account details'],
'https://www.gov.uk/child-benefit','child baby parent family uk','true','manual'),

('GB','Pension Credit','pension-credit-gb','elderly',
'Extra money to help with living costs if you are over State Pension age and on a low income',
'Up to £218.15/week for single person, £332.95/week for couples',
'{"age_min":66,"residence":"UK","income":"low income"}',
'{"steps":["Call Pension Credit claim line: 0800 99 1234","Or apply online at gov.uk/pension-credit/how-to-claim","Have your National Insurance number and bank details ready","Claim can be backdated up to 3 months"]}',
ARRAY['National Insurance number','Bank account details','Information about income, savings, investments','Details of any housing costs'],
'https://www.gov.uk/pension-credit','elderly couple pension uk retirement','true','manual'),

('GB','Housing Benefit','housing-benefit-gb','housing',
'Help paying rent if you are on a low income — applies to council or private rented accommodation',
'Varies — up to full rent in some cases',
'{"income":"low income","residence":"renting in UK","age_min":16,"excluded":["full-time students unless exceptions apply"]}',
'{"steps":["Contact your local council housing benefit office","Fill in housing benefit claim form","Provide income and tenancy details","Council processes within 14 days","Payments made directly to you or your landlord"]}',
ARRAY['Proof of identity','Tenancy agreement','Bank statements (2 months)','Proof of income or benefits','National Insurance number'],
'https://www.gov.uk/housing-benefit','uk housing rent apartment building','true','manual')

on conflict (slug) do nothing;

-- ── SEED: USA SCHEMES ───────────────────────────────────────

insert into schemes (country_code, name, slug, category, what_you_get, benefit_amount, eligibility, how_to_apply, documents, official_url, image_keyword, is_published, source) values

('US','SNAP Food Assistance','snap-food-assistance-us','food',
'Monthly benefits loaded onto an EBT card to buy food at grocery stores, supermarkets and farmers markets',
'Up to $291/month per person (average $187/month)',
'{"income_max_percent_fpl":130,"citizenship":["US citizen","qualified legal resident"],"work_requirement":"20hrs/week if able-bodied 18-49 without dependents"}',
'{"steps":["Find your state SNAP office at fns.usda.gov/snap/state-directory","Apply online through your state portal or visit local office","Complete eligibility interview (phone or in person)","Provide required documents","Receive EBT card within 30 days (7 days if emergency)","Card reloaded monthly — use at any SNAP-authorized store"]}',
ARRAY['Photo ID (drivers license or state ID)','Proof of income (pay stubs, benefit letters)','Social Security numbers for all household members','Proof of residence (utility bill or lease)','Bank statements if applicable'],
'https://www.fns.usda.gov/snap','grocery store food shopping family usa','true','manual'),

('US','Medicaid','medicaid-us','health',
'Free or low-cost health coverage for people with low income including doctor visits, hospital care, prescriptions',
'Free comprehensive health coverage',
'{"income_max_percent_fpl":138,"categories":["low-income adults","children","pregnant women","elderly","disabled"]}',
'{"steps":["Visit HealthCare.gov or your state Medicaid office website","Create an account and complete application","Or apply in person at local Medicaid office","Eligibility determined within 45 days (90 days if disability)","Receive Medicaid card by mail","Use card at any Medicaid-accepting provider"]}',
ARRAY['Proof of identity','Social Security number','Proof of income','Proof of state residency','Immigration documentation if applicable'],
'https://www.medicaid.gov','doctor hospital patient usa health insurance','true','manual'),

('US','Section 8 Housing Choice Voucher','section-8-housing-us','housing',
'Rental assistance subsidy — you pay 30% of income toward rent and the government pays the rest to your landlord',
'Varies — average subsidy covers $700-$1,200/month of rent',
'{"income_max_percent_ami":50,"citizenship":["US citizen","eligible non-citizen"],"condition":"must find own housing that meets HUD standards"}',
'{"steps":["Contact your local Public Housing Agency (PHA) — find at hud.gov/program","Apply when waitlist is open (often only open occasionally)","Wait for waitlist call — can take months to years","Attend briefing when voucher issued","Find housing within 60-120 days","Landlord inspection and lease signing"]}',
ARRAY['Photo ID for all adults','Social Security numbers','Birth certificates for children','Proof of income','References from past landlords'],
'https://www.hud.gov/topics/housing_choice_voucher_program_section_8','apartment housing rent usa affordable','true','manual'),

('US','Social Security Disability (SSDI)','ssdi-us','disability',
'Monthly benefit for people who cannot work due to a medical condition expected to last at least 12 months or result in death',
'Average $1,537/month (up to $3,822/month in 2024)',
'{"condition":"unable to work due to medical disability for 12+ months","work_history":"must have enough work credits (about 5 of last 10 years)","age":"under full retirement age"}',
'{"steps":["Apply online at ssa.gov/disability","Or call Social Security at 1-800-772-1213","Or visit local Social Security office","Gather all medical records before applying","Decision takes 3-6 months typically","If denied, appeal within 60 days"]}',
ARRAY['Birth certificate','Social Security card','Medical records from all treating doctors','Work history for last 15 years','Tax returns (W-2s) for last year','Bank account for direct deposit'],
'https://www.ssa.gov/disability','disability wheelchair medical usa social security','true','manual')

on conflict (slug) do nothing;

-- ── SEED: NIGERIA SCHEMES ───────────────────────────────────

insert into schemes (country_code, name, slug, category, what_you_get, benefit_amount, eligibility, how_to_apply, documents, official_url, image_keyword, is_published, source) values

('NG','N-Power Youth Employment','npower-youth-ng','employment',
'Skills training and monthly stipend for unemployed Nigerian graduates and non-graduates to gain work experience',
'₦30,000/month stipend for 2 years',
'{"age_min":18,"age_max":35,"citizenship":"Nigerian","condition":"unemployed","education":["graduates","non-graduates accepted for N-Power Build and N-Power Agro"]}',
'{"steps":["Visit npower.gov.ng when application portal opens","Register with valid email and phone number","Complete online assessment test","Wait for shortlisting SMS/email","Attend physical verification at designated centre","Begin deployment and receive monthly stipends"]}',
ARRAY['National ID card or NIN slip','Bank Verification Number (BVN)','Educational certificates','Recent passport photograph','Bank account details'],
'https://npower.gov.ng','young people training nigeria youth employment','true','manual'),

('NG','TraderMoni Scheme','tradermoni-ng','business',
'Interest-free micro-credit loan for petty traders and artisans at the bottom of the pyramid',
'₦10,000 initial loan (increases to ₦50,000 on repayment)',
'{"occupation":["petty trader","market vendor","artisan","shoemaker","tailor","welder"],"condition":"registered trader"}',
'{"steps":["Look for TraderMoni enumerators at your market or trade area","Register using your phone number and BVN","Loan disbursed directly to your bank account or mobile money","Repay over 6 months to access higher loan amounts"]}',
ARRAY['Bank Verification Number (BVN)','Valid phone number','Proof of trade (any ID showing your trade)'],
'https://tradermoni.gov.ng','market trader woman nigeria small business','true','manual'),

('NG','National Social Investment Programme','nsip-ng','cash',
'Conditional cash transfer to the poorest and most vulnerable Nigerian households',
'₦5,000/month per household',
'{"categories":["Poorest households","Women-headed households","Persons with disability","Elderly without support"],"condition":"must be registered in National Social Register"}',
'{"steps":["Check if your community is in the National Social Register — visit nsip.gov.ng","If not registered, contact your Local Government Social Welfare office","Attend community verification exercise","Receive payment through mobile money or bank transfer","Comply with conditionalities — school attendance for children, health visits"]}',
ARRAY['National ID or NIN','Bank account or mobile money account','Household registration documents'],
'https://nsip.gov.ng','poor family nigeria social welfare cash','true','manual')

on conflict (slug) do nothing;

-- ── SEED: KENYA SCHEMES ─────────────────────────────────────

insert into schemes (country_code, name, slug, category, what_you_get, benefit_amount, eligibility, how_to_apply, documents, official_url, image_keyword, is_published, source) values

('KE','Inua Jamii Cash Transfer','inua-jamii-cash-transfer-ke','elderly',
'Bi-monthly cash transfer to elderly persons (65+) and persons with severe disability to support basic needs',
'KSh 2,000 every 2 months (KSh 12,000/year)',
'{"age_min":65,"categories":["elderly 65+","orphans and vulnerable children","persons with severe disability"],"citizenship":"Kenyan","income":"poor household"}',
'{"steps":["Visit your nearest Sub-County Social Development Office","Fill in registration form with a social development officer","Officer conducts household verification visit","If approved, receive Inua Jamii card","Collect payment at designated point every 2 months (M-Pesa or bank)"]}',
ARRAY['National ID card','Age verification document','Certificate of disability (for PWD applicants)','Recent passport photo','Bank account or M-Pesa number'],
'https://www.socialprotection.go.ke','elderly woman kenya africa cash support','true','manual'),

('KE','HELB Student Loan','helb-student-loan-ke','education',
'Low-interest student loans and bursaries for Kenyan students in public universities and colleges',
'KSh 35,000–60,000/year (loan) + up to KSh 30,000 bursary for needy students',
'{"citizenship":"Kenyan","condition":"admitted to public university or TVET","income":"means-tested for bursary component"}',
'{"steps":["Register at helb.co.ke using your national ID","Complete online loan application form","Upload required documents","Application reviewed within 3 weeks","Loan disbursed directly to your university account","Bursary component goes to university fee account"]}',
ARRAY['National ID card','Kenya Revenue Authority PIN','KCSE certificate','University admission letter','Parents or guardians ID','Evidence of parents income or death certificate if orphan'],
'https://www.helb.co.ke','student university kenya education college','true','manual'),

('KE','Uwezo Fund','uwezo-fund-ke','business',
'Interest-free loans for women, youth and persons with disability to start or expand businesses',
'KSh 50,000–500,000 per group',
'{"categories":["Women","Youth 18-35","Persons with disability"],"condition":"must form a group of 10-15 members","citizenship":"Kenyan"}',
'{"steps":["Form a self-help group of 10-15 eligible members","Register your group with Sub-County office","Open a joint bank account","Apply for Uwezo Fund at Sub-County office","Receive training in financial literacy","Funds disbursed to group account"]}',
ARRAY['Group registration certificate','National IDs for all members','Group bank account details','Business plan','Certificate of registration for PWD groups'],
'https://uwezofund.go.ke','women group business kenya entrepreneur','true','manual')

on conflict (slug) do nothing;

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

alter table schemes enable row level security;
alter table scheme_translations enable row level security;
alter table countries enable row level security;
alter table user_profiles enable row level security;
alter table eligibility_results enable row level security;
alter table social_posts enable row level security;

-- Public can read published schemes
create policy "public read schemes" on schemes
  for select using (is_published = true);

-- Public can read translations
create policy "public read translations" on scheme_translations
  for select using (true);

-- Public can read countries
create policy "public read countries" on countries
  for select using (is_active = true);

-- Anyone can insert a user profile (no login needed)
create policy "public insert profiles" on user_profiles
  for insert with check (true);

-- Users can read their own profile by session_id
create policy "public read own profile" on user_profiles
  for select using (true);

-- Anyone can insert eligibility results
create policy "public insert results" on eligibility_results
  for insert with check (true);

-- Anyone can read eligibility results
create policy "public read results" on eligibility_results
  for select using (true);

-- Service role can do everything (used by agents)
create policy "service all schemes" on schemes
  for all using (auth.role() = 'service_role');

create policy "service all translations" on scheme_translations
  for all using (auth.role() = 'service_role');

create policy "service all social" on social_posts
  for all using (auth.role() = 'service_role');

create policy "service all profiles" on user_profiles
  for all using (auth.role() = 'service_role');

create policy "service all results" on eligibility_results
  for all using (auth.role() = 'service_role');
