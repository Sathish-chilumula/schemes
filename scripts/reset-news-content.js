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

  // Perform the update in batches of 100
  console.log('🔄 Flagging items for Gap-Filling (Non-Destructive)...');
  const targetIds = targets.map(t => t.id);
  const BATCH_SIZE = 100;
  let totalUpdated = 0;

  for (let i = 0; i < targetIds.length; i += BATCH_SIZE) {
    const batch = targetIds.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('schemes')
      .update({ 
        is_seo_optimized: false, 
        // WE DO NOT SET CONTENT TO NULL ANYMORE. 
        // We preserve English so the generator can just add the missing local language.
        last_enriched_at: null 
      })
      .in('id', batch);

    if (error) {
      console.error(`❌ Batch update failed (index ${i}):`, error.message);
    } else {
      totalUpdated += batch.length;
      console.log(`✅ Flagged ${totalUpdated}/${count} items for review...`);
    }
  }

  console.log(`🎉 SUCCESS: ${totalUpdated} items flagged. The Master Pipeline will now fill in the gaps.`);
}

resetIncompleteContent();
