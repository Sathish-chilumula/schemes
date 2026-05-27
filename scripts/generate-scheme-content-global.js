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

const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('❌ Supabase env vars required'); process.exit(1); }
if (!GROQ_KEY && !OPENAI_KEY) { console.error('❌ At least one AI API key required'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Country-specific content rules ─────────────────────────────────────────
const COUNTRY_RULES = {
  US: {
    currencySymbol: '$',
    portalNote: 'Source: Must include official .gov URL (e.g., benefits.gov, ssa.gov, hud.gov)',
    stateNote: 'Eligibility and amounts vary by state. Always include: "Check your state\'s official portal for exact amounts."',
    disclaimer: '⚠️ Eligibility rules and benefit amounts vary by state. Check your state\'s official government portal for exact figures.',
    thresholds: 'Reference FPL % when discussing income limits. 2026 FPL: $15,060/year individual. SNAP: ≤130% FPL. Medicaid: ≤138% FPL.',
    portal: 'benefits.gov',
    jurisdiction: 'Include "Federal" or "State of [Name]" in scheme intro.',
  },
  GB: {
    currencySymbol: '£',
    portalNote: 'Source: Must include GOV.UK URL (gov.uk/...)',
    stateNote: 'Note which UK nations this applies to: England | Scotland | Wales | Northern Ireland.',
    disclaimer: '⚠️ Some benefits differ between England, Scotland, Wales and Northern Ireland. Check GOV.UK for your nation.',
    thresholds: 'Reference weekly/monthly amounts as UK uses weekly rates. E.g. £221.20/week State Pension.',
    portal: 'gov.uk',
    jurisdiction: 'Specify: National (UK-wide) or Devolved (England-only, Scotland-only, etc.)',
  },
  CA: {
    currencySymbol: 'CA$',
    portalNote: 'Source: Must include canada.ca or province.ca URL',
    stateNote: 'Note which provinces this applies to. Quebec often has separate provincial programs.',
    disclaimer: '⚠️ Canada has both federal and provincial benefits. Provincial amounts and eligibility may differ.',
    thresholds: 'Reference after-tax income where applicable. CCB is based on AFNI (Adjusted Family Net Income).',
    portal: 'canada.ca',
    jurisdiction: 'Specify: Federal (Canada-wide) or Provincial (e.g., Ontario-only)',
  },
  AU: {
    currencySymbol: 'A$',
    portalNote: 'Source: Must include servicesaustralia.gov.au or australia.gov.au URL',
    stateNote: 'Note if this is federal (Centrelink) or state-specific.',
    disclaimer: '⚠️ Some programs differ by state. Check Services Australia or your state government portal.',
    thresholds: 'Reference fortnightly rates as Australia pays most Centrelink payments fortnightly.',
    portal: 'servicesaustralia.gov.au',
    jurisdiction: 'Specify: Federal (Centrelink) or State-specific',
  },
  EU: {
    currencySymbol: '€',
    portalNote: 'Source: Must include europa.eu or official EU program URL',
    stateNote: 'Specify which EU member states this applies to.',
    disclaimer: '⚠️ EU programs may require national co-funding. Check with your national contact point.',
    thresholds: 'Reference the 2021-2027 Multiannual Financial Framework (MFF) period.',
    portal: 'europa.eu',
    jurisdiction: 'Specify: EU-wide or limited to specific member states',
  },
};

// ─── AI Call ─────────────────────────────────────────────────────────────────
async function callLLM(prompt, maxTokens = 3500) {
  if (GROQ_KEY) {
    try {
      const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens, temperature: 0.35,
      }, {
        headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        timeout: 35000,
      });
      const text = res.data?.choices?.[0]?.message?.content?.trim();
      if (text?.length > 200) return text;
    } catch (err) { console.warn(`  ⚠️  Groq: ${err.response?.data?.error?.message || err.message}`); }
  }
  if (OPENAI_KEY) {
    try {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens, temperature: 0.35,
      }, {
        headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
        timeout: 45000,
      });
      const text = res.data?.choices?.[0]?.message?.content?.trim();
      if (text?.length > 200) return text;
    } catch (err) { console.warn(`  ⚠️  OpenAI: ${err.response?.data?.error?.message || err.message}`); }
  }
  return null;
}

// ─── Build content prompt per country ───────────────────────────────────────
function buildPrompt(scheme) {
  const cc = (scheme.country_code || 'US').toUpperCase();
  const rules = COUNTRY_RULES[cc] || COUNTRY_RULES.US;
  const sym = rules.currencySymbol;
  const year = new Date().getFullYear();

  const countryNames = { US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia', EU: 'European Union' };
  const countryName = countryNames[cc] || cc;

  return `You are a senior benefits advisor at SchemeAtlas writing a government benefits guide for ${countryName}.

Scheme: ${scheme.name}
Country: ${countryName} (${cc})
Category: ${scheme.category || 'General'}
Benefit: ${scheme.what_you_get || 'N/A'} | Amount: ${scheme.benefit_amount || 'N/A'}
Jurisdiction: ${scheme.jurisdiction_level || 'national'}
Official URL: ${scheme.official_url || `${rules.portal}`}
Eligibility data: ${JSON.stringify(scheme.eligibility || {})}

COUNTRY-SPECIFIC RULES:
- Currency: ${sym} (NEVER use ₹ or any other currency)
- ${rules.portalNote}
- ${rules.stateNote}
- ${rules.thresholds}
- ${rules.jurisdiction}

WRITING RULES:
1. FIRST SENTENCE must be: "${scheme.name} gives [exact ${sym} amount] to [who exactly]. [Eligibility in 1 sentence]."
2. NEVER start with "Let's dive in", "In this guide", "It is worth noting", "Comprehensive guide"
3. H2 headings MUST include country and year: e.g. "${scheme.name} Eligibility ${countryName} ${year}"
4. Include official portal URL in How To Apply section: ${rules.portal}
5. Add disclaimer: "${rules.disclaimer}"
6. FAQ answers MUST start with YES/NO or a specific ${sym} amount

Return ONLY valid JSON (no markdown fences):
{
  "intro": "Direct sentence 1 with ${sym} amount. Eligibility sentence. Hook sentence.",
  "tableOfContents": ["What Is ${scheme.name}?", "${scheme.name} Benefits & Exact Amounts ${year}", "${scheme.name} Eligibility in ${countryName} ${year}", "Who Cannot Apply?", "How to Apply Online — Step by Step", "Frequently Asked Questions"],
  "sections": [
    {"heading": "🏛️ What Is ${scheme.name}?", "content": "200-word explanation naming the official department/agency, program year, and objective."},
    {"heading": "💰 ${scheme.name} Benefit Amounts ${year}", "content": "Exact ${sym} amounts, payment frequency, income thresholds. No vague language."},
    {"heading": "✅ ${scheme.name} Eligibility in ${countryName} ${year}", "content": "Age, income, residency/citizenship, other criteria with exact numbers."},
    {"heading": "🚫 Who Is NOT Eligible for ${scheme.name}?", "content": "Real exclusion examples with ${sym} figures."},
    {"heading": "📝 How to Apply for ${scheme.name} Online — Step by Step", "content": "Numbered steps with URL: ${scheme.official_url || rules.portal}"},
    {"heading": "⚠️ Important Notes & Disclaimer", "content": "${rules.disclaimer} — plus 2-3 practical tips."}
  ],
  "faqs": [
    {"q": "Who qualifies for ${scheme.name} in ${countryName} ${year}?", "a": "YES, you qualify if... [specific criteria]"},
    {"q": "How much does ${scheme.name} pay in ${year}?", "a": "${sym}[exact amount]. Paid [frequency]."},
    {"q": "How do I apply for ${scheme.name} online?", "a": "Step 1: Visit ${scheme.official_url || rules.portal}. Step 2: ..."},
    {"q": "Is ${scheme.name} available in all states/regions?", "a": "[YES/NO + explanation of regional variations]"},
    {"q": "Can I get ${scheme.name} if I am not a citizen?", "a": "[YES/NO + exact residency requirements]"}
  ]
}`;
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
      const prompt = buildPrompt(scheme);
      const raw = await callLLM(prompt, 3500);
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
