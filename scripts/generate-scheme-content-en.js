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

// ─── Category-specific content depth instructions ────────────────────────────
function getCategoryInstructions(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('farm') || cat.includes('agri') || cat.includes('kisan')) {
    return `CATEGORY RULES (Farmers):
- Include current MSP crop rates table (wheat ₹2,275/quintal, paddy ₹2,183/quintal, etc.)
- Mention pmkisan.gov.in as the registration portal
- Include PM-KISAN installment calendar (Apr, Aug, Dec)
- Name the Ministry of Agriculture and Farmers Welfare in full`;
  }
  if (cat.includes('health') || cat.includes('medical') || cat.includes('hospital')) {
    return `CATEGORY RULES (Healthcare):
- Mention AB-PMJAY (Ayushman Bharat) portal: pmjay.gov.in
- Include cashless vs reimbursement process
- Name empanelled hospital count if known
- Include State Health Agency (SHA) contact`;
  }
  if (cat.includes('business') || cat.includes('msme') || cat.includes('loan') || cat.includes('enterprise')) {
    return `CATEGORY RULES (Business/MSME):
- Include MUDRA loan slabs: Shishu (₹50K), Kishore (₹5L), Tarun (₹10L)
- Mention Udyam Registration portal: udyamregistration.gov.in
- Include MSME Samadhaan grievance portal
- Name Ministry of MSME in full`;
  }
  if (cat.includes('student') || cat.includes('edu') || cat.includes('scholar')) {
    return `CATEGORY RULES (Education/Scholarship):
- Include National Scholarship Portal: scholarships.gov.in
- Specify application deadline month (usually Jul–Oct)
- Distinguish merit-based vs income-based criteria
- Include renewal conditions`;
  }
  if (cat.includes('women') || cat.includes('girl') || cat.includes('maternal')) {
    return `CATEGORY RULES (Women):
- Include SHG (Self Help Group) formation steps if relevant
- Include Women Helpline number: 181
- Mention Beti Bachao Beti Padhao if applicable
- Include Mission Shakti / Poshan Abhiyan links`;
  }
  if (cat.includes('hous') || cat.includes('shelter') || cat.includes('awas')) {
    return `CATEGORY RULES (Housing):
- Include PMAY EWS (income < ₹3L), LIG (₹3–6L), MIG-I (₹6–12L) slabs
- Include CLSS subsidy: EWS/LIG = ₹2.67L, MIG-I = ₹2.35L, MIG-II = ₹2.30L
- Example: "A family earning ₹4L/year saves ₹2.67L on a ₹10L home loan"
- Portal: pmaymis.gov.in`;
  }
  return '';
}

// ─── Build the English content prompt ────────────────────────────────────────
function buildPrompt(scheme) {
  const stateContext = scheme.state_name
    ? `State: ${scheme.state_name} (${scheme.state_code})`
    : `Central Government of India`;
  const location = scheme.state_name || 'India';
  const categoryInstructions = getCategoryInstructions(scheme.category);
  const currentYear = new Date().getFullYear();

  return `You are a senior government scheme advisor at SchemeAtlas — India's most trusted scheme discovery platform.
Write a detailed 1,500-word guide for the scheme below. Tone: direct, conversational, 8th-grade reading level.

Scheme: ${scheme.name}
${stateContext}
Category: ${scheme.category || 'General'}
Benefit Info: ${scheme.what_you_get || 'N/A'}
Benefit Amount: ${scheme.benefit_amount || 'N/A'}
Eligibility: ${JSON.stringify(scheme.eligibility || {})}
How to Apply: ${JSON.stringify(scheme.how_to_apply || {})}
Documents: ${JSON.stringify(scheme.documents || [])}
Official URL: ${scheme.official_url || 'N/A'}

${categoryInstructions}

STRICT WRITING RULES:
1. FIRST PARAGRAPH must be a direct answer: "${scheme.name} gives [exact ₹ amount] to [who]. [Eligibility in 1 sentence]."
   NO "let's dive in", NO "in this guide", NO "it is worth noting", NO history lessons.
2. H2 headings MUST use location + year: "${scheme.name} Eligibility in ${location} ${currentYear}"
3. FAQ questions MUST be specific: "Who can apply for ${scheme.name} ${currentYear} in ${location}?"
4. Every FAQ answer MUST start with YES/NO or a specific ₹ number or date.
5. Name the Ministry in FULL (e.g., "Ministry of Agriculture and Farmers Welfare") in the first 200 words.
6. Include the official portal URL in the How To Apply section.
7. NEVER use: "comprehensive guide", "delve into", "Let's explore", "Pro Tips", "Key Takeaways".
8. Use real ₹ amounts. Never write "substantial support" or "significant benefits".

Return ONLY valid JSON (no markdown fences, no text before or after):
{
  "intro": "Direct answer sentence 1 with ₹ amount. Eligibility sentence 2. One hook sentence 3.",
  "tableOfContents": ["What Is ${scheme.name}?", "${scheme.name} Benefits & Exact Amounts", "${scheme.name} Eligibility in ${location} ${currentYear}", "Who Cannot Apply?", "Documents Required ${currentYear}", "How to Apply Online — Step by Step", "Important Deadlines ${currentYear}", "Common Mistakes to Avoid"],
  "sections": [
    {"heading": "🏛️ What Is ${scheme.name}?", "content": "200-word explanation naming the ministry, launch year, total beneficiaries if known, and main objective. No fluff."},
    {"heading": "💰 ${scheme.name} Benefits and Exact Amounts", "content": "Exact ₹ amounts, payment schedule, slabs, units. Be specific with numbers."},
    {"heading": "✅ ${scheme.name} Eligibility in ${location} ${currentYear}", "content": "Age, income, caste, occupation with exact numbers. Clear criteria list."},
    {"heading": "🚫 Who Cannot Apply for ${scheme.name}?", "content": "Real-life exclusion examples: 'A government employee earning ₹8L/year cannot apply because...'"},
    {"heading": "📄 Documents Required for ${scheme.name} ${currentYear}", "content": "Exact numbered list: Aadhaar, income certificate, bank passbook, etc."},
    {"heading": "📝 How to Apply for ${scheme.name} Online — Step by Step", "content": "Numbered steps with specific portal names and URLs."},
    {"heading": "📅 Important Dates and Deadlines ${currentYear}", "content": "Application window, renewal dates, installment dates."},
    {"heading": "⚠️ Common Mistakes That Get Applications Rejected", "content": "3-4 real mistakes with how to avoid them."}
  ],
  "faqs": [
    {"q": "Who can apply for ${scheme.name} ${currentYear} in ${location}?", "a": "Direct specific answer starting with eligibility criteria."},
    {"q": "What is the exact benefit amount under ${scheme.name} ${currentYear}?", "a": "₹ exact amount. Payment method and frequency."},
    {"q": "How to apply for ${scheme.name} online — step by step?", "a": "Step 1: Visit [portal]. Step 2: ..."},
    {"q": "What documents are needed for ${scheme.name}?", "a": "1. Aadhaar card. 2. Income certificate. 3. ..."},
    {"q": "Is ${scheme.name} still active in ${currentYear}?", "a": "YES / NO + current status and last update."}
  ]
}`;
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
    return JSON.stringify(parsed);
  } catch (e) {
    console.warn(`  ⚠️  JSON parse failed: ${e.message}. Storing raw as fallback.`);
    return raw.length > 200 ? raw : null;
  }
}

// ─── Main pipeline ────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🚀 SchemeAtlas — Job 1: Scheme Content Writer (English Only)');
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`📦 Batch size: ${BULK_MODE ? 'BULK MODE (50)' : BATCH_SIZE}`);

  // Build query
  let query = supabase.from('schemes').select('*');

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
      const prompt = buildPrompt(scheme);
      const raw = await callLLM(prompt, 3500);

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
