const fs = require('fs');

const HEADER_BELL_OLD = `    html += '<div class="col-bell-fixed col-header-cell"><i class="fas fa-bell"></i></div>';\n`;

const FILES = [
  { path: '/home/ubuntu/ICI-SCANNER/index.html', varName: 'p.n' },
  { path: '/home/ubuntu/ICI-SCANNER/crypto.html', varName: 'p.n' },
  { path: '/home/ubuntu/ICI-SCANNER/stocks.html', varName: 'sym' },
];

for (const f of FILES) {
  let html = fs.readFileSync(f.path, 'utf8');
  console.log('--- ' + f.path + ' ---');

  if (!html.includes(HEADER_BELL_OLD)) console.error('FAILED: header bell line');
  else { html = html.replace(HEADER_BELL_OLD, ''); console.log('OK: header bell removed'); }

  const rowBellOld = `        cells += \`<div class="col-bell-fixed"><i class="fas fa-bell" style="color:var(--gold); cursor:pointer;" onclick="event.stopPropagation(); openAlertDialog('\${${f.varName}}')"></i></div>\`;\n`;
  if (!html.includes(rowBellOld)) console.error('FAILED: row bell line');
  else { html = html.replace(rowBellOld, ''); console.log('OK: row bell removed'); }

  // resize split 30% -> 25%
  const splitOld = `body.desktop-mode .phone-container { max-width:none; width:30%; height:100vh; overflow-y:auto; border-radius:0; box-shadow:none; margin:0; flex-shrink:0; border-right:1px solid var(--border); }`;
  const splitNew = `body.desktop-mode .phone-container { max-width:none; width:25%; height:100vh; overflow-y:auto; border-radius:0; box-shadow:none; margin:0; flex-shrink:0; border-right:1px solid var(--border); }`;
  if (!html.includes(splitOld)) console.error('FAILED: split width rule');
  else { html = html.replace(splitOld, splitNew); console.log('OK: split set to 25/75'); }

  fs.writeFileSync(f.path, html, 'utf8');
}
console.log('Done.');
