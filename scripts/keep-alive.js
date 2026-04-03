/**
 * Supabase Keep-Alive Script
 * Prevents free-tier Supabase projects from auto-pausing due to inactivity.
 * Runs via GitHub Actions every 3 days.
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function keepAlive() {
  try {
    const { count, error } = await supabase
      .from('schemes')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Keep-alive query failed:', error.message);
      process.exit(1);
    }

    console.log(`✅ Supabase keep-alive ping successful. Total schemes: ${count}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Keep-alive error:', err.message);
    process.exit(1);
  }
}

keepAlive();
