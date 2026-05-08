import { createClient, SupabaseClient } from '@supabase/supabase-js';

function formatUrl(url: string) {
  if (!url) return '';
  url = url.trim();
  if (url && !url.startsWith('http')) {
    url = `https://${url}`;
  }
  return url;
}

const DEFAULT_URL = 'https://missing-project-id.supabase.co';
const DEFAULT_KEY = 'missing-anon-key';

let _supabase: SupabaseClient | null = null;

/**
 * Gets a Supabase client. 
 * If environment variables are missing, returns a placeholder client 
 * that will log warnings instead of crashing during build/initialization.
 */
export function getSupabase() {
  if (!_supabase) {
    const url = formatUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
    const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

    if (!url || !key || url.includes('placeholder')) {
      if (typeof window === 'undefined') {
        console.warn('⚠️ [Supabase] NEXT_PUBLIC_SUPABASE_URL or ANON_KEY is missing. Using placeholder client.');
      }
      return createClient(DEFAULT_URL, DEFAULT_KEY);
    }
    
    _supabase = createClient(url, key, {
      auth: {
        persistSession: false,
      }
    });
  }
  return _supabase;
}

// Lazy-initialization Proxy to handle property access safely
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    return (client as any)[prop];
  },
});

/**
 * Gets a Supabase Admin client using the service role key.
 *
 * CACHING STRATEGY FOR CLOUDFLARE PAGES (Edge Runtime):
 * ─────────────────────────────────────────────────────
 * Next.js Data Cache (`next: { revalidate }`) does NOT work on Cloudflare
 * Workers edge runtime. Instead, we use the Cloudflare-native Web Cache API
 * to cache Supabase HTTP responses at the CDN level.
 *
 * This means:
 *   - First request for a scheme page: fetches from Supabase, caches response
 *   - Subsequent requests within TTL (1 hour): served from Cloudflare cache
 *   - Database connections used: 1 per hour per unique URL (not 1 per crawler hit)
 *   - This directly prevents the max_connections=60 exhaustion that causes 503s
 *
 * Pass `revalidate` (seconds) to set the CDN cache TTL:
 *   supabaseAdmin(3600)  → cache for 1 hour  (scheme detail / listing pages)
 *   supabaseAdmin(300)   → cache for 5 min   (sitemap)
 *   supabaseAdmin(0)     → no cache          (user-specific data)
 */
type NextFetchOptions =
  | { cache: RequestCache }
  | { next: { revalidate?: number | false; tags?: string[] } };

export function supabaseAdmin(fetchOptions?: NextFetchOptions) {
  const url = formatUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const serviceKey = (process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  
  if (!url || !serviceKey || url.includes('placeholder')) {
    if (typeof window === 'undefined') {
      console.warn('⚠️ [Supabase] Admin credentials missing. Using placeholder admin client.');
    }
    return createClient(DEFAULT_URL, DEFAULT_KEY);
  }

  // Build Cloudflare-compatible fetch options.
  // - `cf.cacheTtl`: tells Cloudflare's CDN to cache this response at the edge
  // - `cf.cacheEverything`: forces caching even for POST-like responses
  // - `cache: 'force-cache'`: standard HTTP cache hint as fallback
  const fetchWithCache = (req: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    let revalidateSeconds = 3600; // default 1 hour
    
    // Parse fetchOptions to find revalidate seconds
    if (fetchOptions) {
      if ('cache' in fetchOptions && fetchOptions.cache === 'no-store') {
        revalidateSeconds = 0;
      } else if ('next' in fetchOptions && typeof fetchOptions.next.revalidate === 'number') {
        revalidateSeconds = fetchOptions.next.revalidate;
      } else if ('next' in fetchOptions && fetchOptions.next.revalidate === false) {
        revalidateSeconds = 31536000; // 1 year
      }
    }

    if (revalidateSeconds <= 0) {
      // No caching for user-specific / real-time data
      return fetch(req, { ...init, ...fetchOptions } as RequestInit);
    }
    // Strip Next.js specific options that crash Cloudflare next-on-pages
    const safeInit = { ...init };
    delete (safeInit as any).cache;
    delete (safeInit as any).next;

    return fetch(req, {
      ...safeInit,
      // Cloudflare Workers Cache API directive
      cf: {
        cacheTtl: revalidateSeconds,
        cacheEverything: true,
      },
    } as RequestInit);
  };

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: fetchWithCache,
    },
  });
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
