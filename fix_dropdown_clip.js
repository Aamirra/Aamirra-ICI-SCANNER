const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldCSS = `.market-dropdown-panel { display:none; position:absolute; top:36px; left:0; flex-direction:column; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:8px; z-index:50; box-shadow:0 4px 12px rgba(0,0,0,0.15); min-width:150px; }`;
const newCSS = `.market-dropdown-panel { display:none; position:absolute; top:36px; right:0; left:auto; flex-direction:column; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:8px; z-index:50; box-shadow:0 4px 12px rgba(0,0,0,0.15); min-width:150px; white-space:nowrap; }`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(oldCSS)) {
    content = content.split(oldCSS).join(newCSS);
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': OK');
  } else {
    console.log(file + ': WARNING pattern not found');
  }
});
