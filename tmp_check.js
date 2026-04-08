const fs = require('fs');
let envs = fs.readFileSync('.env', 'utf-8').split('\n');
let urlLine = envs.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=') || l.startsWith('SUPABASE_URL='));
let keyLine = envs.find(l => l.startsWith('SUPABASE_SERVICE_KEY='));
let url = urlLine.split('=')[1].trim().replace(/"/g, '');
let key = keyLine.split('=')[1].trim().replace(/"/g, '');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('schemes').select('id, name, state_code, state_name, local_language, content_en, content_hi, content_local, category').eq('is_published', true);
  if (error) { console.error('DB Error:', error.message); return; }
  
  let total = data.length;
  let missingHi = 0;
  let missingLocal = 0;
  
  let statesCount = {};
  
  data.forEach(s => {
    let needsHi = !s.content_hi;
    let needsLocal = s.local_language && s.local_language !== 'hi' && s.local_language !== 'en' && !s.content_local;
    if (needsHi) missingHi++;
    if (needsLocal) missingLocal++;
    
    let st = s.state_name || 'Central';
    if (!statesCount[st]) statesCount[st] = { total: 0, missingHi: 0, missingLocal: 0 };
    statesCount[st].total++;
    if (needsHi) statesCount[st].missingHi++;
    if (needsLocal) statesCount[st].missingLocal++;
  });
  
  console.log('--- TRANSLATION STATUS ---');
  console.log('Total Published Items:', total);
  console.log('Missing Hindi Translation:', missingHi);
  console.log('Missing Local Language Translation:', missingLocal);
  
  console.log('\\n--- BY REGION ---');
  Object.keys(statesCount).forEach(k => {
     let c = statesCount[k];
     console.log(`\${k}: \${c.total} total | Missing Hi: \${c.missingHi} | Missing Local: \${c.missingLocal}`);
  });
}
run();
