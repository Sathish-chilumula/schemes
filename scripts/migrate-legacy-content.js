const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing required environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseLegacyContent(raw, scheme) {
  if (!raw || raw.startsWith('{')) return raw;

  const LABELS = [
    'title', 'summary', 'what is the scheme', 'key benefits',
    'eligibility criteria', 'who should apply', 'who should not apply',
    'documents required', 'required documents', 'selection',
    'approval process', 'how to apply', 'important dates',
    'official website', 'application', 'pro tips', 'insights', 'faqs',
    'frequently asked questions', 'शीर्षक', 'सारांश', 'శీర్షిక', 'సారాంశం'
  ];

  const lines = raw.split(/\n+/);
  const sections = [];
  let current = { heading: '', body: '' };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0 && colonIdx < 60) {
      const potentialLabel = trimmed.substring(0, colonIdx).toLowerCase().trim();
      const isKnownLabel = LABELS.some(l => potentialLabel.includes(l));
      if (isKnownLabel) {
        if (current.body.trim()) sections.push({ ...current });
        current = {
          heading: trimmed.substring(0, colonIdx).trim(),
          body: trimmed.substring(colonIdx + 1).trim(),
        };
        continue;
      }
    }
    if (trimmed.match(/^Q\./i) || trimmed.match(/^##\s*Q\./i)) {
      if (current.body.trim()) sections.push({ ...current });
      current = { heading: 'Q', body: trimmed.replace(/^(##\s*)?Q\./i, '').trim() };
      continue;
    }
    current.body += (current.body ? '\n' : '') + trimmed;
  }
  if (current.body.trim()) sections.push({ ...current });

  let intro = '';
  const finalSections = [];
  const faqs = [];

  for (const s of sections) {
    if (s.body.trim().length < 15) continue;
    let h = s.heading.toLowerCase();
    
    if (h === 'title' || h === 'शीर्षक' || h === 'శీర్షిక') continue;
    
    if (h === 'summary' || h === 'सारांश' || h === 'సారాంశం') {
      intro += (intro ? '\n\n' : '') + s.body.trim();
      continue;
    }

    if (h === 'q' || h.includes('faq')) {
      const parts = s.body.split(/A\.|Answer:?/i);
      faqs.push({
        q: parts[0]?.trim() || s.heading,
        a: parts[1]?.trim() || s.body.trim()
      });
      continue;
    }

    let cleanHeading = s.heading;
    const lower = cleanHeading.toLowerCase();
    if (lower.includes('what is the scheme')) cleanHeading = 'About This Scheme';
    else if (lower.includes('pro tips') || lower.includes('insights')) cleanHeading = 'Expert Tips';
    
    cleanHeading = cleanHeading.replace(/\*+/g, '').trim();
    finalSections.push({ heading: cleanHeading, content: s.body.trim() });
  }

  const structured = {
    slug: scheme.slug,
    title: scheme.name,
    metaTitle: scheme.name,
    metaDescription: scheme.what_you_get || '',
    category: scheme.category || '',
    intro: intro || (scheme.what_you_get || ''),
    sections: finalSections,
    faqs: faqs,
    relatedSchemes: [],
    relatedArticles: [],
    tags: scheme.target_group || []
  };

  return JSON.stringify(structured);
}

async function main() {
  console.log('Fetching legacy schemes...');
  
  let allSchemes = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data: schemes, error } = await supabase
      .from('schemes')
      .select('id, slug, name, category, what_you_get, target_group, content_en, content_hi, content_local')
      .eq('is_published', true)
      .range(page * 100, (page + 1) * 100 - 1);
      
    if (error) throw error;
    if (schemes.length === 0) {
      hasMore = false;
    } else {
      allSchemes = allSchemes.concat(schemes);
      page++;
    }
  }

  const legacySchemes = allSchemes.filter(s => {
    return (s.content_en && !s.content_en.startsWith('{')) ||
           (s.content_hi && !s.content_hi.startsWith('{')) ||
           (s.content_local && !s.content_local.startsWith('{'));
  });

  console.log(`Found ${legacySchemes.length} schemes with legacy content.`);

  let sqlFile = '';
  
  for (const scheme of legacySchemes) {
    let updateFields = [];
    
    if (scheme.content_en && !scheme.content_en.startsWith('{')) {
      const escaped = parseLegacyContent(scheme.content_en, scheme).replace(/'/g, "''");
      updateFields.push(`content_en = '${escaped}'`);
    }
    if (scheme.content_hi && !scheme.content_hi.startsWith('{')) {
      const escaped = parseLegacyContent(scheme.content_hi, scheme).replace(/'/g, "''");
      updateFields.push(`content_hi = '${escaped}'`);
    }
    if (scheme.content_local && !scheme.content_local.startsWith('{')) {
      const escaped = parseLegacyContent(scheme.content_local, scheme).replace(/'/g, "''");
      updateFields.push(`content_local = '${escaped}'`);
    }
    
    if (updateFields.length > 0) {
      sqlFile += `UPDATE schemes SET ${updateFields.join(', ')} WHERE id = '${scheme.id}';\n`;
    }
  }

  fs.writeFileSync(path.join(__dirname, 'updates.sql'), sqlFile);
  console.log('Migration SQL generated to updates.sql.');
}

main().catch(console.error);
