const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
// Fallback to .env if .env.local doesn't exist
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config();
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateArticles() {
  console.log('Fetching existing categories from Supabase...');
  const { data: categories, error: catError } = await supabase.from('categories').select('id, name');
  
  if (catError) {
    console.error('Error fetching categories:', catError);
    process.exit(1);
  }

  const categoryMap = {};
  categories.forEach(c => {
    categoryMap[c.name.toLowerCase()] = c.id;
  });

  const indexPath = path.join(__dirname, 'content', 'articles-index.json');
  if (!fs.existsSync(indexPath)) {
    console.error(`Index file not found at ${indexPath}`);
    process.exit(1);
  }

  const articlesIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  console.log(`Found ${articlesIndex.length} articles in index. Migrating...`);

  let count = 0;

  for (const article of articlesIndex) {
    const slug = article.slug;
    const mdPath = path.join(__dirname, 'content', 'articles', `${slug}.md`);
    let content = '';

    if (fs.existsSync(mdPath)) {
      content = fs.readFileSync(mdPath, 'utf-8');
    } else {
      console.warn(`Warning: Markdown file not found for ${slug}`);
    }

    const categoryId = categoryMap[article.category.toLowerCase()] || null;

    const payload = {
      title: article.title,
      slug: slug,
      content: content,
      excerpt: article.desc || '',
      category_id: categoryId,
      status: 'published',
      published_at: new Date(article.publishedAt).toISOString(),
      author_name: 'SchemeAtlas Editorial',
      meta_title: article.title,
      meta_description: article.desc || '',
    };

    const { error } = await supabase
      .from('articles')
      .upsert(payload, { onConflict: 'slug' });

    if (error) {
      console.error(`Failed to migrate ${slug}:`, error.message);
    } else {
      console.log(`✓ Migrated: ${slug}`);
      count++;
    }
  }

  console.log(`\nMigration complete. Successfully imported ${count} articles.`);
}

migrateArticles();
