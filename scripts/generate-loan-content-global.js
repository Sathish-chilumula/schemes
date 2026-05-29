/**
 * SchemeAtlas — Global Scheme Content Writer (English Only)
 * ==========================================================
 * Countries: USA, UK, Canada, Australia, EU
 * AI Model : Groq primary → OpenAI fallback
 * Batch    : 10 per run (global schemes are richer, need more tokens)
 * Skip     : Exits cleanly if nothing new
 * Output   : Sets content_en, is_seo_optimized=true
 * Note     : NO translation needed — English is the target
 * ==========================================================
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { getSystemPrompt, LOAN_STRUCTURES } = require('../lib/content-prompts');

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('❌ Supabase env vars required'); process.exit(1); }
if (!GROQ_KEY && !OPENAI_KEY) { console.error('❌ At least one AI API key required'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
// ─── Build content prompt per country ───────────────────────────────────────
function buildPrompt(scheme) {
  const cc = (scheme.country_code || 'US').toUpperCase();
  const structure = LOAN_STRUCTURES[Math.floor(Math.random() * LOAN_STRUCTURES.length)];
  const systemPrompt = getSystemPrompt('loan', structure, cc);

  const countryNames = { US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia', EU: 'European Union' };
  const countryName = countryNames[cc] || cc;

  const userPrompt = `Write a detailed 1,500-word article for the following global financial product.
Scheme: ${scheme.name}
Country: ${countryName} (${cc})
Category: ${scheme.category || 'General'}
Benefit: ${scheme.what_you_get || 'N/A'} | Amount: ${scheme.benefit_amount || 'N/A'}
Jurisdiction: ${scheme.jurisdiction_level || 'national'}
Official URL: ${scheme.official_url || 'N/A'}
Eligibility data: ${JSON.stringify(scheme.eligibility || {})}
`;

  return { systemPrompt, userPrompt, structure };
}

// ─── Parse content ────────────────────────────────────────────────────────────
function parseContent(raw) {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (!parsed.sections || !parsed.faqs || !parsed.intro) throw new Error('Missing fields');
    return JSON.stringify(parsed);
  } catch {
    return raw.length > 300 ? raw : null;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🌍 SchemeAtlas — Global Content Writer (EN only)');
  console.log(`⏰ ${new Date().toISOString()}`);

  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('*')
    .neq('country_code', 'IN')
    .eq('type', 'loan')
    .eq('is_seo_optimized', false)
    .order('discovered_at', { ascending: false })
    .limit(BATCH_SIZE);

  if (error) { console.error('❌ Query error:', error.message); process.exit(1); }

  if (!schemes?.length) {
    console.log('\n✅ No unwritten global schemes. Skipping run to save API budget.');
    process.exit(0);
  }

  console.log(`\n📊 Found ${schemes.length} global schemes to write.\n`);

  let written = 0, failed = 0;

  for (const scheme of schemes) {
    const cc = (scheme.country_code || 'US').toUpperCase();
    const countryFlags = { US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', EU: '🇪🇺', NG: '🇳🇬', KE: '🇰🇪' };
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`${countryFlags[cc] || '🌍'} ${scheme.name} [${cc}]`);

    try {
      const { systemPrompt, userPrompt, structure } = buildPrompt(scheme);
      const raw = await callLLM(systemPrompt + "\n\n" + userPrompt, 3500);
      const content = parseContent(raw);

      if (!content || content.length < 300) { console.log('  ❌ Too short. Skipping.'); failed++; continue; }

      console.log(`  ✅ Content ready (${content.length} chars)`);

      const { error: e } = await supabase
        .from('schemes')
        .update({
          content_en: content,
          is_seo_optimized: true,
          is_translated: true, // Global = no translation needed
          last_updated: new Date().toISOString(),
        })
        .eq('id', scheme.id);

      if (e) { console.log(`  ❌ DB error: ${e.message}`); failed++; }
      else { console.log('  💾 Saved. is_seo_optimized=true, is_translated=true (EN is final)'); written++; }
    } catch (e) { console.error(`  ❌ Error: ${e.message}`); failed++; }

    await delay(2000);
  }

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`✅ Written: ${written} | ❌ Failed: ${failed}`);
  console.log(`${'━'.repeat(50)}\n`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
