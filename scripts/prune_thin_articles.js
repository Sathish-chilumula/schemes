const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../content/articles');
const indexPath = path.join(__dirname, '../content/articles-index.json');

const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));
let keptFiles = [];
let deletedCount = 0;

console.log(`Analyzing ${files.length} articles...`);

files.forEach(file => {
  const filePath = path.join(articlesDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Calculate actual word count
    let wordCount = 0;
    
    // Intro
    if (data.intro) {
      if (typeof data.intro === 'string') {
        wordCount += data.intro.split(/\s+/).length;
      } else if (data.intro.content) {
        wordCount += data.intro.content.split(/\s+/).length;
      }
    }
    
    // Sections
    if (Array.isArray(data.sections)) {
      data.sections.forEach(s => {
        if (s && s.content && typeof s.content === 'string') {
          wordCount += s.content.split(/\s+/).length;
        }
      });
    }

    if (wordCount < 800) {
      console.log(`🗑️ Deleting ${file} (Word count: ${wordCount})`);
      fs.unlinkSync(filePath);
      deletedCount++;
    } else {
      console.log(`✅ Keeping ${file} (Word count: ${wordCount})`);
      keptFiles.push(data.slug);
    }
  } catch (err) {
    console.error(`Error processing ${file}:`, err);
  }
});

console.log(`\nDeleted ${deletedCount} thin articles. Kept ${keptFiles.length} articles.`);

// Update articles-index.json
try {
  if (fs.existsSync(indexPath)) {
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const updatedIndex = indexData.filter(item => keptFiles.includes(item.slug));
    fs.writeFileSync(indexPath, JSON.stringify(updatedIndex, null, 2));
    console.log(`Updated articles-index.json with ${updatedIndex.length} articles.`);
  }
} catch (err) {
  console.error('Error updating articles-index.json:', err);
}
