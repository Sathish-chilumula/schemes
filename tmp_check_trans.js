require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  const { data, error } = await supabase.from('schemes').select('id, name, state_code, state_name, local_language, content_en, content_hi, content_local, category').eq('is_published', true);
  if (error) { console.error('DB Error:', error.message); return; }
  
  let total = data.length;
  let missingEn = 0;
  let missingHi = 0;
  let missingLocal = 0;
  let stateStats = {};
  
  data.forEach(s => {
    let state = s.state_name || 'Central/All';
    if (!stateStats[state]) stateStats[state] = { total: 0, missingEn: 0, missingHi: 0, missingLocal: 0 };
    stateStats[state].total++;
    
    let needsEn = !s.content_en;
    let needsHi = !s.content_hi;
    let needsLocal = s.local_language && s.local_language !== 'hi' && s.local_language !== 'en' && !s.content_local;
    
    if (needsEn) { missingEn++; stateStats[state].missingEn++; }
    if (needsHi) { missingHi++; stateStats[state].missingHi++; }
    if (needsLocal) { missingLocal++; stateStats[state].missingLocal++; }
  });
  
  console.log('--- TRANSLATION STATUS ---');
  console.log('Total Published Items:', total);
  console.log('Missing English Content:', missingEn);
  console.log('Missing Hindi Translation:', missingHi);
  console.log('Missing Local Language Translation:', missingLocal);
  console.log('\n--- BREAKDOWN BY REGION ---');
  Object.keys(stateStats).forEach(k => {
    const st = stateStats[k];
    console.log(`${k}: ${st.total} total | Missing En: ${st.missingEn} | Missing Hi: ${st.missingHi} | Missing Local: ${st.missingLocal}`);
  });
}

run();
