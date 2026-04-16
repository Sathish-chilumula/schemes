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

async function resetIncompleteContent() {
  console.log('🚀 Starting Surgical Content Reset...');
  
  // High-precision filter: 
  // 1. Items in news/job categories (usually created by the civic pipeline)
  // 2. OR any item where English, Hindi, or Local content is missing
  const { data: targets, error: fetchError } = await supabase
    .from('schemes')
    .select('id, name, category, content_en')
    .or(`category.in.(${TARGET_CATEGORIES.join(',')}),content_en.is.null,content_hi.is.null,content_local.is.null`);

  if (fetchError) {
    console.error('❌ Error identifying targets:', fetchError.message);
    return;
  }

  const count = targets?.length || 0;
  console.log(`📊 Identified ${count} articles that are incomplete or from News/Jobs pipeline.`);

  if (count === 0) {
    console.log('✅ No incomplete articles found. Everything is healthy!');
    return;
  }

  // Perform the update
  const targetIds = targets.map(t => t.id);
  const { error } = await supabase
    .from('schemes')
    .update({ 
      is_seo_optimized: false, 
      // We clear them so the Master Pipeline has a clean slate to write 14-points
      content_en: null, 
      content_hi: null, 
      content_local: null,
      last_enriched_at: null 
    })
    .in('id', targetIds);

  if (error) {
    console.error('❌ Update failed:', error.message);
  } else {
    console.log(`✅ SUCCESS: ${count} items identified and reset.`);
    console.log('💡 They will now be picked up by the Master Automation Pipeline.');
  }
}

resetIncompleteContent();
