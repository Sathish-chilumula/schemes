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
    }
  }

  throw new Error('All AI models failed or rate limits exceeded');
}

async function main() {
  console.log('🚀 Thin Content Rewrite Job (English)');
  
  // 1. Get stats by fetching and filtering in JS (since word_count_en column does not exist)
  const { data: allSchemes, error: countError } = await supabase
    .from('schemes')
    .select('id, name, slug, content_en, country_code, category, what_you_get, benefit_amount, eligibility, how_to_apply, documents, official_url')
    .eq('is_published', true);

  if (countError) {
    console.error('❌ Fetch error:', countError.message);
    process.exit(1);
  }

  const thinSchemes = allSchemes.filter(s => {
    const words = (s.content_en || '').split(/\s+/).length;
    return words < 300;
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
    
    // Choose dynamic structure
    const isLoan = scheme.type === 'loan' || (scheme.category || '').toLowerCase() === 'loans';
    const typeStr = isLoan ? 'loan' : 'scheme';
    const structureList = isLoan ? LOAN_STRUCTURES : SCHEME_STRUCTURES;
    const structure = structureList[Math.floor(Math.random() * structureList.length)];
    
    const systemPrompt = getSystemPrompt(typeStr, structure, scheme.country_code || 'IN');
    
    const userPrompt = `Rewrite the following short article into a comprehensive, SEO-optimized 1000+ word article.
Existing content details:
Name: ${scheme.name}
Benefit: ${scheme.benefit_amount || 'Unknown'}
Eligibility: ${scheme.eligibility ? JSON.stringify(scheme.eligibility) : 'Unknown'}
Category: ${scheme.category}
Original Text: ${scheme.content_en || 'None'}`;

    try {
      const result = await callLLM(userPrompt, systemPrompt);
      const cleaned = result.replace(/```json\s*/gi,'').replace(/```\s*/g,'').trim();
      const parsed = JSON.parse(cleaned);
      
      // Update the content but NEVER touch the slug
      const { error: upErr } = await supabase
        .from('schemes')
        .update({
          content_en: JSON.stringify(parsed),
          rewritten_at: new Date().toISOString()
        })
        .eq('id', scheme.id);
        
      if (upErr) throw upErr;
      console.log(`   ✅ Successfully rewritten using ${structure} format.`);
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

  console.log(`🏁 Run complete! Success: ${successCount} | Failed: ${failCount}`);
}

main().catch(console.error);
