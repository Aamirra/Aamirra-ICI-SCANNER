const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const cssAnchor = `        body.desktop-mode #chartCloseBtn { display:none !important; }`;
const newCSS = `        body.desktop-mode #chartCloseBtn { display:none !important; }
        .dash-toggle-btn { display:none; }
        body.desktop-mode .dash-toggle-btn { display:flex; position:fixed; top:50%; left:25%; transform:translate(-50%,-50%); z-index:1001; width:20px; height:50px; border-radius:0 8px 8px 0; background:var(--surface); border:1px solid var(--border); border-left:none; color:var(--txt); align-items:center; justify-content:center; cursor:pointer; font-size:12px; box-shadow:2px 0 6px rgba(0,0,0,0.1); }
        body.desktop-mode.dash-hidden .phone-container { display:none !important; }
        body.desktop-mode.dash-hidden .dash-toggle-btn { left:0; border-radius:0 8px 8px 0; }`;

const htmlAnchor = `<div id="chartOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg);z-index:1000;display:none;flex-direction:column;">`;
const newHTML = `<button class="dash-toggle-btn" id="dashToggleBtn" onclick="toggleDashboard()"><i class="fas fa-chevron-left"></i></button>
<div id="chartOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg);z-index:1000;display:none;flex-direction:column;">`;

const jsAnchor = `if (typeof getBellHtml !== 'function') window.getBellHtml = p=>'';`;
const newJS = `function toggleDashboard() {
    document.body.classList.toggle('dash-hidden');
    const icon = document.querySelector('#dashToggleBtn i');
    icon.className = document.body.classList.contains('dash-hidden') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
}
if (typeof getBellHtml !== 'function') window.getBellHtml = p=>'';`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(cssAnchor)) { content = content.split(cssAnchor).join(newCSS); log.push('CSS added OK'); }
  else log.push('WARNING: CSS anchor not found');

  if (content.includes(htmlAnchor)) { content = content.split(htmlAnchor).join(newHTML); log.push('HTML button added OK'); }
  else log.push('WARNING: HTML anchor not found');

  if (content.includes(jsAnchor)) { content = content.split(jsAnchor).join(newJS); log.push('JS function added OK'); }
  else log.push('WARNING: JS anchor not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
