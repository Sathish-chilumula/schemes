// ═══════════════════════════════════════════════════════
// CLAIMIT — COMPLETE COUNTRY CONFIGURATION
// Every country: API sources, scraping targets, languages
// ═══════════════════════════════════════════════════════

export const COUNTRIES: Record<string, CountryConfig> = {

  // ── INDIA ────────────────────────────────────────────
  IN: {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    currency: 'INR',
    currencySymbol: '₹',
    languages: ['en', 'hi', 'te', 'ta', 'kn', 'mr'],
    defaultLanguage: 'hi',

    // Official APIs (free, no key needed except API Setu)
    apis: [
      {
        name: 'myScheme API',
        url: 'https://api.myscheme.gov.in/search/v4/schemes',
        type: 'api',
        requiresKey: false,
        notes: 'Best source. 1000+ schemes. Register at apisetu.gov.in',
      },
      {
        name: 'data.gov.in',
        url: 'https://data.gov.in/api/datastore/resource.json',
        type: 'api',
        requiresKey: true,
        keyEnvVar: 'DATAGOV_IN_KEY',
        notes: 'Free key at data.gov.in/user/register',
      },
    ],

    // RSS feeds for new scheme announcements
    rssFeeds: [
      'https://pib.gov.in/RssMain.aspx',
      'https://www.pmindia.gov.in/en/feed/',
      'https://news.google.com/rss/search?q=government+scheme+india+2025&hl=en-IN&gl=IN&ceid=IN:en',
      'https://news.google.com/rss/search?q=new+yojana+india+2025&hl=en-IN&gl=IN&ceid=IN:en',
    ],

    // Government sites to scrape when API fails
    scrapingTargets: [
      { url: 'https://www.myscheme.gov.in/schemes', name: 'myScheme Portal' },
      { url: 'https://india.gov.in/spotlight', name: 'India.gov.in' },
      { url: 'https://vikaspedia.in/social-welfare', name: 'Vikaspedia Welfare' },
      { url: 'https://www.india.gov.in/my-government/schemes-in-focus', name: 'Schemes in Focus' },
    ],

    subreddits: ['india', 'IndiaSpeaks', 'LegalAdviceIndia', 'IndianStockMarket'],
    telegramChannels: ['@indiangovernmentschemes'],

    incomeRanges: [
      { label: 'Below ₹1 lakh/year', value: 100000 },
      { label: '₹1–2.5 lakh/year', value: 250000 },
      { label: '₹2.5–5 lakh/year', value: 500000 },
      { label: '₹5–10 lakh/year', value: 1000000 },
      { label: 'Above ₹10 lakh/year', value: 9999999 },
    ],

    states: [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Delhi', 'Jammu & Kashmir', 'Ladakh',
    ],

    categories: ['cash', 'housing', 'health', 'education', 'agriculture', 'women', 'elderly', 'disability', 'business'],
  },

  // ── UNITED KINGDOM ───────────────────────────────────
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    currencySymbol: '£',
    languages: ['en'],
    defaultLanguage: 'en',

    apis: [
      {
        name: 'GOV.UK API',
        url: 'https://www.gov.uk/api/content/browse/benefits',
        type: 'api',
        requiresKey: false,
        notes: 'Free, no key needed. Official UK government API',
      },
      {
        name: 'GOV.UK Search',
        url: 'https://www.gov.uk/api/search.json?filter_format=guide&filter_part_of_taxonomy_tree=benefits',
        type: 'api',
        requiresKey: false,
        notes: 'Search all benefit guides',
      },
      {
        name: 'Entitledto API',
        url: 'https://www.entitledto.co.uk/api',
        type: 'api',
        requiresKey: true,
        keyEnvVar: 'ENTITLEDTO_KEY',
        notes: 'Benefits calculator API — contact them for key',
      },
    ],

    rssFeeds: [
      'https://www.gov.uk/search/news-and-communications.atom?keywords=benefits&organisations%5B%5D=department-for-work-pensions',
      'https://www.gov.uk/search/news-and-communications.atom?keywords=new+scheme',
      'https://news.google.com/rss/search?q=UK+government+benefits+scheme+2025&hl=en-GB&gl=GB&ceid=GB:en',
    ],

    scrapingTargets: [
      { url: 'https://www.gov.uk/browse/benefits', name: 'GOV.UK Benefits' },
      { url: 'https://www.gov.uk/browse/housing-local-services/local-councils', name: 'Council Support' },
      { url: 'https://www.turn2us.org.uk/Benefit-guides', name: 'Turn2Us Benefits' },
      { url: 'https://www.entitledto.co.uk/help/benefits-list', name: 'Entitledto' },
    ],

    subreddits: ['unitedkingdom', 'UKPersonalFinance', 'DWPhelp', 'AskUK', 'LegalAdviceUK'],

    incomeRanges: [
      { label: 'Below £10,000/year', value: 10000 },
      { label: '£10,000–£20,000/year', value: 20000 },
      { label: '£20,000–£35,000/year', value: 35000 },
      { label: '£35,000–£50,000/year', value: 50000 },
      { label: 'Above £50,000/year', value: 9999999 },
    ],

    states: ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    categories: ['cash', 'housing', 'health', 'education', 'disability', 'elderly', 'family', 'employment'],
  },

  // ── UNITED STATES ────────────────────────────────────
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    languages: ['en', 'es'],
    defaultLanguage: 'en',

    apis: [
      {
        name: 'USA.gov API',
        url: 'https://search.usa.gov/api/v2/search',
        type: 'api',
        requiresKey: true,
        keyEnvVar: 'USAGOV_API_KEY',
        notes: 'Free key at search.usa.gov/developer',
      },
      {
        name: 'Benefits.gov API',
        url: 'https://www.benefits.gov/api/benefits',
        type: 'api',
        requiresKey: false,
        notes: '1000+ federal benefit programs. No key needed',
      },
      {
        name: 'Federal Register API',
        url: 'https://www.federalregister.gov/api/v1/articles.json',
        type: 'api',
        requiresKey: false,
        notes: 'New program announcements. Free, no key',
      },
      {
        name: 'HUD API',
        url: 'https://hudgis-hud.opendata.arcgis.com/api',
        type: 'api',
        requiresKey: false,
        notes: 'Housing assistance programs',
      },
    ],

    rssFeeds: [
      'https://www.federalregister.gov/api/v1/articles.rss?conditions[type][]=RULE&conditions[agencies][]=department-of-health-and-human-services',
      'https://www.usa.gov/rss/updates.xml',
      'https://news.google.com/rss/search?q=USA+federal+assistance+program+2025&hl=en-US&gl=US&ceid=US:en',
      'https://news.google.com/rss/search?q=government+benefits+eligibility+USA+2025&hl=en-US&gl=US',
    ],

    scrapingTargets: [
      { url: 'https://www.benefits.gov/benefits/browse-by-category', name: 'Benefits.gov' },
      { url: 'https://www.usa.gov/benefit-finder', name: 'USA.gov Benefit Finder' },
      { url: 'https://www.needhelppayingbills.com/html/government_assistance_programs.html', name: 'Assistance Programs' },
    ],

    subreddits: ['povertyfinance', 'Assistance', 'Medicaid', 'foodstamps', 'SocialSecurity', 'financialindependence'],

    incomeRanges: [
      { label: 'Below $15,000/year', value: 15000 },
      { label: '$15,000–$30,000/year', value: 30000 },
      { label: '$30,000–$50,000/year', value: 50000 },
      { label: '$50,000–$80,000/year', value: 80000 },
      { label: 'Above $80,000/year', value: 9999999 },
    ],

    states: [
      'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
      'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
      'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
      'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada',
      'New Hampshire','New Jersey','New Mexico','New York','North Carolina',
      'North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
      'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
      'Virginia','Washington','West Virginia','Wisconsin','Wyoming','DC',
    ],

    categories: ['cash', 'food', 'housing', 'health', 'education', 'disability', 'elderly', 'employment', 'family'],
  },

  // ── NIGERIA ──────────────────────────────────────────
  NG: {
    code: 'NG',
    name: 'Nigeria',
    flag: '🇳🇬',
    currency: 'NGN',
    currencySymbol: '₦',
    languages: ['en', 'yo', 'ha', 'ig'],
    defaultLanguage: 'en',

    // Nigeria has NO official API — use scraping + Google News
    apis: [
      {
        name: 'Nigeria Open Data',
        url: 'https://opendata.nigerianstat.gov.ng/api',
        type: 'api',
        requiresKey: false,
        notes: 'Limited data. Use scraping as primary source',
      },
    ],

    rssFeeds: [
      'https://news.google.com/rss/search?q=Nigeria+government+welfare+scheme+benefit+2025&hl=en-NG&gl=NG&ceid=NG:en',
      'https://news.google.com/rss/search?q=Nigeria+NASIMS+social+investment+2025&hl=en-NG&gl=NG',
      'https://news.google.com/rss/search?q=Nigeria+federal+government+palliative+2025&hl=en-NG&gl=NG',
    ],

    // Nigeria: primary source is scraping government websites
    scrapingTargets: [
      { url: 'https://www.nasims.gov.ng', name: 'NASIMS (Social Investment)' },
      { url: 'https://nsip.gov.ng', name: 'National Social Investment Programme' },
      { url: 'https://www.fg.gov.ng/programmes', name: 'Federal Government Programmes' },
      { url: 'https://npc.gov.ng/nigerias-development-plan', name: 'National Planning Commission' },
      { url: 'https://npower.gov.ng', name: 'N-Power Youth Programme' },
      { url: 'https://tradermoni.gov.ng', name: 'TraderMoni' },
    ],

    subreddits: ['Nigeria', 'lagos', 'naija', 'NigeriaTwitter'],

    incomeRanges: [
      { label: 'Below ₦500,000/year', value: 500000 },
      { label: '₦500k–₦1.5M/year', value: 1500000 },
      { label: '₦1.5M–₦5M/year', value: 5000000 },
      { label: 'Above ₦5M/year', value: 9999999 },
    ],

    states: [
      'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
      'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
      'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
      'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
      'Yobe','Zamfara',
    ],

    categories: ['cash', 'food', 'agriculture', 'business', 'employment', 'education', 'health', 'women'],
  },

  // ── KENYA ────────────────────────────────────────────
  KE: {
    code: 'KE',
    name: 'Kenya',
    flag: '🇰🇪',
    currency: 'KES',
    currencySymbol: 'KSh',
    languages: ['en', 'sw'],
    defaultLanguage: 'sw',

    apis: [
      {
        name: 'Kenya Open Data',
        url: 'https://opendata.go.ke/api/views',
        type: 'api',
        requiresKey: false,
        notes: 'Government datasets. Free, no key needed',
      },
      {
        name: 'Kenya National Bureau of Statistics',
        url: 'https://www.knbs.or.ke/api',
        type: 'api',
        requiresKey: false,
        notes: 'Statistical data and social programs',
      },
    ],

    rssFeeds: [
      'https://news.google.com/rss/search?q=Kenya+government+welfare+scheme+2025&hl=en-KE&gl=KE&ceid=KE:en',
      'https://news.google.com/rss/search?q=Kenya+Huduma+social+protection+2025&hl=en-KE&gl=KE',
      'https://news.google.com/rss/search?q=Kenya+Inua+Jamii+cash+transfer+2025&hl=en-KE&gl=KE',
    ],

    scrapingTargets: [
      { url: 'https://www.socialprotection.go.ke', name: 'Social Protection Kenya' },
      { url: 'https://hudumacentre.go.ke', name: 'Huduma Centre' },
      { url: 'https://www.agriculture.go.ke/subsidies', name: 'Agriculture Subsidies' },
      { url: 'https://www.helb.co.ke', name: 'Higher Education Loans Board' },
      { url: 'https://www.nssf.or.ke', name: 'National Social Security Fund' },
    ],

    subreddits: ['Kenya', 'nairobi', 'kenyanews'],

    incomeRanges: [
      { label: 'Below KSh 100,000/year', value: 100000 },
      { label: 'KSh 100k–300k/year', value: 300000 },
      { label: 'KSh 300k–600k/year', value: 600000 },
      { label: 'KSh 600k–1.2M/year', value: 1200000 },
      { label: 'Above KSh 1.2M/year', value: 9999999 },
    ],

    states: [
      'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Nyeri','Meru','Kakamega',
      'Kisii','Thika','Kilifi','Machakos','Garissa','Kitale','Malindi',
      'Bungoma','Embu','Migori','Homabay','Bomet','Kericho','Uasin Gishu',
      'Trans Nzoia','Baringo','Laikipia','Nyandarua','Kirinyaga','Murang\'a',
      'Kiambu','Kajiado','Narok','Kwale','Taita Taveta','Tana River','Lamu',
      'Mandera','Wajir','Marsabit','Isiolo','Tharaka-Nithi','Mbeere',
      'Tana River','West Pokot','Samburu','Turkana',
    ],

    categories: ['cash', 'agriculture', 'health', 'education', 'housing', 'elderly', 'disability', 'women'],
  },
};

// ── LANGUAGE NAMES ────────────────────────────────────
export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
  ta: 'தமிழ்',
  kn: 'ಕನ್ನಡ',
  mr: 'मराठी',
  es: 'Español',
  yo: 'Yoruba',
  ha: 'Hausa',
  ig: 'Igbo',
  sw: 'Kiswahili',
};

// ── CATEGORY CONFIG ────────────────────────────────────
export const CATEGORIES: Record<string, { icon: string; color: string; bgColor: string }> = {
  cash:        { icon: '💰', color: 'text-green-800',  bgColor: 'bg-green-100' },
  housing:     { icon: '🏠', color: 'text-blue-800',   bgColor: 'bg-blue-100' },
  health:      { icon: '❤️', color: 'text-red-800',    bgColor: 'bg-red-100' },
  education:   { icon: '🎓', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  agriculture: { icon: '🌾', color: 'text-lime-800',   bgColor: 'bg-lime-100' },
  women:       { icon: '👩', color: 'text-pink-800',   bgColor: 'bg-pink-100' },
  elderly:     { icon: '👴', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  disability:  { icon: '♿', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  business:    { icon: '💼', color: 'text-cyan-800',   bgColor: 'bg-cyan-100' },
  food:        { icon: '🍱', color: 'text-amber-800',  bgColor: 'bg-amber-100' },
  employment:  { icon: '💼', color: 'text-indigo-800', bgColor: 'bg-indigo-100' },
  family:      { icon: '👨‍👩‍👧', color: 'text-rose-800',   bgColor: 'bg-rose-100' },
};

export const PROFESSIONS = [
  'Farmer / Agricultural Worker',
  'Government Employee',
  'Private Sector Employee',
  'Self-employed / Business Owner',
  'Daily Wage Worker',
  'Student',
  'Unemployed / Job Seeker',
  'Homemaker',
  'Retired',
  'Disabled / Unable to Work',
  'Fisherman',
  'Artisan / Craftsperson',
  'Other',
];

export type CountryConfig = {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  languages: string[];
  defaultLanguage: string;
  apis: ApiSource[];
  rssFeeds: string[];
  scrapingTargets: ScrapingTarget[];
  subreddits: string[];
  telegramChannels?: string[];
  incomeRanges: { label: string; value: number }[];
  states: string[];
  categories: string[];
};

export type ApiSource = {
  name: string;
  url: string;
  type: 'api' | 'rss' | 'scrape';
  requiresKey: boolean;
  keyEnvVar?: string;
  notes?: string;
};

export type ScrapingTarget = {
  url: string;
  name: string;
};

export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}
