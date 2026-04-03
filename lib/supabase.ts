import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'placeholder-service-key'
  );
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
