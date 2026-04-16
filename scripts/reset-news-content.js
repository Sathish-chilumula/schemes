/**
 * SchemeAtlas — Targeted Content Reset Utility
 * 
 * Marks only Civic News & Job entries for re-generation by the Master Pipeline.
 * Leaves 1400+ core schemes untouched.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE environment variables (URL or SERVICE_KEY).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TARGET_CATEGORIES = ['job', 'news', 'alert', 'budget'];

async function resetNewsContent() {
  console.log('🚀 Starting Targeted Content Reset...');
  console.log(`📂 Categories: ${TARGET_CATEGORIES.join(', ')}`);

  // First, count how many we are about to target
  const { count, error: countError } = await supabase
    .from('schemes')
    .select('*', { count: 'exact', head: true })
    .in('category', TARGET_CATEGORIES);

  if (countError) {
    console.error('❌ Error counting targets:', countError.message);
    return;
  }

  console.log(`📊 Found ${count} items to reset.`);

  if (count === 0) {
    console.log('✅ No items found in these categories. Nothing to reset.');
    return;
  }

  // Perform the update
  const { data, error } = await supabase
    .from('schemes')
    .update({ 
      is_seo_optimized: false, 
      content_en: null, 
      content_hi: null, 
      content_local: null 
    })
    .in('category', TARGET_CATEGORIES);

  if (error) {
    console.error('❌ Update failed:', error.message);
  } else {
    console.log(`✅ SUCCESS: ${count} items marked for regeneration.`);
    console.log('💡 You can now run "npm run agents:generate" to fill them with 14-point content.');
  }
}

resetNewsContent();
