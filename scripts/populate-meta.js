const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// We use the ANON key but since we are inserting metadata we might be blocked by RLS if we don't have authenticated access.
// Wait, the MCP tool disabled RLS for update? No, we didn't disable it. 
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function populateMeta() {
  const articles = JSON.parse(fs.readFileSync('content/articles-index.json', 'utf8'));
  for (const article of articles) {
    const filePath = 'content/articles/' + article.slug + '.json';
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const meta = {
      faqs: data.faqs || [],
      relatedSchemes: data.relatedSchemes || [],
      relatedArticles: data.relatedArticles || [],
      tableOfContents: data.tableOfContents || [],
      keywords: data.keywords || [],
      readTime: data.readTime || article.readTime || ''
    };

    console.log(`Updating meta for: ${article.slug}`);
    const { error } = await supabase
      .from('articles')
      .update({ meta })
      .eq('slug', article.slug);
    
    if (error) console.error('Error updating:', article.slug, error);
  }
  console.log('Meta population complete.');
}

populateMeta();
