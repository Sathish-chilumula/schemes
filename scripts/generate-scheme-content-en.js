/**
 * SchemeAtlas — Job 1: Scheme Content Writer (English Only)
 * ============================================================
 * Purpose  : Write rich English content for unwritten schemes
 * AI Model : Groq llama-3.3-70b (primary) → OpenAI gpt-4o-mini (fallback)
 * Batch    : 15 schemes per run (configurable via BATCH_SIZE env)
 * Skip     : Exits cleanly if no new schemes found (saves API budget)
 * Output   : Sets content_en, is_seo_optimized=true, is_translated=false
 * ============================================================
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { getSystemPrompt, SCHEME_STRUCTURES } = require('../lib/content-prompts');

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '15', 10);
const BULK_MODE = process.env.BULK_MODE === 'true';
const FORCE_SLUG = process.env.FORCE_SCHEME_SLUG || '';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
  process.exit(1);
}
if (!GROQ_API_KEY && !OPENAI_API_KEY) {
  console.error('❌ At least one of GROQ_API_KEY or OPENAI_API_KEY is required.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── AI Completion: Groq → OpenAI ────────────────────────────────────────────
async function callLLM(prompt, maxTokens = 3500) {
  // Tier 1: Groq (fast, cheap)
  if (GROQ_API_KEY) {
    try {
      const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4,
      }, {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 35000,
      });
      const text = res.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 200) return text;
    } catch (err) {
      console.warn(`  ⚠️  Groq failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // Tier 2: OpenAI gpt-4o-mini
  if (OPENAI_API_KEY) {
    try {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.4,
      }, {
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 45000,
      });
      const text = res.data?.choices?.[0]?.message?.content?.trim();
      if (text && text.length > 200) return text;
    } catch (err) {
      console.warn(`  ⚠️  OpenAI failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  return null;
}

// ─── Build the English content prompt ────────────────────────────────────────
function buildPrompt(scheme) {
  const structure = SCHEME_STRUCTURES[Math.floor(Math.random() * SCHEME_STRUCTURES.length)];
  const systemPrompt = getSystemPrompt('scheme', structure, scheme.country_code || 'IN');

  const userPrompt = `Write a detailed 1,500-word guide for the scheme below.
Scheme: ${scheme.name}
State: ${scheme.state_name || 'Central Government of India'}
Category: ${scheme.category || 'General'}
Benefit Info: ${scheme.what_you_get || 'N/A'}
Benefit Amount: ${scheme.benefit_amount || 'N/A'}
Eligibility: ${JSON.stringify(scheme.eligibility || {})}
How to Apply: ${JSON.stringify(scheme.how_to_apply || {})}
Documents: ${JSON.stringify(scheme.documents || [])}
Official URL: ${scheme.official_url || 'N/A'}`;

  return { systemPrompt, userPrompt, structure };
}

// ─── Parse and validate LLM JSON output ──────────────────────────────────────
function parseContent(raw) {
  if (!raw) return null;
  try {
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.sections || !Array.isArray(parsed.sections) || !parsed.faqs || !parsed.intro) {
      throw new Error('Missing required fields: sections, faqs, intro');
    }
    if (parsed.sections.some(s => s.heading && s.heading.match(/(Title|Summary|What is the Scheme|Pro Tips):/i))) {
      throw new Error('AI template labels found in JSON headings');
    }
    return JSON.stringify(parsed);
  } catch (e) {
    console.warn(`  ⚠️  JSON parse or quality check failed: ${e.message}. Returning null to fail and retry later.`);
    return null;
  }
}

// ─── Main pipeline ────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🚀 SchemeAtlas — Job 1: Scheme Content Writer (English Only)');
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`📦 Batch size: ${BULK_MODE ? 'BULK MODE (50)' : BATCH_SIZE}`);

  // Build query
  let query = supabase.from('schemes').select('*').neq('scheme_type', 'loan');

  if (FORCE_SLUG) {
    console.log(`🎯 Force mode: ${FORCE_SLUG}`);
    query = query.eq('slug', FORCE_SLUG);
  } else {
    query = query
      .eq('is_seo_optimized', false)
      .order('discovered_at', { ascending: false })
      .limit(BULK_MODE ? 50 : BATCH_SIZE);
  }

  const { data: schemes, error } = await query;

  if (error) {
    console.error('❌ Supabase query error:', error.message);
    process.exit(1);
  }

  // ── SKIP if nothing to do ──
  if (!schemes || schemes.length === 0) {
    console.log('\n✅ No new unoptimized schemes found. Skipping run to save API budget.');
    console.log('   (All current schemes already have English content.)');
    process.exit(0);
  }

  console.log(`\n📊 Found ${schemes.length} schemes to write content for.\n`);

  let written = 0;
  let failed = 0;

  for (const scheme of schemes) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📝 ${scheme.name} [${scheme.state_code || 'Central'}]`);
    console.log(`   Category: ${scheme.category || 'General'}`);

    try {
      const { systemPrompt, userPrompt, structure } = buildPrompt(scheme);
      const raw = await callLLM(systemPrompt + "\n\n" + userPrompt, 3500);

      if (!raw) {
        console.error('   ❌ All AI providers failed. Skipping.');
        failed++;
        continue;
      }

      const contentEn = parseContent(raw);
      if (!contentEn || contentEn.length < 300) {
        console.error('   ❌ Content too short or invalid. Skipping.');
        failed++;
        continue;
      }

      console.log(`   ✅ English content generated (${contentEn.length} chars)`);

      // Save to DB
      const { error: updateError } = await supabase
        .from('schemes')
        .update({
          content_en: contentEn,
          is_seo_optimized: true,
          is_translated: false,
          last_updated: new Date().toISOString(),
        })
        .eq('id', scheme.id);

      if (updateError) {
        console.error(`   ❌ DB save failed: ${updateError.message}`);
        failed++;
      } else {
        console.log('   💾 Saved to database. Marked: is_seo_optimized=true, is_translated=false');
        written++;
      }
    } catch (e) {
      console.error(`   ❌ Unexpected error: ${e.message}`);
      failed++;
    }

    // Rate limit delay between schemes
    await delay(2000);
  }

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`✅ Written: ${written}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`${'━'.repeat(50)}\n`);
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  });
