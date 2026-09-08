const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const replacements = [
  [`<span id="lastScanTime" class="last-scan-line" style="margin-left:8px;">🕒 Last scan: never</span>`,
   `<span id="lastScanTime" class="last-scan-line" style="margin-left:6px;" title="Last scan time">🕒 never</span>`],
  [`el.textContent = ts ? '🕒 Last scan: ' + new Date(ts).toLocaleTimeString() : '🕒 Last scan: never';`,
   `el.textContent = ts ? '🕒 ' + new Date(ts).toLocaleTimeString() : '🕒 never';`],
  [`.header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }`,
   `.header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }`],
];

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];
  replacements.forEach(([oldS, newS]) => {
    if (content.includes(oldS)) { content = content.split(oldS).join(newS); log.push('OK: ' + oldS.slice(0,45)); }
    else log.push('WARNING not found: ' + oldS.slice(0,45));
  });
  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
