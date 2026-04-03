/**
 * One-time script: Generate Q&A content for all schemes
 * Uses Groq API (super fast, high limits)
 * Run: node scripts/run-migration-and-generate.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_KEY';
const GROQ_API_KEY = process.env.GROQ_API_KEY || 'YOUR_GROQ_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MODELS = ['llama-3.1-8b-instant'];

// Language maps
const STATE_LANGUAGE_MAP = {
  'TS': 'te', 'AP': 'te', 'KA': 'kn', 'TN': 'ta', 'KL': 'ml',
  'MH': 'mr', 'WB': 'bn', 'GJ': 'gu', 'PB': 'pa', 'OD': 'or', 'OR': 'or',
  'AS': 'as', 'RJ': 'hi', 'UP': 'hi', 'MP': 'hi', 'CG': 'hi', 'JH': 'hi',
  'BR': 'hi', 'HP': 'hi', 'UK': 'hi', 'HR': 'hi', 'DL': 'hi',
};
const LANGUAGE_NAMES = {
  'te': 'Telugu', 'kn': 'Kannada', 'ta': 'Tamil', 'ml': 'Malayalam',
  'mr': 'Marathi', 'bn': 'Bengali', 'gu': 'Gujarati', 'pa': 'Punjabi',
  'or': 'Odia', 'as': 'Assamese', 'hi': 'Hindi',
  'sw': 'Swahili', 'yo': 'Yoruba', 'ha': 'Hausa', 'es': 'Spanish',
};
const COUNTRY_LANGUAGE_MAP = { 'IN': null, 'GB': null, 'US': 'es', 'NG': 'yo', 'KE': 'sw' };

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function callLLM(prompt, retries = 3) {
  for (const model of MODELS) {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1500, temperature: 0.4,
          }),
        });

        if (res.status === 429) {
          console.log(`     ⏳ Rate limited, waiting 6s...`);
          await delay(6000);
          continue;
        }
        
        if (!res.ok) {
          const errText = await res.text();
          if (attempt < retries - 1) {
            await delay(4000);
            continue;
          }
          break;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (content.length > 100) return content;
        
        await delay(2000);
      } catch (err) {
        if (attempt < retries - 1) {
          await delay(4000);
          continue;
        }
        break;
      }
    }
    console.log(`     Trying next model...`);
  }
  throw new Error('All models exhausted');
}

function getLocalLanguage(scheme) {
  if (scheme.local_language && scheme.local_language !== 'en') return scheme.local_language;
  if (scheme.country_code === 'IN') {
    const sc = scheme.state_code || scheme.state_region;
    if (sc && STATE_LANGUAGE_MAP[sc]) return STATE_LANGUAGE_MAP[sc];
    return 'hi';
  }
  return COUNTRY_LANGUAGE_MAP[scheme.country_code] || null;
}

async function main() {
  console.log('🚀 SchemeAtlas Content Generator (Groq LLaMA 3.3)');
  console.log('━'.repeat(55));
  
  // Fetch schemes without content
  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('*')
    .is('content_en', null)
    .eq('is_published', true)
    .limit(30);  // Larger batch on Groq
  
  if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }
  if (!schemes || schemes.length === 0) {
    console.log('✅ All schemes already have content!');
    process.exit(0);
  }
  
  console.log(`📋 Generating content for ${schemes.length} schemes.\n`);
  
  let success = 0, fail = 0;
  
  for (let i = 0; i < schemes.length; i++) {
    const scheme = schemes[i];
    const localLang = getLocalLanguage(scheme);
    const localName = localLang ? LANGUAGE_NAMES[localLang] : null;
    
    console.log(`[${i+1}/${schemes.length}] 📝 ${scheme.name}`);
    console.log(`   Country: ${scheme.country_code} | Local: ${localName || 'English only'}`);
    
    try {
      const eligStr = typeof scheme.eligibility === 'object' 
        ? JSON.stringify(scheme.eligibility) : scheme.eligibility || 'Not specified';
      
      const enPrompt = `Write a government scheme guide in Q&A format for citizens with these exact questions:
1. What is ${scheme.name}?
2. Who is eligible for ${scheme.name}?
3. How much benefit will you get?
4. How to apply for ${scheme.name}?
5. What documents are needed to apply?
6. When will you receive the benefit?
7. What is the last date to apply?
8. Is ${scheme.name} still available in 2025?

For each question write a clear answer in 2-4 sentences. Write for ordinary citizens in simple language. Keep total under 700 words. Be factual.

Scheme details:
Name: ${scheme.name}
Country: ${scheme.country_code}
Eligibility: ${eligStr}
Benefit: ${scheme.benefit_amount || 'Not specified'}
Category: ${scheme.category || 'Not specified'}`;

      console.log('   ⏳ Generating English...');
      const contentEn = await callLLM(enPrompt);
      
      if (!contentEn || contentEn.length < 200) {
        console.log(`   ⚠️ Too short (${contentEn?.length || 0} chars). Skipping.`);
        fail++;
        continue;
      }
      console.log(`   ✅ English: ${contentEn.length} chars`);
      
      let contentLocal = null;
      let contentHi = null;
      
      if (localLang && localLang !== 'en') {
        const langName = LANGUAGE_NAMES[localLang];
        console.log(`   ⏳ Translating to ${langName}...`);
        const translated = await callLLM(
          `Translate this Q&A guide to ${langName}. Keep numbers, amounts, dates, URLs unchanged. Keep question format:\n\n${contentEn}`
        );
        
        if (localLang === 'hi') {
          contentHi = translated;
        } else {
          contentLocal = translated;
        }
        console.log(`   ✅ ${langName}: ${translated?.length || 0} chars`);
      }
      
      const { error: upErr } = await supabase
        .from('schemes')
        .update({
          content_en: contentEn,
          content_hi: contentHi,
          content_local: contentLocal,
          local_language: localLang || null,
          last_updated: new Date().toISOString(),
        })
        .eq('id', scheme.id);
      
      if (upErr) {
        console.log(`   ❌ DB error: ${upErr.message}`);
        fail++;
      } else {
        console.log(`   ✅ Saved to database!`);
        success++;
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      fail++;
    }
    console.log('');
  }
  
  console.log('━'.repeat(55));
  console.log(`🏁 Batch done! Success: ${success} | Failed: ${fail}`);
}

main().catch(e => { console.error('💥', e); process.exit(1); });
