const fs = require('fs');

const CSS_OLD = `        .dir-toggle-btn { padding:5px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; color:#fff; }
        .dir-toggle-btn.long { background:var(--green); }
        .dir-toggle-btn.short { background:var(--red); }
        .dir-dot { width:16px; height:16px; border-radius:50%; background:var(--green); cursor:pointer; display:inline-block; }
        .slevel-btn { padding:4px 10px; border:1px solid var(--border); border-radius:8px; font-size:11px; font-weight:700; background:var(--pill-bg); color:var(--muted); cursor:pointer; }
        .slevel-btn.active { background:var(--gold); color:#000; border-color:var(--gold); }`;

const CSS_NEW = `        .dir-toggle-btn { padding:3px 7px; border-radius:6px; font-size:9px; font-weight:700; cursor:pointer; color:#fff; white-space:nowrap; }
        .dir-toggle-btn.long { background:var(--green); }
        .dir-toggle-btn.short { background:var(--red); }
        .dir-dot { width:11px; height:11px; border-radius:50%; background:var(--green); cursor:pointer; display:inline-block; flex-shrink:0; }
        .slevel-btn { padding:3px 6px; border:1px solid var(--border); border-radius:6px; font-size:9px; font-weight:700; background:var(--pill-bg); color:var(--muted); cursor:pointer; white-space:nowrap; }
        .slevel-btn.active { background:var(--gold); color:#000; border-color:var(--gold); }`;

const BAR_STYLE_OLD = `style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;"`;
const BAR_STYLE_NEW = `style="display:flex;align-items:center;gap:3px;margin-bottom:8px;flex-wrap:nowrap;justify-content:space-between;"`;

const ALL_BTN_OLD = `        <button class="slevel-btn" onclick="setFilter('all')">All <span id="allCount">0</span></button>\n`;

const CONFIGS = [
  { path: '/home/ubuntu/ICI-SCANNER/index.html', renderLine: `    document.getElementById('allCount').textContent = PAIRS.length;\n` },
  { path: '/home/ubuntu/ICI-SCANNER/crypto.html', renderLine: `    document.getElementById('allCount').textContent = PAIRS.length;\n` },
  { path: '/home/ubuntu/ICI-SCANNER/stocks.html', renderLine: `    document.getElementById('allCount').textContent = Object.keys(MARKET_DATA).length;\n` },
];

for (const cfg of CONFIGS) {
  let html = fs.readFileSync(cfg.path, 'utf8');
  console.log('--- ' + cfg.path + ' ---');

  if (!html.includes(CSS_OLD)) console.error('FAILED: CSS block');
  else { html = html.replace(CSS_OLD, CSS_NEW); console.log('OK: sizes shrunk'); }

  if (!html.includes(BAR_STYLE_OLD)) console.error('FAILED: bar style');
  else { html = html.replace(BAR_STYLE_OLD, BAR_STYLE_NEW); console.log('OK: row forced single-line'); }

  if (!html.includes(ALL_BTN_OLD)) console.error('FAILED: All button');
  else { html = html.replace(ALL_BTN_OLD, ''); console.log('OK: All button removed'); }

  if (!html.includes(cfg.renderLine)) console.error('FAILED: render() allCount line');
  else { html = html.replace(cfg.renderLine, ''); console.log('OK: render() allCount line removed'); }

  fs.writeFileSync(cfg.path, html, 'utf8');
}
console.log('Done.');
