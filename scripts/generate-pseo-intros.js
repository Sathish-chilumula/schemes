const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) {
  console.error("❌ Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Full 2026 Indian State Taxonomy
const STATES = [
  { code: 'AP', name: 'Andhra Pradesh' }, { code: 'AR', name: 'Arunachal Pradesh' }, { code: 'AS', name: 'Assam' },
  { code: 'BR', name: 'Bihar' }, { code: 'CG', name: 'Chhattisgarh' }, { code: 'GA', name: 'Goa' },
  { code: 'GJ', name: 'Gujarat' }, { code: 'HR', name: 'Haryana' }, { code: 'HP', name: 'Himachal Pradesh' },
  { code: 'JH', name: 'Jharkhand' }, { code: 'KA', name: 'Karnataka' }, { code: 'KL', name: 'Kerala' },
  { code: 'MP', name: 'Madhya Pradesh' }, { code: 'MH', name: 'Maharashtra' }, { code: 'MN', name: 'Manipur' },
  { code: 'ML', name: 'Meghalaya' }, { code: 'MZ', name: 'Mizoram' }, { code: 'NL', name: 'Nagaland' },
  { code: 'OR', name: 'Odisha' }, { code: 'PB', name: 'Punjab' }, { code: 'RJ', name: 'Rajasthan' },
  { code: 'SK', name: 'Sikkim' }, { code: 'TN', name: 'Tamil Nadu' }, { code: 'TS', name: 'Telangana' },
  { code: 'TR', name: 'Tripura' }, { code: 'UP', name: 'Uttar Pradesh' }, { code: 'UK', name: 'Uttarakhand' },
  { code: 'WB', name: 'West Bengal' }, { code: 'DL', name: 'Delhi' }, { code: 'JK', name: 'Jammu & Kashmir' },
];

const CATEGORIES = ['cash', 'housing', 'health', 'education', 'agriculture', 'women', 'elderly', 'disability', 'business'];

const CURRENT_YEAR = new Date().getFullYear();

async function generateIntro(state, category, retryCount = 0) {
  const prompt = `Write a high-quality, unique SEO introduction (150-250 words) for a webpage titled "Government ${category} Schemes in ${state} ${CURRENT_YEAR}".

Rules:
1. Focus specifically on ${category} benefits available for residents of ${state}.
2. Mention that these are current for ${CURRENT_YEAR} and include both state and central aid.
3. Tone: Expert, helpful, and authoritative (SEO standard).
4. Readability: 8th grade.
5. Content must be unique, non-repetitive, and useful.
6. INCLUDE: "Last Updated: ${new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}".

Structure:
- Heading: Why ${category} schemes are vital in ${state}
- 2-3 detailed paragraphs explaining the landscape and impact.`;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = res.choices[0].message.content.trim();
    const wordCount = content.split(/\s+/).length;

    if (wordCount < 150 && retryCount < 2) {
      console.log(`      ⚠️ Length too short (${wordCount} words). Retrying (${retryCount + 1}/2)...`);
      return generateIntro(state, category, retryCount + 1);
    }
    return content;
  } catch (err) {
    if (retryCount < 2) {
      console.log(`      ⚠️ LLM Error: ${err.message}. Retrying (${retryCount + 1}/2)...`);
      await new Promise(r => setTimeout(r, 5000));
      return generateIntro(state, category, retryCount + 1);
    }
    throw err;
  }
}

async function main() {
  const stats = { total: 0, generated: 0, skipped: 0, failed: 0 };
  
  console.log(`\n🚀 PSEO Batch Generation Starting - ${CURRENT_YEAR}`);
  console.log('━'.repeat(60));

  const combinations = [];
  for (const s of STATES) {
    for (const c of CATEGORIES) {
      combinations.push({ state: s, category: c });
    }
  }

  stats.total = combinations.length;
  console.log(`📋 Total combinations to process: ${stats.total}`);

  for (const item of combinations) {
    const { state, category } = item;
    
    try {
      // 1. Quality Check on Existing
      const { data: existing } = await supabase
        .from('pseo_content')
        .select('*')
        .eq('state_code', state.code)
        .eq('category', category)
        .single();

      if (existing && existing.intro_content && existing.intro_content.split(/\s+/).length >= 150) {
        stats.skipped++;
        continue;
      }

      const statusMsg = existing ? '⚠️ Regenerating low-quality content' : '💎 Generating new content';
      console.log(`   ${statusMsg}: ${state.name} > ${category}...`);
      
      const content = await generateIntro(state.name, category);
      
      // 2. Upsert into Database
      const { error } = await supabase
        .from('pseo_content')
        .upsert({
          state_code: state.code,
          category: category,
          intro_content: content,
          last_updated: new Date().toISOString()
        }, { onConflict: 'state_code,category' });

      if (error) throw error;
      
      stats.generated++;
      console.log(`      ✅ Success (${stats.generated + stats.skipped}/${stats.total})`);
      
      // Delay to avoid OpenAI rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      stats.failed++;
      console.error(`   ❌ Failed: ${state.name} > ${category}:`, err.message);
    }
  }

  console.log('\n🏁 Batch Processing Complete.');
  console.log(`📊 Stats: Total: ${stats.total} | Generated: ${stats.generated} | Skipped: ${stats.skipped} | Failed: ${stats.failed}`);
  console.log('━'.repeat(60));
}

main().catch(console.error);
