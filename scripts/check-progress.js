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
  console.log('📊 Checking Content Generation Progress...');

  // Count Optimized
  const { count: completed, error: e1 } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true })
    .eq('is_seo_optimized', true);

  // Count Remaining
  const { count: remaining, error: e2 } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true })
    .eq('is_seo_optimized', false);

  if (e1 || e2) {
    console.error('❌ Error fetching counts:', e1?.message || e2?.message);
    return;
  }

  const total = (completed || 0) + (remaining || 0);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Completed:  ${completed} articles (14-point SEO)`);
  console.log(`⏳ Remaining:  ${remaining} articles (Need processing)`);
  console.log(`📈 Progress:   ${percent}%`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (remaining > 0) {
    const runsNeeded = Math.ceil(remaining / 50);
    console.log(`💡 You need roughly ${runsNeeded} more manual bulk runs to finish.`);
  } else {
    console.log('🎊 All articles are successfully optimized!');
  }
}

checkProgress();
