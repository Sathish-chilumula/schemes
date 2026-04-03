import { COUNTRIES } from './config';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

export function getIndianStateBySlug(slug: string) {
  const india = COUNTRIES.IN;
  return india.states.find(s => slugify(s.name) === slug);
}

export function getCategoryBySlug(slug: string) {
  const india = COUNTRIES.IN;
  return india.categories.find(c => slugify(c) === slug);
}

export function getCanonicalCategory(rawCategory: string | null): string {
  if (!rawCategory) return 'others';
  const cat = rawCategory.toLowerCase().trim();
  
  // Controlled Taxonomy Mapping
  if (cat.includes('farmer') || cat.includes('agri')) return 'agriculture';
  if (cat.includes('student') || cat.includes('educ') || cat.includes('scholar')) return 'education';
  if (cat.includes('medical') || cat.includes('health') || cat.includes('hosp')) return 'health';
  if (cat.includes('house') || cat.includes('awas')) return 'housing';
  if (cat.includes('woman') || cat.includes('women') || cat.includes('girl')) return 'women';
  if (cat.includes('old') || cat.includes('elder') || cat.includes('pension')) return 'elderly';
  if (cat.includes('disab') || cat.includes('handicap')) return 'disability';
  if (cat.includes('busine') || cat.includes('entre')) return 'business';
  if (cat.includes('cash') || cat.includes('money') || cat.includes('finan')) return 'cash';
  
  return 'others';
}
