const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../content/articles');
const draftsDir = path.join(__dirname, '../content/drafts');
const indexPath = path.join(__dirname, '../content/articles-index.json');

if (!fs.existsSync(draftsDir)) {
  fs.mkdirSync(draftsDir, { recursive: true });
}

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const validSlugs = new Set();
index.forEach(article => {
  validSlugs.add(article.slug);
  validSlugs.add(`${article.slug}-hi`);
  validSlugs.add(`${article.slug}-te`);
  validSlugs.add(`${article.slug}-kn`);
  validSlugs.add(`${article.slug}-mr`);
});

const files = fs.readdirSync(articlesDir);
let movedCount = 0;

for (const file of files) {
  if (!file.endsWith('.json')) continue;
  
  const slug = file.replace('.json', '');
  
  if (!validSlugs.has(slug)) {
    const oldPath = path.join(articlesDir, file);
    const newPath = path.join(draftsDir, file);
    fs.renameSync(oldPath, newPath);
    movedCount++;
    console.log(`Moved: ${file}`);
  }
}

console.log(`Successfully moved ${movedCount} unlisted articles to drafts.`);
