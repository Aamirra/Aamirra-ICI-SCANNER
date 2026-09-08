const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldCSS = `        .wl-row { display:flex; align-items:center; padding:5px 8px; font-size:12px; border-bottom:1px solid var(--border); position:relative; }`;
const newCSS = `        .wl-row { display:flex; align-items:center; padding:5px 8px; font-size:12px; border-bottom:1px solid var(--border); position:relative; -webkit-user-select:none; user-select:none; }`;

const jsAnchor = `    document.addEventListener('click', function() { wlCloseContextMenu(); });`;
const newJsAnchor = `    document.addEventListener('click', function() { wlCloseContextMenu(); });
    document.addEventListener('selectstart', function(e) { if (isDraggingWL) e.preventDefault(); });`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldCSS)) { content = content.split(oldCSS).join(newCSS); log.push('wl-row no-select CSS added OK'); }
  else log.push('WARNING: wl-row CSS pattern not found');

  if (content.includes(jsAnchor)) { content = content.split(jsAnchor).join(newJsAnchor); log.push('selectstart guard added OK'); }
  else log.push('WARNING: JS anchor not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
