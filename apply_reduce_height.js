const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const replacements = [
  // CSS classes
  ['.tf-preset-btn { padding:4px 14px;', '.tf-preset-btn { padding:2px 14px;'],
  ['.chart-interval-btn { padding:4px 8px;', '.chart-interval-btn { padding:2px 8px;'],
  ['.layout-select { padding:3px 8px;', '.layout-select { padding:2px 8px;'],
  // outer header container padding
  ['padding:8px 10px;background:var(--surface);border-bottom:1px solid var(--border);gap:6px;flex-wrap:wrap;',
   'padding:5px 10px;background:var(--surface);border-bottom:1px solid var(--border);gap:6px;flex-wrap:wrap;'],
  // icon buttons (back, forward, bell, close) - reduce font-size and padding
  ['font-size:20px;padding:8px;margin-right:10px;color:var(--txt)', 'font-size:15px;padding:5px;margin-right:10px;color:var(--txt)'],
  ['font-size:20px;padding:8px;margin-left:10px;color:var(--txt)', 'font-size:15px;padding:5px;margin-left:10px;color:var(--txt)'],
  ['font-size:20px;padding:8px;margin-left:4px;color:var(--gold);cursor:pointer;', 'font-size:15px;padding:5px;margin-left:4px;color:var(--gold);cursor:pointer;'],
  ['font-size:20px;padding:8px;margin-left:4px;color:var(--red)', 'font-size:15px;padding:5px;margin-left:4px;color:var(--red)'],
  // symbol name font size
  ['font-weight:700;font-size:16px;color:var(--txt)', 'font-weight:700;font-size:13px;color:var(--txt)'],
];

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];
  replacements.forEach(([oldS, newS]) => {
    if (content.includes(oldS)) { content = content.split(oldS).join(newS); log.push('OK: ' + oldS.slice(0,40)); }
    else log.push('WARNING not found: ' + oldS.slice(0,40));
  });
  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
