const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = fs.readdirSync(dir);
  for(let file of files) {
    let fullPath = path.join(dir, file);
    if(fs.statSync(fullPath).isDirectory()) walk(fullPath);
    else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      content = content.replace(/export\s+const\s+runtime\s*=\s*['"]edge['"];?\n?/g, '');
      content = content.replace(/export\s+const\s+revalidate\s*=\s*\d+;?\s*(\/\/[^\n]*)?\n?/g, '');
      if(content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

walk('app');
