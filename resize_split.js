const fs = require('fs');

const FILES = [
  '/home/ubuntu/ICI-SCANNER/index.html',
  '/home/ubuntu/ICI-SCANNER/crypto.html',
  '/home/ubuntu/ICI-SCANNER/stocks.html',
];

const OLD = `body.desktop-mode .phone-container { max-width:none; width:640px; height:100vh; overflow-y:auto; border-radius:0; box-shadow:none; margin:0; flex-shrink:0; border-right:1px solid var(--border); }`;
const NEW = `body.desktop-mode .phone-container { max-width:none; width:30%; height:100vh; overflow-y:auto; border-radius:0; box-shadow:none; margin:0; flex-shrink:0; border-right:1px solid var(--border); }`;

for (const path of FILES) {
  let html = fs.readFileSync(path, 'utf8');
  console.log('--- ' + path + ' ---');
  if (!html.includes(OLD)) console.error('FAILED: desktop-mode phone-container rule not found');
  else { html = html.replace(OLD, NEW); console.log('OK: dashboard set to 30% width (chart fills remaining 70%)'); }
  fs.writeFileSync(path, html, 'utf8');
}
console.log('Done.');
