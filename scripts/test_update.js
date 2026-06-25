const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envLocal = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => {
  const match = envLocal.match(new RegExp(`${key}=(.*)`));
  return match ? match[1] : null;
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
  const { data: schemes, error: fetchError } = await supabase
    .from('schemes')
    .select('id, content_en')
    .ilike('content_en', '%This scheme is designed for those who truly need help%')
    .limit(1);

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }

  if (schemes.length === 0) {
    console.log('No schemes found to update');
    return;
  }

  const scheme = schemes[0];
  let newContent = scheme.content_en.replace('This scheme is designed for those who truly need help', '');

  const { data, error } = await supabase
    .from('schemes')
    .update({ content_en: newContent })
    .eq('id', scheme.id)
    .select();

  if (error) {
    console.error('Update failed. RLS might be enabled:', error);
  } else {
    console.log('Update successful! Anon key has write access.', data);
  }
}

testUpdate();
