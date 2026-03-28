// ═══════════════════════════════════════════════════════
// CLAIMIT — COMPLETE COUNTRY CONFIGURATION
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
      { code: 'AP', name: 'Andhra Pradesh' },
      { code: 'AR', name: 'Arunachal Pradesh' },
      { code: 'AS', name: 'Assam' },
      { code: 'BR', name: 'Bihar' },
      { code: 'CG', name: 'Chhattisgarh' },
      { code: 'GA', name: 'Goa' },
      { code: 'GJ', name: 'Gujarat' },
      { code: 'HR', name: 'Haryana' },
      { code: 'HP', name: 'Himachal Pradesh' },
      { code: 'JH', name: 'Jharkhand' },
      { code: 'KA', name: 'Karnataka' },
      { code: 'KL', name: 'Kerala' },
      { code: 'MP', name: 'Madhya Pradesh' },
      { code: 'MH', name: 'Maharashtra' },
      { code: 'MN', name: 'Manipur' },
      { code: 'ML', name: 'Meghalaya' },
      { code: 'MZ', name: 'Mizoram' },
      { code: 'NL', name: 'Nagaland' },
      { code: 'OR', name: 'Odisha' },
      { code: 'PB', name: 'Punjab' },
      { code: 'RJ', name: 'Rajasthan' },
      { code: 'SK', name: 'Sikkim' },
      { code: 'TN', name: 'Tamil Nadu' },
      { code: 'TS', name: 'Telangana' },
      { code: 'TR', name: 'Tripura' },
      { code: 'UP', name: 'Uttar Pradesh' },
      { code: 'UK', name: 'Uttarakhand' },
      { code: 'WB', name: 'West Bengal' },
      { code: 'DL', name: 'Delhi' },
      { code: 'JK', name: 'Jammu & Kashmir' },
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
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    currencySymbol: '$',
    languages: ['en', 'es'],
    defaultLanguage: 'en',
    apis: [], rssFeeds: [], scrapingTargets: [], subreddits: [],
    incomeRanges: [
      { label: 'Below $15,000/year', value: 15000 },
      { label: '$15,000–$30,000/year', value: 30000 },
      { label: '$30,000–$50,000/year', value: 50000 },
      { label: 'Above $80,000/year', value: 9999999 },
    ],
    states: [
      { code: 'CA', name: 'California' }, { code: 'NY', name: 'New York' }, { code: 'TX', name: 'Texas' }, { code: 'FL', name: 'Florida'}
    ],
    targetGroups: ['Low Income', 'Veterans', 'Disabled', 'Seniors'],
    categories: ['cash', 'food', 'housing', 'health', 'education', 'disability', 'elderly'],
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
  food:        { icon: '🍱', color: 'text-amber-800',  bgColor: 'bg-amber-100', label: 'Food' },
  employment:  { icon: '💼', color: 'text-indigo-800', bgColor: 'bg-indigo-100', label: 'Employment' },
  family:      { icon: '👨‍👩‍👧', color: 'text-rose-800',   bgColor: 'bg-rose-100', label: 'Family' },
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
  states: { code: string; name: string }[];
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
