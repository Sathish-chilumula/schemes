const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpdate() {
  const { data, error } = await supabase
    .from('schemes')
    .update({ views: 100 })
    .eq('slug', 'pm-mudra-loan')
    .select();
    
  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Update succeeded:", data);
  }
}
testUpdate();
