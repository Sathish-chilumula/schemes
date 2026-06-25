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

const patternsToRemove = [
  /Hey there,?[^!.]*[!.]\s*(👋)?\s*/gi,
  /Hey friend!?[^!.]*[!.]\s*(👋)?\s*/gi,
  /Unlock Your Financial Goals[^!.]*[!.]\s*(🔑)?\s*/gi,
  /Let['’]s dive in[!.]\s*/gi,
  /Let['’]s dive into what they are and how you can benefit from them[!.]\s*(🏦)?(💪)?\s*/gi,
  /Let['’]s explore these important yojanas together[!.]\s*(🏦)?\s*/gi,
  /Without further ado,? let['’]s get started[!.]\s*/gi,
  /This guide is your friendly companion,?[^!.]*[!.]\s*/gi,
  /So, what are you waiting for\?[^!.]*[!.]\s*/gi,
  /Let['’]s get you loan-ready[!.]\s*(🏦)?/gi,
  /Welcome to your ultimate guide[^!.]*[!.]\s*/gi,
  /buckle up[^!.]*[!.]\s*/gi,
  /This scheme is designed for those who truly need help\.?\s*/gi,
  /Use it wisely[!.]\s*/gi,
  /Are you looking for a [^"]*\? 🤑\s*/gi,
  /Look no further than[^"]*\. 🏥\s*/gi
];

async function cleanSchemes() {
  let offset = 0;
  const limit = 1000;
  let totalUpdated = 0;
  let totalFound = 0;

  while (true) {
    console.log(`Fetching schemes from offset ${offset}...`);
    let { data: schemes, error } = await supabase
      .from('schemes')
      .select('id, content_en')
      .not('content_en', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching schemes:', error);
      break;
    }

    if (schemes.length === 0) {
      break; // No more records
    }
    
    totalFound += schemes.length;
    console.log(`Processing batch of ${schemes.length} schemes...`);
    let updatedCount = 0;

    for (let scheme of schemes) {
      if (!scheme.content_en) continue;

      let contentStr = scheme.content_en;
      let originalStr = contentStr;
      let updated = false;

      // Sometimes content_en is stringified JSON, sometimes it's text.
      let isJson = false;
      let jsonContent;
      try {
        jsonContent = JSON.parse(contentStr);
        isJson = true;
      } catch (e) {
        // Not JSON
      }

      const cleanText = (text) => {
        if (typeof text !== 'string') return text;
        let newText = text;
        for (const pattern of patternsToRemove) {
          if (pattern.test(newText)) {
            pattern.lastIndex = 0; // reset
            newText = newText.replace(pattern, '');
          }
        }
        return newText;
      };

      if (isJson) {
        if (jsonContent.intro) {
            let clean = cleanText(jsonContent.intro);
            if (clean !== jsonContent.intro) { jsonContent.intro = clean; updated = true; }
        }
        
        if (jsonContent.sections && Array.isArray(jsonContent.sections)) {
          jsonContent.sections.forEach(section => {
            if (section.heading) {
                let clean = cleanText(section.heading);
                if (clean !== section.heading) { section.heading = clean; updated = true; }
            }
            if (section.content && typeof section.content === 'string') {
                let clean = cleanText(section.content);
                if (clean !== section.content) { section.content = clean; updated = true; }
            }
          });
        }

        if (jsonContent.tableOfContents && Array.isArray(jsonContent.tableOfContents)) {
            jsonContent.tableOfContents = jsonContent.tableOfContents.map(h => {
                let clean = cleanText(h);
                if (clean !== h) updated = true;
                return clean;
            });
        }

        if (updated) {
          contentStr = JSON.stringify(jsonContent);
        }
      } else {
        // Plain text cleanup
        contentStr = cleanText(contentStr);
        if (contentStr !== originalStr) {
          updated = true;
        }
      }

      if (updated) {
        const { error: updateError } = await supabase
          .from('schemes')
          .update({ content_en: contentStr })
          .eq('id', scheme.id);
        
        if (updateError) {
          console.error(`Failed to update scheme ${scheme.id}:`, updateError);
        } else {
          updatedCount++;
        }
      }
    }
    
    console.log(`Successfully cleaned ${updatedCount} schemes in this batch.`);
    totalUpdated += updatedCount;
    offset += limit;
  }

  console.log(`Finished processing. Total found: ${totalFound}. Total cleaned: ${totalUpdated}.`);
}

cleanSchemes();
