import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getSystemPrompt, SCHEME_STRUCTURES, LOAN_STRUCTURES } from '../lib/content-prompts';

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
      return '';
    }
  }
}

function sanitizeJson(str: string): string {
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
}

async function main() {
  console.log('🚀 Thin Content Rewrite Job (English)');
  
  // 1. Get stats by fetching all published schemes via pagination
  let allSchemes: any[] = [];
  let hasMore = true;
  let page = 0;
  const PAGE_SIZE = 1000;

  while (hasMore) {
    const { data: batch, error: countError } = await supabase
      .from('schemes')
      .select('id, name, slug, content_en, country_code, category, what_you_get, benefit_amount, eligibility, how_to_apply, documents, official_url, scheme_type')
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

  const thinSchemes = allSchemes.filter(s => {
    const content = (s.content_en || '').trim();
    const words = content.split(/\s+/).length;
    
    // Broken format detection: not JSON and no markdown headers
    const isBroken = content.length > 0 && !content.startsWith('{') && !content.includes('**');
    
    return words < 600 || isBroken;
  });

  const pendingCount = thinSchemes.length;
  console.log(`📊 Pending thin articles: ${pendingCount}`);
  
  if (pendingCount === 0) {
    console.log('✅ All English articles are > 300 words. Nothing to do!');
    process.exit(0);
  }

  // 2. Fetch up to 20 thin articles
  const schemes = thinSchemes.slice(0, 20);
  console.log(`📋 Processing ${schemes.length} schemes this run.\n`);

  let successCount = 0;
  let failCount = 0;

  for (const scheme of schemes) {
    console.log(`📝 Rewriting: ${scheme.name} (${scheme.slug})`);
    
    const isLoan = scheme.scheme_type === 'loan' || (scheme.category || '').toLowerCase() === 'loans';
    const typeStr = isLoan ? 'loan' : 'scheme';

    let jsonResponse = '';
    let success = false;

    // 1. Try Groq First
    if (groqClient) {
      try {
        const response = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: getSystemPrompt(typeStr, 'detailed', scheme.country_code || 'IN') },
            { role: 'user', content: `Rewrite the content for: ${scheme.name}\n\nContext:\nWhat you get: ${scheme.what_you_get}\nBenefits: ${scheme.benefit_amount}\nEligibility: ${JSON.stringify(scheme.eligibility)}\nHow to apply: ${JSON.stringify(scheme.how_to_apply)}\nDocuments: ${JSON.stringify(scheme.documents)}\nURL: ${scheme.official_url}\nCategory: ${scheme.category}` }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });
        jsonResponse = response.choices[0]?.message?.content || '';
        success = true;
      } catch (err: any) {
        console.log(`     ⚠️ Groq failed or rate limited: ${err.message}. Falling back to OpenAI...`);
      }
    }

    // 2. Try OpenAI Fallback
    if (!success && openaiClient) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: getSystemPrompt(typeStr, 'detailed', scheme.country_code || 'IN') },
            { role: 'user', content: `Rewrite the content for: ${scheme.name}\n\nContext:\nWhat you get: ${scheme.what_you_get}\nBenefits: ${scheme.benefit_amount}\nEligibility: ${JSON.stringify(scheme.eligibility)}\nHow to apply: ${JSON.stringify(scheme.how_to_apply)}\nDocuments: ${JSON.stringify(scheme.documents)}\nURL: ${scheme.official_url}\nCategory: ${scheme.category}` }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        });
        jsonResponse = response.choices[0]?.message?.content || '';
        success = true;
      } catch (err: any) {
        console.log(`     ❌ OpenAI fallback failed: ${err.message}`);
      }
    }

    if (!success || !jsonResponse) {
      failCount++;
      continue;
    }

    try {
      const cleanedJson = sanitizeJson(jsonResponse);
      const parsed = JSON.parse(cleanedJson);
      
      const { error: updateError } = await supabase
        .from('schemes')
        .update({
          content_en: typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed),
          updated_at: new Date().toISOString()
        })
        .eq('id', scheme.id);
        
      if (updateError) throw updateError;
      console.log(`   ✅ Successfully rewritten.`);
      successCount++;
    } catch (err: any) {
      console.error(`   ❌ Failed:`, err.message);
      failCount++;
    }
  }

  // Log to pipeline_logs
  await supabase.from('pipeline_logs').insert({
    job_name: 'rewrite-thin-english',
    items_processed: schemes.length,
    items_succeeded: successCount,
    items_failed: failCount,
    details: { pending_after: pendingCount! - successCount }
  });

  console.log(`\n🏁 Run complete! Success: ${successCount} | Failed: ${failCount} | Remaining: ${Math.max(0, thinSchemes.length - successCount)}`);
}

main().catch(console.error);
