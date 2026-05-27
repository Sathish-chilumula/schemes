var XLSX = require('xlsx');

var fileMap = [
  { label: 'ISSUE 1: Alternate page with proper canonical (710 pages)', file: 'schemeatlas.com-Coverage-Drilldown-2026-05-27.xlsx' },
  { label: 'ISSUE 2: Blocked by robots.txt (484 pages)', file: 'schemeatlas.com-Coverage-Drilldown-2026-05-27 (1).xlsx' },
  { label: 'ISSUE 3: Duplicate / Crawled not indexed (87 pages)', file: 'schemeatlas.com-Coverage-Drilldown-2026-05-27 (2).xlsx' }
];

fileMap.forEach(function(item) {
  var wb = XLSX.readFile(item.file);
  
  // Use the "Table" sheet
  var sheetName = wb.SheetNames.find(function(s){ return s.toLowerCase() === 'table'; }) || wb.SheetNames[0];
  var ws = wb.Sheets[sheetName];
  var raw = XLSX.utils.sheet_to_json(ws, {header:1, raw:true});

  console.log('\n========================================');
  console.log(item.label);
  console.log('========================================');
  console.log('Sheet: ' + sheetName + ' | Rows: ' + raw.length);
  console.log('Header: ' + JSON.stringify(raw[0]));

  // Extract unique URLs from col 0
  var seen = {};
  var urls = [];
  raw.slice(1).forEach(function(row) {
    var url = String(row[0] || '').trim();
    if (url && url.startsWith('http') && !seen[url]) {
      seen[url] = true;
      urls.push(url);
    }
  });

  console.log('Unique URLs: ' + urls.length);

  // Pattern analysis
  var patterns = {};
  var queryParams = {};

  urls.forEach(function(url) {
    var path = url.replace('https://schemeatlas.com', '');
    var hasQuery = path.includes('?');
    var queryPart = hasQuery ? path.split('?')[1] : '';
    var cleanPath = hasQuery ? path.split('?')[0] : path;
    
    // Track query params
    if (queryPart) {
      queryPart.split('&').forEach(function(q) {
        var key = q.split('=')[0];
        queryParams[key] = (queryParams[key] || 0) + 1;
      });
    }
    
    // Categorize
    var pattern;
    if (cleanPath.startsWith('/schemes/') && hasQuery) {
      var langMatch = url.match(/lang=([a-z]+)/);
      pattern = '/schemes/[slug]?lang=' + (langMatch ? langMatch[1] : 'X');
    } else if (cleanPath.startsWith('/schemes/') && cleanPath.endsWith('-in')) {
      pattern = '/schemes/[slug]-in  (country suffix)';
    } else if (cleanPath.startsWith('/schemes/') && cleanPath.endsWith('-gb')) {
      pattern = '/schemes/[slug]-gb  (GB country)';
    } else if (cleanPath.startsWith('/schemes/') && cleanPath.endsWith('-ng')) {
      pattern = '/schemes/[slug]-ng  (Nigeria)';
    } else if (cleanPath.startsWith('/schemes/') && cleanPath.endsWith('-ke')) {
      pattern = '/schemes/[slug]-ke  (Kenya)';
    } else if (cleanPath.startsWith('/schemes/')) {
      pattern = '/schemes/[slug]  (plain)';
    } else if (cleanPath.startsWith('/in/') && hasQuery) {
      pattern = '/in/[state]?category=X';
    } else if (cleanPath.startsWith('/in/')) {
      pattern = '/in/[state]';
    } else if (cleanPath.startsWith('/articles/') && hasQuery) {
      pattern = '/articles/[slug]?lang=X';
    } else if (cleanPath.startsWith('/articles/') && !hasQuery) {
      var paramCheck = url.match(/\?category=/);
      pattern = paramCheck ? '/articles?category=X' : '/articles/[slug]';
    } else if (cleanPath === '/schemes' || cleanPath.startsWith('/schemes?')) {
      pattern = '/schemes?category=X  (filtered listing)';
    } else if (cleanPath === '/articles' || cleanPath.startsWith('/articles?')) {
      pattern = '/articles?category=X  (filtered listing)';
    } else {
      pattern = cleanPath.substring(0, 60);
    }
    
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  });

  console.log('\nURL PATTERNS (sorted by frequency):');
  Object.keys(patterns).sort(function(a,b){return patterns[b]-patterns[a];}).forEach(function(p) {
    console.log('  ' + patterns[p].toString().padStart(4) + 'x  ' + p);
  });

  if (Object.keys(queryParams).length > 0) {
    console.log('\nQuery params found:');
    Object.keys(queryParams).forEach(function(q) {
      console.log('  ?' + q + '  (' + queryParams[q] + ' URLs)');
    });
  }

  console.log('\nFirst 30 sample URLs:');
  urls.slice(0, 30).forEach(function(u) { console.log('  ' + u); });
  if (urls.length > 30) {
    console.log('  ... +' + (urls.length - 30) + ' more');
  }
});
