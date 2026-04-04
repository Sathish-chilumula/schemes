const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'placeholder-key'
);

async function test() {
  const { count, error } = await supabaseAdmin
    .from('schemes')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);
    
  console.log('Total published schemes:', count);
  console.log('Error:', error);
}

test();
