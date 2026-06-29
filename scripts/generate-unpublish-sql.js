const fs = require('fs');
const path = require('path');

const robotsPath = path.join(__dirname, '../public/robots.txt');
const robotsTxt = fs.readFileSync(robotsPath, 'utf8');

const lines = robotsTxt.split('\n');
const slugsToUnpublish = [];

for (const line of lines) {
  if (line.startsWith('Disallow: /schemes/')) {
    const slug = line.replace('Disallow: /schemes/', '').trim();
    if (slug && !slug.includes('?')) {
      slugsToUnpublish.push(`'${slug}'`);
    }
  }
}

const sql = `UPDATE schemes SET is_published = false WHERE slug IN (${slugsToUnpublish.join(', ')});`;
fs.writeFileSync(path.join(__dirname, 'unpublish.sql'), sql);
console.log('SQL written to unpublish.sql');
