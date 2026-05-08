require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

supabase.from('schemes')
  .select('id, name, slug, category, country_code, what_you_get, benefit_amount, scheme_type, views, target_group, image_url, state_code, state_codes, is_central')
  .eq('is_published', true)
  .order('discovered_at', { ascending: false })
  .limit(2)
  .then(res => {
    console.log(JSON.stringify(res, null, 2));
  })
  .catch(e => {
    console.error(e);
  });