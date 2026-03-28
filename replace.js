import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory && !['node_modules', '.git', '.next', '.gemini'].includes(f)) {
      walkDir(dirPath, callback);
    } else if (!isDirectory) {
      callback(path.join(dir, f));
    }
  });
}

function replaceInFiles() {
  let count = 0;
  walkDir('.', (filePath) => {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts') && !filePath.endsWith('.js') && !filePath.endsWith('.md')) return;
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('SchemeAtlas') || content.includes('schemeatlas')) {
        let newContent = content
          .replace(/SchemeAtlas/g, 'SchemeAtlas')
          .replace(/schemeatlas/g, 'schemeatlas');
        fs.writeFileSync(filePath, newContent, 'utf8');
        count++;
      }
    } catch (e) {
      console.error('Failed to process', filePath, e);
    }
  });
  console.log(`Replaced in ${count} files.`);
}

replaceInFiles();
