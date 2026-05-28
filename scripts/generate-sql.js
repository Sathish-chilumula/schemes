const fs = require('fs');

const articles = JSON.parse(fs.readFileSync('content/articles-index.json', 'utf8'));

let sql = '';
for (const article of articles) {
  const content = fs.existsSync('content/articles/' + article.slug + '.md') 
    ? fs.readFileSync('content/articles/' + article.slug + '.md', 'utf8') 
    : '';
  
  const title = article.title.replace(/'/g, "''");
  const slug = article.slug.replace(/'/g, "''");
  const cat = article.category.replace(/'/g, "''");
  const excerpt = (article.desc || '').replace(/'/g, "''");
  const safeContent = content.replace(/'/g, "''");
  
  sql += `
    INSERT INTO public.articles (title, slug, content, excerpt, status, published_at, category_id)
    VALUES (
      '${title}', 
      '${slug}', 
      '${safeContent}', 
      '${excerpt}', 
      'published', 
      '${article.publishedAt}',
      (SELECT id FROM public.categories WHERE name = '${cat}' LIMIT 1)
    ) ON CONFLICT (slug) DO NOTHING;
  `;
}
fs.writeFileSync('scripts/seed-articles.sql', sql);
console.log('SQL generated successfully.');
