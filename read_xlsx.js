const XLSX = require('xlsx');
const files = [
  'schemeatlas.com-Coverage-Drilldown-2026-05-27.xlsx',
  'schemeatlas.com-Coverage-Drilldown-2026-05-27 (1).xlsx',
  'schemeatlas.com-Coverage-Drilldown-2026-05-27 (2).xlsx'
];
files.forEach(function(f, i) {
  try {
    var wb = XLSX.readFile(f);
    console.log('\n=== FILE ' + (i+1) + ': ' + f + ' ===');
    wb.SheetNames.forEach(function(s) {
      var ws = wb.Sheets[s];
      var data = XLSX.utils.sheet_to_json(ws, {header:1});
      console.log('Sheet: ' + s + ' | Total rows: ' + data.length);
      // Print first 3 rows (headers + samples)
      data.slice(0, 3).forEach(function(r) { console.log(JSON.stringify(r)); });
      // Print last 3 rows
      if (data.length > 6) {
        console.log('...');
        data.slice(-3).forEach(function(r) { console.log(JSON.stringify(r)); });
      }
    });
  } catch(e) { console.log('Error on ' + f + ': ' + e.message); }
});
