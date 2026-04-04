const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const PATTERNS_TO_REMOVE = [
  /\(April 2026 Update\)/gi,
  /April 2026 Update/gi,
  /April 2026/gi,
  /Last Updated: \w+ 202\d/gi,
  /Last Updated: 202\d/gi,
  /in 2025/gi,
  /for 2026/gi,
  / (2026)/g,
  / (2025)/g,
];

async function cleanup() {
  console.log('🚀 Starting Database Date Cleanup...');
  
  let count = 0;
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data: schemes, error } = await supabase
      .from('schemes')
      .select('id, name, content_en, content_hi, content_local, what_you_get')
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ Fetch error:', error);
      break;
    }

    if (!schemes || schemes.length === 0) break;

    for (const scheme of schemes) {
      let needsUpdate = false;
      const updated = { ...scheme };

      ['name', 'content_en', 'content_hi', 'content_local', 'what_you_get'].forEach(field => {
        if (updated[field]) {
          let original = updated[field];
          let cleaned = original;
          
          PATTERNS_TO_REMOVE.forEach(regex => {
            cleaned = cleaned.replace(regex, '');
          });

          // Also clean up double spaces and trailing punctuation that might result from removal
          cleaned = cleaned.replace(/\s\s+/g, ' ').replace(/\(\s*\)/g, '').trim();

          if (cleaned !== original) {
            updated[field] = cleaned;
            needsUpdate = true;
          }
        }
      });

      if (needsUpdate) {
        const { error: upErr } = await supabase
          .from('schemes')
          .update({
            name: updated.name,
            content_en: updated.content_en,
            content_hi: updated.content_hi,
            content_local: updated.content_local,
            what_you_get: updated.what_you_get
          })
          .eq('id', scheme.id);

        if (upErr) {
          console.error(`   ❌ Failed to update ${scheme.id}:`, upErr.message);
        } else {
          console.log(`   ✅ Cleaned: ${scheme.name}`);
          count++;
        }
      }
    }

    offset += limit;
    console.log(`Processed ${offset} records...`);
  }

  console.log(`\n🏁 Cleanup complete. Total records updated: ${count}`);
}

cleanup().catch(console.error);
