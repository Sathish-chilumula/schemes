const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

async function cleanupDuplicates() {
  console.log('Fetching schemes...');
  const { data: schemes, error } = await supabase
    .from('schemes')
    .select('id, name, slug, views, discovered_at, state_code, country_code')
    .order('views', { ascending: false });

  if (error) {
    console.error('Error fetching schemes:', error);
    return;
  }

  console.log(`Found ${schemes.length} schemes. Analyzing duplicates...`);

  const groups = {};
  schemes.forEach(scheme => {
    const key = normalizeName(scheme.name);
    if (!groups[key]) groups[key] = [];
    groups[key].push(scheme);
  });

  let totalDuplicates = 0;
  let totalFixed = 0;

  for (const key in groups) {
    const group = groups[key];
    if (group.length > 1) {
      // Sort by views (highest first) then by discovered_at (oldest first)
      const sorted = [...group].sort((a, b) => {
        if (b.views !== a.views) return b.views - a.views;
        return new Date(a.discovered_at) - new Date(b.discovered_at);
      });

      const original = sorted[0];
      const duplicates = sorted.slice(1);
      
      console.log(`\nDuplicate Group: "${original.name}"`);
      console.log(`- Original: ${original.slug} (${original.views} views)`);

      for (const duplicate of duplicates) {
        totalDuplicates++;
        console.log(`- Updating Duplicate: ${duplicate.slug} -> Canonical: ${original.slug}`);
        
        const { error: updateError } = await supabase
          .from('schemes')
          .update({
            canonical_slug: original.slug,
            // Keeping is_published: true as per user request to not hide/delete anything.
            // Redirection logic in [slug]/page.tsx will handle the 301 redirect.
            is_seo_optimized: false 
          })
          .eq('id', duplicate.id);

        if (updateError) {
          console.error(`  Failed to update ${duplicate.slug}:`, updateError.message);
        } else {
          totalFixed++;
        }
      }
    }
  }

  console.log(`\nCleanup Complete!`);
  console.log(`Total duplicates found: ${totalDuplicates}`);
  console.log(`Total successfully fixed: ${totalFixed}`);
}

cleanupDuplicates();
