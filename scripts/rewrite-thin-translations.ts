import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || (!OPENAI_API_KEY && !GROQ_API_KEY)) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const groqClient = GROQ_API_KEY ? new OpenAI({
  apiKey: GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
}) : null;

const openaiClient = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY
}) : null;

async function callLLM(prompt: string, system: string) {
  // 1. Try Groq First
  if (groqClient) {
    try {
      const response = await groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.35,
      });
      const content = response.choices?.[0]?.message?.content || '';
      if (content.length > 200) return content;
    } catch (err: any) {
      console.warn(`     ⚠️ Groq failed or rate limited: ${err.message}. Falling back to OpenAI...`);
    }
  }

  // 2. Try OpenAI Fallback
  if (openaiClient) {
    try {
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        max_tokens: 2500,
        temperature: 0.35,
      });
      const content = response.choices?.[0]?.message?.content || '';
      if (content.length > 200) return content;
    } catch (err: any) {
      console.error(`     ⚠️ OpenAI failed: ${err.message}`);
    }
  }

  throw new Error('All AI models failed or rate limits exceeded');
}

// Maps state codes to languages (copied from generate-content.js)
const STATE_LANGUAGE_MAP: Record<string, string> = {
  'TS': 'te', 'AP': 'te', 'KA': 'kn', 'TN': 'ta', 'KL': 'ml',
  'MH': 'mr', 'WB': 'bn', 'GJ': 'gu', 'PB': 'pa', 'OD': 'or', 'OR': 'or',
  'AS': 'as', 'RJ': 'hi', 'UP': 'hi', 'MP': 'hi', 'CG': 'hi', 'JH': 'hi',
  'BR': 'hi', 'HP': 'hi', 'UK': 'hi', 'HR': 'hi', 'DL': 'hi',
};

const LANGUAGE_NAMES: Record<string, string> = {
  'te': 'Telugu', 'kn': 'Kannada', 'ta': 'Tamil', 'ml': 'Malayalam',
  'mr': 'Marathi', 'bn': 'Bengali', 'gu': 'Gujarati', 'pa': 'Punjabi',
  'or': 'Odia', 'as': 'Assamese', 'hi': 'Hindi',
  'sw': 'Swahili', 'yo': 'Yoruba', 'ha': 'Hausa', 'es': 'Spanish',
};

const SOUTH_INDIAN_STATES = ['AP', 'TS', 'KA', 'TN', 'KL'];

function getRequiredLanguages(scheme: any) {
  const req = new Set<string>();
  const isTripleTranslate = scheme.is_central === true || scheme.state_code === 'IN';
  
  // Extract state code (e.g., 'IN-AP' -> 'AP')
  const sCode = (scheme.state_code || '').replace('IN-', '');
  
  if (scheme.country_code === 'IN') {
    if (isTripleTranslate) {
      req.add('hi');
      req.add('te'); // Central schemes get Hindi + Telugu
    } else {
      if (SOUTH_INDIAN_STATES.includes(sCode)) {
        // South India: English (default) + Local Language only
        req.add(STATE_LANGUAGE_MAP[sCode] || 'te');
      } else {
        // Other States: English (default) + Hindi + Local Language
        req.add('hi');
        const local = STATE_LANGUAGE_MAP[sCode];
        if (local && local !== 'hi') {
          req.add(local);
        }
      }
    }
  } else if (scheme.country_code === 'US') req.add('es');
  else if (scheme.country_code === 'NG') req.add('yo');
  else if (scheme.country_code === 'KE') req.add('sw');
  
  return Array.from(req).filter(l => l !== 'en');
}

async function main() {
  console.log('🚀 Thin Content Rewrite Job (Translations)');
  
  // Get all published schemes via pagination and filter thin translations in JS
  let allSchemes: any[] = [];
  let hasMore = true;
  let page = 0;
  const PAGE_SIZE = 1000;

  while (hasMore) {
    const { data: batch, error: countError } = await supabase
      .from('schemes')
      .select('*')
      .eq('is_published', true)
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (countError) {
      console.error('❌ Fetch error:', countError.message);
      process.exit(1);
    }
    
    if (batch && batch.length > 0) {
      allSchemes = allSchemes.concat(batch);
      page++;
    } else {
      hasMore = false;
    }
  }

  const thinTranslationSchemes = allSchemes.filter(s => {
    const enWords = (s.content_en || '').split(/\s+/).length;
    if (enWords < 600) return false; // English must be good first

    const reqLangs = getRequiredLanguages(s);
    if (reqLangs.length === 0) return false;

    return reqLangs.some(lang => {
      const isHi = lang === 'hi';
      const currentContent = isHi ? s.content_hi : s.content_local;
      const wordCount = (currentContent || '').split(/\s+/).length;
      return wordCount < 600;
    });
  });

  if (thinTranslationSchemes.length === 0) {
    console.log('✅ All translations are > 600 words. Nothing to do!');
    process.exit(0);
  }

  const schemes = thinTranslationSchemes.slice(0, 15);

  console.log(`📋 Processing ${schemes.length} schemes this run.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const scheme of schemes) {
    console.log(`📝 Translating: ${scheme.name}`);
    const langs = getRequiredLanguages(scheme);
    let updated = false;
    let newHi = scheme.content_hi;
    let newLocal = scheme.content_local;

    for (const lang of langs) {
      const isHi = lang === 'hi';
      const currentContent = isHi ? scheme.content_hi : scheme.content_local;
      const wordCount = (currentContent || '').split(/\s+/).length;
      const langName = LANGUAGE_NAMES[lang];

      if (wordCount < 600) {
        console.log(`   ⏳ Translating to ${langName} (current word count: ${wordCount})...`);
        
        const systemPrompt = `You are a professional translator for ${langName}. Translate the provided JSON content accurately while maintaining the JSON structure.

CRITICAL LENGTH REQUIREMENT: The translated content MUST be extremely detailed and long (between 600 and 1200 words). Expand on concepts naturally in ${langName} to ensure the content is highly comprehensive.

REQUIREMENTS:
- Return ONLY valid JSON format matching the exact structure provided. No markdown \`\`\`json.
- Do NOT translate the JSON keys (keep them exactly as they are). Only translate the values.
- Do NOT change slugs or URLs.
- Only translate user-facing text (title, intro, headings, content, faqs).
- Maintain a helpful, highly conversational, everyday spoken tone in ${langName}. Do not use overly formal vocabulary. Use relevant emojis.`;

        const userPrompt = scheme.content_en;

        try {
          const result = await callLLM(userPrompt, systemPrompt);
          const cleaned = result.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
          const sanitized = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
          JSON.parse(sanitized); // Ensure it parses
          
          if (isHi) newHi = sanitized;
          else newLocal = sanitized;
          
          updated = true;
          console.log(`   ✅ Successfully translated to ${langName}.`);
        } catch (err: any) {
          console.error(`   ❌ Failed to translate ${langName}:`, err.message);
        }
      }
    }

    if (updated) {
      const { error: upErr } = await supabase
        .from('schemes')
        .update({
          content_hi: newHi,
          content_local: newLocal,
          local_language: langs.find(l => l !== 'hi') || scheme.local_language,
          is_translated: true,
          last_updated: new Date().toISOString()
        })
        .eq('id', scheme.id);
        
      if (upErr) failCount++;
      else successCount++;
    } else {
      failCount++;
    }
  }

  // Log to pipeline_logs
  await supabase.from('pipeline_logs').insert({
    job_name: 'rewrite-thin-translations',
    items_processed: schemes.length,
    items_succeeded: successCount,
    items_failed: failCount
  });

  console.log(`\n🏁 Run complete! Success: ${successCount} | Failed: ${failCount} | Remaining: ${Math.max(0, thinTranslationSchemes.length - successCount)}`);
}

main().catch(console.error);
