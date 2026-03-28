import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
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
