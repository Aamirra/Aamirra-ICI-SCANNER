const fs = require('fs');

const OLD_STATUS_ROW = `    <div style="display:flex; align-items:center; margin-bottom:8px;">
        <span id="scanStatusText" class="scan-status-line"></span>
        <span id="lastScanTime" class="last-scan-line">🕒 Last scan: never</span>
    </div>
`;

const NEW_BRAND_INNER = `<span id="scanStatusText" class="scan-status-line" style="margin-left:0;"></span><span id="lastScanTime" class="last-scan-line" style="margin-left:8px;">🕒 Last scan: never</span>`;

const CONFIGS = [
  { path: '/home/ubuntu/ICI-SCANNER/index.html', brandOld: `<div class="brand"><div class="brand-icon"><i class="fas fa-chart-line"></i></div><div class="brand-text"><h1>ICI Screener</h1></div></div>` },
  { path: '/home/ubuntu/ICI-SCANNER/crypto.html', brandOld: `<div class="brand"><div class="brand-icon"><i class="fas fa-bitcoin"></i></div><div class="brand-text"><h1>ICI Crypto</h1></div></div>` },
  { path: '/home/ubuntu/ICI-SCANNER/stocks.html', brandOld: `<div class="brand"><div class="brand-icon"><i class="fas fa-chart-line"></i></div><div class="brand-text"><h1>ICI Stocks</h1></div></div>` },
];

for (const cfg of CONFIGS) {
  let html = fs.readFileSync(cfg.path, 'utf8');
  console.log('--- ' + cfg.path + ' ---');

  const brandNew = `<div class="brand">${NEW_BRAND_INNER}</div>`;
  if (!html.includes(cfg.brandOld)) console.error('FAILED: brand block not found');
  else { html = html.replace(cfg.brandOld, brandNew); console.log('OK: brand replaced with last-scan info'); }

  if (!html.includes(OLD_STATUS_ROW)) console.error('FAILED: old status row not found');
  else { html = html.replace(OLD_STATUS_ROW, ''); console.log('OK: old status row removed'); }

  fs.writeFileSync(cfg.path, html, 'utf8');
}
console.log('Done.');
