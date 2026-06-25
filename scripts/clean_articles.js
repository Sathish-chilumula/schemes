const fs = require('fs');
const path = require('path');

const articlesDir = path.join(__dirname, '../content/articles');
const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.json'));

const patternsToRemove = [
  /Hey there,?[^!.]*[!.]\s*(👋)?\s*/gi,
  /Unlock Your Financial Goals[^!.]*[!.]\s*(🔑)?\s*/gi,
  /Let['’]s dive in[!.]\s*/gi,
  /Without further ado,? let['’]s get started[!.]\s*/gi,
  /This guide is your friendly companion,?[^!.]*[!.]\s*/gi,
  /So, what are you waiting for\?[^!.]*[!.]\s*/gi,
  /Let['’]s get you loan-ready[!.]\s*(🏦)?/gi,
  /Welcome to your ultimate guide[^!.]*[!.]\s*/gi,
  /buckle up[^!.]*[!.]\s*/gi
];

let filesUpdated = 0;

for (const file of files) {
  const filePath = path.join(articlesDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    let json = JSON.parse(content);
    let updated = false;
    
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

    if (json.intro) {
        let clean = cleanText(json.intro);
        if (clean !== json.intro) { json.intro = clean; updated = true; }
    }
    
    if (json.sections && Array.isArray(json.sections)) {
      json.sections.forEach(section => {
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

    if (json.tableOfContents && Array.isArray(json.tableOfContents)) {
        json.tableOfContents = json.tableOfContents.map(h => {
            let clean = cleanText(h);
            if (clean !== h) updated = true;
            return clean;
        });
    }

    if (updated) {
      const newContentStr = JSON.stringify(json, null, 2);
      fs.writeFileSync(filePath, newContentStr);
      filesUpdated++;
      console.log(`Updated ${file}`);
    }
  } catch (e) {
    console.error(`Error parsing ${file}:`, e.message);
  }
}

console.log(`Cleaned up ${filesUpdated} files.`);
