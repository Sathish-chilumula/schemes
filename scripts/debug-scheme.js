const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findScheme() {
  console.log('🔍 Searching for "Revanth Reddy"...');
  
  const { data, error } = await supabase
    .from('schemes')
    .select('id, name, slug, country_code, state_code, local_language, content_en, content_hi, content_local, is_published')
    .or('name.ilike.%Revanth Reddy%,slug.ilike.%revanth-reddy%');

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ Scheme not found.');
  } else {
    data.forEach(s => {
      console.log('━'.repeat(50));
      console.log(`Name:   ${s.name}`);
      console.log(`Slug:   ${s.slug}`);
      console.log(`State:  ${s.state_code}`);
      console.log(`Lang:   ${s.local_language}`);
      console.log(`Pub:    ${s.is_published}`);
      console.log(`EN Len: ${s.content_en?.length || 0}`);
      console.log(`HI Len: ${s.content_hi?.length || 0}`);
      console.log(`TE Len: ${s.content_local?.length || 0}`);
      
      if (s.content_local) {
        console.log('\n--- TELUGU PREVIEW ---');
        console.log(s.content_local.substring(0, 200) + '...');
      } else {
        console.log('\n❌ Missing Telugu content (content_local)');
      }
    });
  }
}

findScheme();
