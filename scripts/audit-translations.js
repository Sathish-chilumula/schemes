/**
 * Audit script to check article translation status
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fetchAll(query) {
  const results = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await query.range(from, from + step - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...data);
    if (data.length < step) break;
    from += step;
  }
  return results;
}

async function main() {
  console.log('🔍 SchemeAtlas Translation Audit');
  console.log('━'.repeat(60));

  // Fetch all published schemes
  const schemes = await fetchAll(
    supabase.from('schemes')
      .select('id, name, slug, country_code, state_name, state_code, local_language, content_en, content_hi, content_local, category, is_published')
      .eq('is_published', true)
  );

  console.log(`\n📊 Total published schemes: ${schemes.length}\n`);

  // Country breakdown
  const byCountry = {};
  schemes.forEach(s => { byCountry[s.country_code] = (byCountry[s.country_code] || 0) + 1; });
  console.log('📦 By Country:');
  Object.entries(byCountry).forEach(([code, count]) => console.log(`   ${code}: ${count} schemes`));

  // Translation status
  const hasContentEn = schemes.filter(s => s.content_en && s.content_en.length > 0);
  const hasContentHi = schemes.filter(s => s.content_hi && s.content_hi.length > 0);
  const hasContentLocal = schemes.filter(s => s.content_local && s.content_local.length > 0);

  console.log(`\n📝 Content Status:`);
  console.log(`   content_en:    ${hasContentEn.length} / ${schemes.length} (${Math.round(hasContentEn.length/schemes.length*100)}%)`);
  console.log(`   content_hi:    ${hasContentHi.length} / ${schemes.length} (${Math.round(hasContentHi.length/schemes.length*100)}%)`);
  console.log(`   content_local: ${hasContentLocal.length} / ${schemes.length} (${Math.round(hasContentLocal.length/schemes.length*100)}%)`);

  // Missing English content
  const missingEn = schemes.filter(s => !s.content_en || s.content_en.length === 0);
  console.log(`\n❌ Missing content_en (${missingEn.length}):`);
  missingEn.slice(0, 20).forEach(s => console.log(`   - [${s.country_code}] ${s.name} (${s.slug})`));
  if (missingEn.length > 20) console.log(`   ... and ${missingEn.length - 20} more`);

  // Q&A format check - content_en exists but NOT in Q&A format
  const notQA = hasContentEn.filter(s => !(s.content_en.includes('Q:') && s.content_en.includes('A:')));
  console.log(`\n⚠️  Has content_en but NOT in Q&A format (${notQA.length}):`);
  notQA.slice(0, 20).forEach(s => console.log(`   - [${s.country_code}] ${s.name} | len: ${s.content_en.length} | preview: ${s.content_en.substring(0, 60).replace(/\n/g, ' ')}`));
  if (notQA.length > 20) console.log(`   ... and ${notQA.length - 20} more`);

  // Short/incomplete content_en
  const shortEn = hasContentEn.filter(s => s.content_en.length < 300);
  console.log(`\n⚠️  Short content_en (< 300 chars) (${shortEn.length}):`);
  shortEn.slice(0, 20).forEach(s => console.log(`   - [${s.country_code}] ${s.name} | len: ${s.content_en.length} | text: ${s.content_en.substring(0, 80).replace(/\n/g, ' ')}`));

  // Missing Hindi translation  
  const needsHi = hasContentEn.filter(s => s.country_code === 'IN' && (!s.content_hi || s.content_hi.length === 0));
  console.log(`\n🇮🇳 India schemes with content_en but missing content_hi (${needsHi.length}):`);
  needsHi.slice(0, 20).forEach(s => console.log(`   - ${s.name} (${s.slug}) | state: ${s.state_name || 'Central'}`));
  if (needsHi.length > 20) console.log(`   ... and ${needsHi.length - 20} more`);

  // Missing local language translation
  const needsLocal = hasContentEn.filter(s => s.local_language && s.local_language !== 'hi' && s.local_language !== 'en' && (!s.content_local || s.content_local.length === 0));
  console.log(`\n🌐 Has local_language set but missing content_local (${needsLocal.length}):`);
  needsLocal.slice(0, 20).forEach(s => console.log(`   - ${s.name} | lang: ${s.local_language} | state: ${s.state_name || 'N/A'}`));
  if (needsLocal.length > 20) console.log(`   ... and ${needsLocal.length - 20} more`);

  // Summary
  const allTranslated = hasContentEn.filter(s => {
    if (s.country_code === 'IN') {
      const hasHi = s.content_hi && s.content_hi.length > 0;
      const needsLocalLang = s.local_language && s.local_language !== 'hi' && s.local_language !== 'en';
      const hasLocalLang = s.content_local && s.content_local.length > 0;
      return hasHi && (!needsLocalLang || hasLocalLang);
    }
    return true;
  });

  console.log(`\n━━━━ SUMMARY ━━━━`);
  console.log(`Total published:        ${schemes.length}`);
  console.log(`Has English article:    ${hasContentEn.length} (${missingEn.length} missing)`);
  console.log(`In Q&A format:          ${hasContentEn.length - notQA.length} (${notQA.length} NOT in Q&A)`);
  console.log(`Has Hindi:              ${hasContentHi.length}`);
  console.log(`Has local language:     ${hasContentLocal.length}`);
  console.log(`Fully translated (IN):  ${allTranslated.length}`);
  console.log(`Needs Hindi (IN):       ${needsHi.length}`);
  console.log(`Needs local language:   ${needsLocal.length}`);
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
