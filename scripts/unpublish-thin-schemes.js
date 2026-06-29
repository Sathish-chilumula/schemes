const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const robotsPath = path.join(__dirname, '../public/robots.txt');
  const robotsTxt = fs.readFileSync(robotsPath, 'utf8');
  
  const lines = robotsTxt.split('\n');
  const slugsToUnpublish = [];

  for (const line of lines) {
    if (line.startsWith('Disallow: /schemes/')) {
      const slug = line.replace('Disallow: /schemes/', '').trim();
      if (slug && !slug.includes('?')) {
        slugsToUnpublish.push(slug);
      }
    }
  }

  console.log(`Found ${slugsToUnpublish.length} schemes to unpublish.`);

  if (slugsToUnpublish.length === 0) {
    console.log("No schemes to unpublish.");
    return;
  }

  // Update in batches
  const batchSize = 50;
  for (let i = 0; i < slugsToUnpublish.length; i += batchSize) {
    const batch = slugsToUnpublish.slice(i, i + batchSize);
    console.log(`Unpublishing batch ${i / batchSize + 1}...`);
    
    const { data, error } = await supabase
      .from('schemes')
      .update({ is_published: false })
      .in('slug', batch);

    if (error) {
      console.error(`❌ Error updating batch: ${error.message}`);
    } else {
      console.log(`✅ Successfully unpublished batch.`);
    }
  }

  console.log("Finished unpublishing thin schemes.");
}

main().catch(console.error);
