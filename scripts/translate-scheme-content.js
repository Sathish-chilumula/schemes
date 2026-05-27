/**
 * SchemeAtlas — Job 2: Scheme Content Translator (State Languages)
 * =================================================================
 * Purpose  : Translate English scheme content to correct state language
 * AI Model : OpenAI gpt-4o-mini ONLY (best translation quality)
 * Batch    : 20 schemes per run
 * Skip     : Exits cleanly if no schemes need translation (saves budget)
 * Output   : Sets content_hi, content_local, local_language, is_translated=true
 * =================================================================
 */

const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const BATCH_SIZE = 20;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required for translation (OpenAI only).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── State → Language Matrix ──────────────────────────────────────────────────
// primary: first language to write (content_hi if 'hi', else content_local)
// secondary: optional second language for national/central schemes only
const STATE_LANGUAGE_MATRIX = {
  // Central / National
  'india': { primary: 'hi', secondary: 'te' },

  // South India
  'TS': { primary: 'te', secondary: null },
  'AP': { primary: 'te', secondary: null },
  'KA': { primary: 'kn', secondary: null },
  'TN': { primary: 'ta', secondary: null },
  'KL': { primary: 'ml', secondary: null },

  // West India
  'MH': { primary: 'mr', secondary: null },
  'GJ': { primary: 'gu', secondary: null },

  // East India
  'WB': { primary: 'bn', secondary: null },
  'OR': { primary: 'or', secondary: null },
  'AS': { primary: 'as', secondary: null },
  'TR': { primary: 'bn', secondary: null },

  // North India — all Hindi
  'UP': { primary: 'hi', secondary: null },
  'MP': { primary: 'hi', secondary: null },
  'RJ': { primary: 'hi', secondary: null },
  'BR': { primary: 'hi', secondary: null },
  'HR': { primary: 'hi', secondary: null },
  'DL': { primary: 'hi', secondary: null },
  'CG': { primary: 'hi', secondary: null },
  'JH': { primary: 'hi', secondary: null },
  'HP': { primary: 'hi', secondary: null },
  'UK': { primary: 'hi', secondary: null },
  'PB': { primary: 'pa', secondary: null },
  'JK': { primary: 'hi', secondary: null },

  // UTs
  'CH': { primary: 'pa', secondary: null },
  'PY': { primary: 'ta', secondary: null },
  'LD': { primary: 'ml', secondary: null },

  // North-East — English only, no translation
  'AR': null, 'NL': null, 'MN': null, 'MZ': null, 'ML': null,
  'SK': null, 'AN': null, 'DN': null, 'LA': null,

  // Foreign countries — no translation
  'GB': null, 'US': null, 'NG': null, 'KE': null,
};

const LANGUAGE_NAMES = {
  'hi': 'Hindi',
  'te': 'Telugu',
  'kn': 'Kannada',
  'ta': 'Tamil',
  'ml': 'Malayalam',
  'mr': 'Marathi',
  'bn': 'Bengali',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'or': 'Odia',
  'as': 'Assamese',
};

// Language-specific glossaries for natural translation
const GLOSSARIES = {
  'te': 'scheme=పథకం, apply=దరఖాస్తు చేయండి, online=ఆన్‌లైన్, documents=పత్రాలు, eligibility=అర్హత, benefit=ప్రయోజనం, free=ఉచిత, government=ప్రభుత్వం',
  'hi': 'scheme=योजना, apply=आवेदन करें, online=ऑनलाइन, documents=दस्तावेज़, eligibility=पात्रता, benefit=लाभ, government=सरकार',
  'kn': 'scheme=ಯೋಜನೆ, apply=ಅರ್ಜಿ ಸಲ್ಲಿಸಿ, online=ಆನ್‌ಲೈನ್, documents=ದಾಖಲೆಗಳು, eligibility=ಅರ್ಹತೆ',
  'ta': 'scheme=திட்டம், apply=விண்ணப்பிக்கவும், online=ஆன்லைன், documents=ஆவணங்கள், eligibility=தகுதி',
  'ml': 'scheme=പദ്ധതി, apply=അപ്ലൈ ചെയ്യുക, online=ഓൺലൈൻ, documents=രേഖകൾ, eligibility=യോഗ്യത',
  'mr': 'scheme=योजना, apply=अर्ज करा, online=ऑनलाइन, documents=कागदपत्रे, eligibility=पात्रता',
  'bn': 'scheme=প্রকল্প, apply=আবেদন করুন, online=অনলাইন, documents=নথি, eligibility=যোগ্যতা',
  'gu': 'scheme=યોજના, apply=અરજી કરો, online=ઑનલાઇન, documents=દસ્તાવેજો, eligibility=પાત્રતા',
};

// ─── Determine which language to use for a scheme ────────────────────────────
function getLanguageConfig(scheme) {
  const stateCode = (scheme.state_code || 'india').toUpperCase();
  if (stateCode === 'INDIA' || stateCode === '' || !stateCode) {
    return STATE_LANGUAGE_MATRIX['india'];
  }
  return STATE_LANGUAGE_MATRIX[stateCode] || null;
}

// ─── OpenAI translation call ──────────────────────────────────────────────────
async function translateWithOpenAI(content, targetLangCode, schemeName) {
  const langName = LANGUAGE_NAMES[targetLangCode] || targetLangCode;
  const glossary = GLOSSARIES[targetLangCode] || '';

  // Detect if content is structured JSON
  let isStructuredJSON = false;
  let parsed = null;
  try {
    parsed = JSON.parse(content);
    if (parsed && Array.isArray(parsed.sections) && Array.isArray(parsed.faqs)) {
      isStructuredJSON = true;
    }
  } catch { /* plain text */ }

  const prompt = isStructuredJSON
    ? `You are an expert native ${langName} translator for SchemeAtlas, India's government scheme platform.

Translate this government scheme guide from English to natural, conversational ${langName}.

RULES:
- Translate naturally — NOT robotic Google Translate style
- Blend common English words people actually use: apply, online, website, documents, form, scheme, portal
- Keep all emojis exactly as-is (do not remove or change emojis)
- Keep JSON structure IDENTICAL — same keys, same number of array elements
- Keep all URLs, portal names, and ₹ amounts unchanged
${glossary ? `- GLOSSARY: ${glossary}` : ''}

Return ONLY valid JSON with the translated fields (same structure, no markdown fences):
${JSON.stringify({ intro: parsed.intro, tableOfContents: parsed.tableOfContents, sections: parsed.sections, faqs: parsed.faqs }, null, 1)}`
    : `You are an expert native ${langName} translator for government scheme guides.

Translate the following English scheme content into natural, conversational ${langName} for citizens.

RULES:
- Do NOT use formal textbook language. Write like a helpful friend explaining to a family member.
- Blend common English words where appropriate (apply, online, portal, scheme, documents)
- Keep all ₹ amounts and numbers unchanged
- Keep URLs unchanged
${glossary ? `- GLOSSARY: ${glossary}` : ''}

Content to translate:
${content}`;

  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 4000,
    temperature: 0.3,
  }, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 60000,
  });

  const raw = res.data?.choices?.[0]?.message?.content?.trim();
  if (!raw || raw.length < 100) throw new Error('Translation output too short');

  if (isStructuredJSON) {
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const translated = JSON.parse(cleaned);
      // Merge translated fields back into original structure
      return JSON.stringify({ ...parsed, ...translated });
    } catch (e) {
      console.warn(`    ⚠️  JSON merge failed for ${langName}: ${e.message}`);
      return null;
    }
  }

  return raw;
}

// ─── Main pipeline ────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🚀 SchemeAtlas — Job 2: Scheme Content Translator');
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`📦 Batch: ${BATCH_SIZE} schemes | AI: OpenAI gpt-4o-mini only`);

  // Find schemes that have English content but no translation yet
  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('id, name, slug, state_code, state_name, country_code, content_en, category')
    .eq('is_seo_optimized', true)
    .eq('is_translated', false)
    .not('content_en', 'is', null)
    .order('last_updated', { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error('❌ Supabase query error:', error.message);
    process.exit(1);
  }

  // ── SKIP if nothing to do ──
  if (!schemes || schemes.length === 0) {
    console.log('\n✅ No schemes need translation. Skipping run to save API budget.');
    process.exit(0);
  }

  console.log(`\n📊 Found ${schemes.length} schemes to translate.\n`);

  let translated = 0;
  let skipped = 0;
  let failed = 0;

  for (const scheme of schemes) {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`🌐 ${scheme.name} [${scheme.state_code || 'Central'}]`);

    const langConfig = getLanguageConfig(scheme);

    if (!langConfig) {
      console.log(`   ⏭️  No translation needed for ${scheme.state_code || 'this region'}. Marking done.`);
      await supabase.from('schemes').update({ is_translated: true }).eq('id', scheme.id);
      skipped++;
      continue;
    }

    if (!scheme.content_en || scheme.content_en.length < 200) {
      console.log('   ⚠️  No English content to translate. Skipping.');
      failed++;
      continue;
    }

    const updatePayload = { is_translated: true, last_updated: new Date().toISOString() };

    // ── Primary language ──
    const { primary, secondary } = langConfig;
    try {
      console.log(`   🔤 Translating to ${LANGUAGE_NAMES[primary] || primary}...`);
      const result = await translateWithOpenAI(scheme.content_en, primary, scheme.name);

      if (result) {
        if (primary === 'hi') {
          updatePayload.content_hi = result;
        } else {
          updatePayload.content_local = result;
          updatePayload.local_language = primary;
        }
        console.log(`   ✅ ${LANGUAGE_NAMES[primary]} done (${result.length} chars)`);
      }
    } catch (err) {
      console.warn(`   ❌ ${LANGUAGE_NAMES[primary] || primary} translation failed: ${err.message}`);
    }

    await delay(2000);

    // ── Secondary language (central/national schemes only) ──
    if (secondary) {
      try {
        console.log(`   🔤 Translating to ${LANGUAGE_NAMES[secondary] || secondary} (secondary)...`);
        const result = await translateWithOpenAI(scheme.content_en, secondary, scheme.name);

        if (result) {
          // For central schemes: primary=hi goes to content_hi, secondary=te goes to content_local
          if (primary === 'hi' && secondary !== 'hi') {
            updatePayload.content_local = result;
            updatePayload.local_language = secondary;
          }
          console.log(`   ✅ ${LANGUAGE_NAMES[secondary]} done (${result.length} chars)`);
        }
      } catch (err) {
        console.warn(`   ❌ ${LANGUAGE_NAMES[secondary] || secondary} translation failed: ${err.message}`);
      }

      await delay(2000);
    }

    // Save to DB
    const { error: updateError } = await supabase
      .from('schemes')
      .update(updatePayload)
      .eq('id', scheme.id);

    if (updateError) {
      console.error(`   ❌ DB save failed: ${updateError.message}`);
      failed++;
    } else {
      console.log('   💾 Saved. Marked: is_translated=true');
      translated++;
    }

    await delay(1500);
  }

  console.log(`\n${'━'.repeat(50)}`);
  console.log(`✅ Translated: ${translated}`);
  console.log(`⏭️  Skipped (no translation needed): ${skipped}`);
  console.log(`❌ Failed:     ${failed}`);
  console.log(`${'━'.repeat(50)}\n`);
}

run()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Translation pipeline failed:', err);
    process.exit(1);
  });
