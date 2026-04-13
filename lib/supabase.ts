import { createClient, SupabaseClient } from '@supabase/supabase-js';

function formatUrl(url: string) {
  if (!url) return '';
  url = url.trim();
  if (url && !url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url;
}

const supabaseUrl = formatUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

let _supabase: SupabaseClient | null = null;
export function getSupabase() {
  if (!_supabase) {
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Keep backward-compatible export (lazy)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});

export function supabaseAdmin() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const url = formatUrl(rawUrl);
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  
  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  return createClient(url, serviceKey);
}

export type Scheme = {
  id: string;
  country_code: string;
  name: string;
  slug: string;
  category: string;
  what_you_get: string;
  benefit_amount: string;
  eligibility: any;
  how_to_apply: any;
  documents: string[];
  official_url: string;
  image_url: string;
  image_keyword: string;
  is_published: boolean;
  discovered_at: string;
  target_group?: string[];
  state_codes?: string[];
  scheme_type?: string;
  views?: number;
  article_content?: string;
  state_code?: string;
  state_name?: string;
  local_language?: string;
  content_en?: string;
  content_hi?: string;
  content_local?: string;
  is_central?: boolean;
  last_updated?: string;
  ministry?: string;
};

export type UserProfile = {
  id: string;
  session_id: string;
  country_code: string;
  age: number;
  gender: string;
  profession: string;
  annual_income: number;
  state_region: string;
  family_size: number;
  language: string;
};
