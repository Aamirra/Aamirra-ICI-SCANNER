const fs = require('fs');

const FILES = [
  '/home/ubuntu/ICI-SCANNER/index.html',
  '/home/ubuntu/ICI-SCANNER/crypto.html',
  '/home/ubuntu/ICI-SCANNER/stocks.html',
];

const DIV_OLD = `<div class="sync-info" onclick="openTargetModal()">`;
const DIV_NEW = `<div class="sync-info">`;

const SPAN_OLD = `        <span style="color:var(--acc);margin-left:6px;">Target list: <span id="targetCount">0</span> ></span>\n`;

const PILL_OLD = `        <button class="slevel-btn" onclick="setFilter('target')">Target <span id="targetCount2" style="color:var(--gold)">0</span></button>\n`;

const RENDER_LINES_OLD = `    document.getElementById('targetCount2').textContent = u;\n    document.getElementById('targetCount').textContent = u;\n`;

for (const path of FILES) {
  let html = fs.readFileSync(path, 'utf8');
  console.log('--- ' + path + ' ---');

  if (!html.includes(DIV_OLD)) console.error('FAILED: sync-info onclick');
  else { html = html.replace(DIV_OLD, DIV_NEW); console.log('OK: sync-info onclick removed'); }

  if (!html.includes(SPAN_OLD)) console.error('FAILED: Target list span');
  else { html = html.replace(SPAN_OLD, ''); console.log('OK: Target list button removed'); }

  if (!html.includes(PILL_OLD)) console.error('FAILED: Target pill');
  else { html = html.replace(PILL_OLD, ''); console.log('OK: Target pill removed'); }

  if (!html.includes(RENDER_LINES_OLD)) console.error('FAILED: render() targetCount lines');
  else { html = html.replace(RENDER_LINES_OLD, ''); console.log('OK: render() targetCount lines removed'); }

  fs.writeFileSync(path, html, 'utf8');
}
console.log('Done.');
