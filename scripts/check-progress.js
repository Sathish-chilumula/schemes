/**
 * SchemeAtlas — Progress Tracking Utility
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkProgress() {
  console.log('📊 Checking Optimized Content Health...');

  // 1. Fully Optimized (All languages complete)
  const { count: fullyFixed, error: e1 } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true })
    .eq('is_seo_optimized', true);

  // 2. English Done, Missing Translations (Needs Gap-Filling)
  // We identify these by finding items where content_en exists but is_seo_optimized is false
  const { count: needsTranslation, error: e2 } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true })
    .eq('is_seo_optimized', false)
    .not('content_en', 'is', null);

  // 3. Totally Empty / News (Needs Full Rewrite)
  const { count: broken, error: e3 } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true })
    .eq('is_seo_optimized', false)
    .is('content_en', null);

  if (e1 || e2 || e3) {
    console.error('❌ Error fetching counts:', e1?.message || e2?.message || e3?.message);
    return;
  }

  const total = (fullyFixed || 0) + (needsTranslation || 0) + (broken || 0);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🏆 Fully Optimized:   ${fullyFixed} articles (EN + Native OK)`);
  console.log(`📝 Translation Only:  ${needsTranslation} articles (EN is safe)`);
  console.log(`⚠️ Empty / Broken:    ${broken} articles (Needs AI write)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (needsTranslation > 0 || broken > 0) {
    const totalRemaining = (needsTranslation || 0) + (broken || 0);
    const runsNeeded = Math.ceil(totalRemaining / 50);
    console.log(`💡 You have ${totalRemaining} total items to process.`);
    console.log(`🚀 Estimated ${runsNeeded} more Manual Bulk Runs to 100%.`);
  } else {
    console.log('🎊 All articles are successfully optimized and translated!');
  }
}

checkProgress();
