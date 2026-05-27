// ═══════════════════════════════════════════════════════
// SCHEMEATLAS — GLOBAL COUNTRY CONFIGURATION
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

    apis: [
      { name: 'myScheme API', url: 'https://api.myscheme.gov.in/search/v4/schemes', type: 'api', requiresKey: false },
    ],
    rssFeeds: [
      'https://pib.gov.in/RssMain.aspx',
    ],
    scrapingTargets: [],
    subreddits: [],
    
    incomeRanges: [
      { label: 'Below ₹1 lakh/year', value: 100000 },
      { label: '₹1–2.5 lakh/year', value: 250000 },
      { label: '₹2.5–5 lakh/year', value: 500000 },
      { label: '₹5–10 lakh/year', value: 1000000 },
      { label: 'Above ₹10 lakh/year', value: 9999999 },
    ],

    states: [
      { code: 'AP', name: 'Andhra Pradesh', icon: '🏛️', language: 'te' },
      { code: 'AR', name: 'Arunachal Pradesh', icon: '⛰️', language: 'en' },
      { code: 'AS', name: 'Assam', icon: '🫖', language: 'as' },
      { code: 'BR', name: 'Bihar', icon: '🛕', language: 'hi' },
      { code: 'CG', name: 'Chhattisgarh', icon: '🌾', language: 'hi' },
      { code: 'GA', name: 'Goa', icon: '🏖️', language: 'en' }, // konkani fallback
      { code: 'GJ', name: 'Gujarat', icon: '🦁', language: 'gu' },
      { code: 'HR', name: 'Haryana', icon: '🚜', language: 'hi' },
      { code: 'HP', name: 'Himachal Pradesh', icon: '🏔️', language: 'hi' },
      { code: 'JH', name: 'Jharkhand', icon: '🌳', language: 'hi' },
      { code: 'KA', name: 'Karnataka', icon: '💻', language: 'kn' },
      { code: 'KL', name: 'Kerala', icon: '🌴', language: 'ml' },
      { code: 'MP', name: 'Madhya Pradesh', icon: '🐅', language: 'hi' },
      { code: 'MH', name: 'Maharashtra', icon: '🏙️', language: 'mr' },
      { code: 'MN', name: 'Manipur', icon: '🌸', language: 'en' },
      { code: 'ML', name: 'Meghalaya', icon: '☁️', language: 'en' },
      { code: 'MZ', name: 'Mizoram', icon: '⛰️', language: 'en' },
      { code: 'NL', name: 'Nagaland', icon: '🦅', language: 'en' },
      { code: 'OR', name: 'Odisha', icon: '🌊', language: 'or' },
      { code: 'PB', name: 'Punjab', icon: '🌾', language: 'pa' },
      { code: 'RJ', name: 'Rajasthan', icon: '🐪', language: 'hi' },
      { code: 'SK', name: 'Sikkim', icon: '🏔️', language: 'en' },
      { code: 'TN', name: 'Tamil Nadu', icon: '🛕', language: 'ta' },
      { code: 'TS', name: 'Telangana', icon: '🏛️', language: 'te' },
      { code: 'TR', name: 'Tripura', icon: '🌿', language: 'bn' },
      { code: 'UP', name: 'Uttar Pradesh', icon: '🕌', language: 'hi' },
      { code: 'UK', name: 'Uttarakhand', icon: '🏔️', language: 'hi' },
      { code: 'WB', name: 'West Bengal', icon: '🐅', language: 'bn' },
      { code: 'AN', name: 'Andaman and Nicobar Islands', icon: '🏝️', language: 'en' },
      { code: 'CH', name: 'Chandigarh', icon: '🏙️', language: 'pa' },
      { code: 'DN', name: 'Dadra and Nagar Haveli and Daman and Diu', icon: '🏖️', language: 'gu' },
      { code: 'DL', name: 'Delhi', icon: '🚇', language: 'hi' },
      { code: 'JK', name: 'Jammu & Kashmir', icon: '🏔️', language: 'en' },
      { code: 'LA', name: 'Ladakh', icon: '🏔️', language: 'en' },
      { code: 'LD', name: 'Lakshadweep', icon: '🏝️', language: 'ml' },
      { code: 'PY', name: 'Puducherry', icon: '🏖️', language: 'ta' },
    ],

    targetGroups: ['SC', 'ST', 'OBC', 'BC', 'Minority', 'General', 'EWS', 'Women', 'BPL'],
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
    apis: [], rssFeeds: [], scrapingTargets: [], subreddits: [],
    incomeRanges: [
      { label: 'Below £10,000/year', value: 10000 },
      { label: '£10,000–£20,000/year', value: 20000 },
      { label: '£20,000–£35,000/year', value: 35000 },
      { label: '£35,000–£50,000/year', value: 50000 },
      { label: 'Above £50,000/year', value: 9999999 },
    ],
    states: [
      { code: 'ENG', name: 'England' }, { code: 'SCT', name: 'Scotland' }, { code: 'WAL', name: 'Wales' }, { code: 'NIR', name: 'Northern Ireland' }
    ],
    targetGroups: ['Low Income', 'Disabled', 'Elderly', 'Students'],
    categories: ['cash', 'housing', 'health', 'education', 'disability', 'elderly', 'family', 'employment'],
  },

  // ── UNITED STATES ────────────────────────────────────
  US: {
    code: 'US', name: 'United States', flag: '🇺🇸',
    currency: 'USD', currencySymbol: '$',
    languages: ['en', 'es'], defaultLanguage: 'en',
    apis: [{ name: 'Benefits.gov', url: 'https://www.benefits.gov', type: 'web', requiresKey: false }],
    rssFeeds: ['https://www.usa.gov/rss/updates.xml'],
    scrapingTargets: [], subreddits: ['r/povertyfinance', 'r/veterans'],
    incomeRanges: [
      { label: 'Below $15,000/year (100% FPL)', value: 15000 },
      { label: '$15,000–$30,000/year', value: 30000 },
      { label: '$30,000–$50,000/year', value: 50000 },
      { label: '$50,000–$80,000/year', value: 80000 },
      { label: 'Above $80,000/year', value: 9999999 },
    ],
    states: [
      { code: 'CA', name: 'California', icon: '🌴' }, { code: 'TX', name: 'Texas', icon: '⭐' },
      { code: 'NY', name: 'New York', icon: '🗽' }, { code: 'FL', name: 'Florida', icon: '🌊' },
      { code: 'IL', name: 'Illinois', icon: '🏙️' }, { code: 'PA', name: 'Pennsylvania', icon: '🔔' },
      { code: 'OH', name: 'Ohio', icon: '🌻' }, { code: 'GA', name: 'Georgia', icon: '🍑' },
      { code: 'MI', name: 'Michigan', icon: '🚗' }, { code: 'AZ', name: 'Arizona', icon: '🌵' },
      { code: 'NC', name: 'North Carolina', icon: '🌲' }, { code: 'WA', name: 'Washington', icon: '☕' },
      { code: 'CO', name: 'Colorado', icon: '🏔️' }, { code: 'TN', name: 'Tennessee', icon: '🎸' },
      { code: 'NJ', name: 'New Jersey', icon: '🏖️' }, { code: 'VA', name: 'Virginia', icon: '🏗️' },
      { code: 'MN', name: 'Minnesota', icon: '🌨️' }, { code: 'WI', name: 'Wisconsin', icon: '🧀' },
      { code: 'MA', name: 'Massachusetts', icon: '🦞' }, { code: 'MD', name: 'Maryland', icon: '🦀' },
      { code: 'IN_S', name: 'Indiana', icon: '🏎️' }, { code: 'MO', name: 'Missouri', icon: '⚽' },
      { code: 'SC', name: 'South Carolina', icon: '🌴' }, { code: 'OR_S', name: 'Oregon', icon: '🌲' },
      { code: 'OK', name: 'Oklahoma', icon: '🌪️' }, { code: 'KY', name: 'Kentucky', icon: '🏇' },
      { code: 'CT', name: 'Connecticut', icon: '🎭' }, { code: 'UT', name: 'Utah', icon: '🏕️' },
      { code: 'NV', name: 'Nevada', icon: '🎰' }, { code: 'AR_S', name: 'Arkansas', icon: '💎' },
      { code: 'MS', name: 'Mississippi', icon: '🌊' }, { code: 'KS', name: 'Kansas', icon: '🌾' },
      { code: 'NM', name: 'New Mexico', icon: '🌶️' }, { code: 'NE', name: 'Nebraska', icon: '🌽' },
      { code: 'WV', name: 'West Virginia', icon: '⛰️' }, { code: 'ID', name: 'Idaho', icon: '🥔' },
      { code: 'HI', name: 'Hawaii', icon: '🌺' }, { code: 'NH', name: 'New Hampshire', icon: '🍂' },
      { code: 'ME', name: 'Maine', icon: '🦞' }, { code: 'MT', name: 'Montana', icon: '🦨' },
      { code: 'DE', name: 'Delaware', icon: '🏗️' }, { code: 'SD', name: 'South Dakota', icon: '🦥' },
      { code: 'ND', name: 'North Dakota', icon: '🌾' }, { code: 'AK', name: 'Alaska', icon: '🐻' },
      { code: 'VT', name: 'Vermont', icon: '🍁' }, { code: 'WY', name: 'Wyoming', icon: '🦅' },
      { code: 'DC', name: 'Washington D.C.', icon: '🏗️' },
    ],
    targetGroups: ['Low Income', 'Veterans', 'Disabled', 'Seniors', 'Students', 'Families', 'Unemployed'],
    categories: ['cash', 'food', 'housing', 'health', 'education', 'disability', 'elderly', 'employment', 'family', 'business'],
  },

  // ── CANADA ────────────────────────────────────────────────
  CA: {
    code: 'CA', name: 'Canada', flag: '🇨🇦',
    currency: 'CAD', currencySymbol: 'CA$',
    languages: ['en', 'fr'], defaultLanguage: 'en',
    apis: [], rssFeeds: ['https://www.canada.ca/en/news/rss.xml'],
    scrapingTargets: [], subreddits: ['r/PersonalFinanceCanada'],
    incomeRanges: [
      { label: 'Below CA$20,000/year', value: 20000 },
      { label: 'CA$20,000–CA$40,000/year', value: 40000 },
      { label: 'CA$40,000–CA$70,000/year', value: 70000 },
      { label: 'Above CA$100,000/year', value: 9999999 },
    ],
    states: [
      { code: 'ON', name: 'Ontario', icon: '🏙️' },
      { code: 'BC', name: 'British Columbia', icon: '🌲' },
      { code: 'QC', name: 'Quebec', icon: '⚜️' },
      { code: 'AB', name: 'Alberta', icon: '🏔️' },
      { code: 'MB', name: 'Manitoba', icon: '🌾' },
      { code: 'NS', name: 'Nova Scotia', icon: '🦞' },
      { code: 'SK', name: 'Saskatchewan', icon: '🌻' },
      { code: 'NB', name: 'New Brunswick', icon: '🌊' },
      { code: 'NL', name: 'Newfoundland and Labrador', icon: '🐟' },
      { code: 'PE', name: 'Prince Edward Island', icon: '🥔' },
      { code: 'NT', name: 'Northwest Territories', icon: '🌌' },
      { code: 'YT', name: 'Yukon', icon: '🐺' },
      { code: 'NU', name: 'Nunavut', icon: '🧧' },
    ],
    targetGroups: ['Low Income', 'Seniors', 'Disabled', 'Students', 'Families', 'Indigenous', 'Newcomers'],
    categories: ['cash', 'housing', 'health', 'education', 'disability', 'elderly', 'family', 'employment', 'business'],
  },

  // ── AUSTRALIA ──────────────────────────────────────────
  AU: {
    code: 'AU', name: 'Australia', flag: '🇦🇺',
    currency: 'AUD', currencySymbol: 'A$',
    languages: ['en'], defaultLanguage: 'en',
    apis: [], rssFeeds: ['https://www.australia.gov.au/rss.xml'],
    scrapingTargets: [], subreddits: ['r/AusFinance', 'r/Centrelink'],
    incomeRanges: [
      { label: 'Below A$20,000/year', value: 20000 },
      { label: 'A$20,000–A$40,000/year', value: 40000 },
      { label: 'A$40,000–A$80,000/year', value: 80000 },
      { label: 'Above A$120,000/year', value: 9999999 },
    ],
    states: [
      { code: 'NSW', name: 'New South Wales', icon: '🌉' },
      { code: 'VIC', name: 'Victoria', icon: '☕' },
      { code: 'QLD', name: 'Queensland', icon: '🌞' },
      { code: 'WA', name: 'Western Australia', icon: '🦘' },
      { code: 'SA', name: 'South Australia', icon: '🍷' },
      { code: 'TAS', name: 'Tasmania', icon: '🌿' },
      { code: 'ACT', name: 'Australian Capital Territory', icon: '🏗️' },
      { code: 'NT', name: 'Northern Territory', icon: '🪨' },
    ],
    targetGroups: ['Low Income', 'Seniors', 'Disabled', 'Students', 'Families', 'Indigenous', 'Job Seekers'],
    categories: ['cash', 'housing', 'health', 'education', 'disability', 'elderly', 'family', 'employment', 'business'],
  },

  // ── EUROPEAN UNION ───────────────────────────────────────
  EU: {
    code: 'EU', name: 'European Union', flag: '🇪🇺',
    currency: 'EUR', currencySymbol: '€',
    languages: ['en', 'fr', 'de', 'es', 'it'], defaultLanguage: 'en',
    apis: [], rssFeeds: [],
    scrapingTargets: [], subreddits: ['r/europe'],
    incomeRanges: [
      { label: 'Below €20,000/year', value: 20000 },
      { label: '€20,000–€40,000/year', value: 40000 },
      { label: 'Above €70,000/year', value: 9999999 },
    ],
    states: [
      { code: 'DE', name: 'Germany', icon: '🇩🇪' }, { code: 'FR', name: 'France', icon: '🇫🇷' },
      { code: 'IT', name: 'Italy', icon: '🇮🇹' }, { code: 'ES', name: 'Spain', icon: '🇪🇸' },
      { code: 'PL', name: 'Poland', icon: '🇵🇱' }, { code: 'NL', name: 'Netherlands', icon: '🇳🇱' },
      { code: 'BE', name: 'Belgium', icon: '🇧🇪' }, { code: 'SE', name: 'Sweden', icon: '🇸🇪' },
      { code: 'AT', name: 'Austria', icon: '🇦🇹' }, { code: 'PT', name: 'Portugal', icon: '🇵🇹' },
      { code: 'GR', name: 'Greece', icon: '🇬🇷' }, { code: 'CZ', name: 'Czech Republic', icon: '🇨🇿' },
      { code: 'RO', name: 'Romania', icon: '🇷🇴' }, { code: 'HU', name: 'Hungary', icon: '🇭🇺' },
      { code: 'DK', name: 'Denmark', icon: '🇩🇰' }, { code: 'FI', name: 'Finland', icon: '🇫🇮' },
      { code: 'IE', name: 'Ireland', icon: '🇮🇪' },
    ],
    targetGroups: ['Citizens', 'Businesses', 'Researchers', 'Students', 'Startups', 'NGOs', 'Farmers'],
    categories: ['research', 'education', 'agriculture', 'business', 'housing', 'employment', 'health'],
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
    apis: [], rssFeeds: [], scrapingTargets: [], subreddits: [],
    incomeRanges: [
      { label: 'Below ₦500k/year', value: 500000 },
      { label: '₦500k–₦1.5M/year', value: 1500000 },
      { label: 'Above ₦1.5M/year', value: 9999999 },
    ],
    states: [{ code: 'LAG', name: 'Lagos' }, { code: 'ABJ', name: 'Abuja' }, { code: 'KAN', name: 'Kano' }],
    targetGroups: ['Youth', 'Women', 'Farmers', 'Artisans'],
    categories: ['cash', 'business', 'employment', 'education', 'agriculture'],
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
    apis: [], rssFeeds: [], scrapingTargets: [], subreddits: [],
    incomeRanges: [
      { label: 'Below KSh 100k/year', value: 100000 },
      { label: 'KSh 100k–300k/year', value: 300000 },
      { label: 'Above KSh 300k/year', value: 9999999 },
    ],
    states: [{ code: 'NBO', name: 'Nairobi' }, { code: 'MBA', name: 'Mombasa' }],
    targetGroups: ['Youth', 'Women', 'Elderly', 'Disabled'],
    categories: ['agriculture', 'health', 'education', 'business'],
  },
};

// ── CATEGORY CONFIG ────────────────────────────────────
export const CATEGORIES: Record<string, { icon: string; color: string; bgColor: string; label?: string }> = {
  cash:        { icon: '💰', color: 'text-green-800',  bgColor: 'bg-green-100', label: 'Cash Aid' },
  housing:     { icon: '🏠', color: 'text-blue-800',   bgColor: 'bg-blue-100', label: 'Housing' },
  health:      { icon: '❤️', color: 'text-red-800',    bgColor: 'bg-red-100', label: 'Healthcare' },
  education:   { icon: '🎓', color: 'text-yellow-800', bgColor: 'bg-yellow-100', label: 'Education' },
  agriculture: { icon: '🌾', color: 'text-lime-800',   bgColor: 'bg-lime-100', label: 'Agriculture' },
  women:       { icon: '👩', color: 'text-pink-800',   bgColor: 'bg-pink-100', label: 'Women' },
  elderly:     { icon: '👴', color: 'text-purple-800', bgColor: 'bg-purple-100', label: 'Elderly' },
  disability:  { icon: '♿', color: 'text-orange-800', bgColor: 'bg-orange-100', label: 'Disability' },
  business:    { icon: '💼', color: 'text-cyan-800',   bgColor: 'bg-cyan-100', label: 'Business' },
  food:        { icon: '🍱', color: 'text-amber-800',  bgColor: 'bg-amber-100', label: 'Food & Nutrition' },
  employment:  { icon: '🎯', color: 'text-indigo-800', bgColor: 'bg-indigo-100', label: 'Employment' },
  family:      { icon: '👨‍👩‍👧', color: 'text-rose-800',   bgColor: 'bg-rose-100', label: 'Family' },
  research:    { icon: '🔬', color: 'text-violet-800', bgColor: 'bg-violet-100', label: 'Research & Innovation' },
  climate:     { icon: '🌱', color: 'text-teal-800',   bgColor: 'bg-teal-100', label: 'Climate & Energy' },
  job:         { icon: '🎯', color: 'text-blue-900',    bgColor: 'bg-blue-50',  label: 'Govt Job' },
  news:        { icon: '📰', color: 'text-slate-900',   bgColor: 'bg-slate-100', label: 'Civic News' },
  alert:       { icon: '🔔', color: 'text-red-900',     bgColor: 'bg-red-50',   label: 'Important Alert' },
  budget:      { icon: '📊', color: 'text-emerald-900', bgColor: 'bg-emerald-50', label: 'Budget/Finance' },
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
  scrapingTargets: any[];
  subreddits: string[];
  incomeRanges: { label: string; value: number }[];
  states: { code: string; name: string; icon?: string; language?: string }[];
  targetGroups: string[];
  categories: string[];
};

export type ApiSource = {
  name: string;
  url: string;
  type: string;
  requiresKey: boolean;
};

export function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

export const LANG_LABELS: Record<string, string> = {
  en: 'English', hi: 'हिंदी', te: 'తెలుగు', kn: 'ಕನ್ನಡ', ta: 'தமிழ்',
  ml: 'മലയാളം', mr: 'ಮರಾठी', bn: 'বাংলা', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ',
  or: 'ଓਡ଼ିଆ', as: 'অসমীয়া', sw: 'Kiswahili', yo: 'Yorùbá', es: 'Español',
};
