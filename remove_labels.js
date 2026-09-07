const fs = require('fs');

const FILES = [
  { path: '/home/ubuntu/ICI-SCANNER/index.html', title: 'ICI Screener' },
  { path: '/home/ubuntu/ICI-SCANNER/crypto.html', title: 'ICI Crypto' },
  { path: '/home/ubuntu/ICI-SCANNER/stocks.html', title: 'ICI Stocks' },
];

for (const f of FILES) {
  let html = fs.readFileSync(f.path, 'utf8');
  console.log('--- ' + f.path + ' ---');

  const cleanV2Old = `<h1>${f.title}</h1><span>clean v2</span>`;
  const cleanV2New = `<h1>${f.title}</h1>`;
  if (!html.includes(cleanV2Old)) console.error('FAILED: clean v2');
  else { html = html.replace(cleanV2Old, cleanV2New); console.log('OK: clean v2 removed'); }

  const cloudActiveOld = `        <div class="cloud-status" id="statusDot">Cloud active</div>\n`;
  if (!html.includes(cloudActiveOld)) console.error('FAILED: Cloud active div');
  else { html = html.replace(cloudActiveOld, ''); console.log('OK: Cloud active div removed'); }

  const cloudSyncedOld = `        Cloud synced <span style="color:var(--acc);margin-left:6px;">Target list:`;
  const cloudSyncedNew = `        <span style="color:var(--acc);margin-left:6px;">Target list:`;
  if (!html.includes(cloudSyncedOld)) console.error('FAILED: Cloud synced text');
  else { html = html.replace(cloudSyncedOld, cloudSyncedNew); console.log('OK: Cloud synced text removed'); }

  fs.writeFileSync(f.path, html, 'utf8');
}
console.log('Done.');
