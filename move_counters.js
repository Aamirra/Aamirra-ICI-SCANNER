const fs = require('fs');

const FILES = [
  '/home/ubuntu/ICI-SCANNER/index.html',
  '/home/ubuntu/ICI-SCANNER/crypto.html',
  '/home/ubuntu/ICI-SCANNER/stocks.html',
];

const GRID_OLD =
`    <div class="counters-grid">
        <div class="count-card" onclick="setFilter('bull')"><div class="num" style="color:var(--green)" id="bc">0</div><div class="label">Bullish</div></div>
        <div class="count-card" onclick="setFilter('bear')"><div class="num" style="color:var(--red)" id="rc">0</div><div class="label">Bearish</div></div>
        <div class="count-card" onclick="setFilter('all')"><div class="num" style="color:var(--txt)" id="allCount">0</div><div class="label">All</div></div>
        <div class="count-card" onclick="setFilter('target')"><div class="num" style="color:var(--gold)" id="targetCount2">0</div><div class="label">Target</div></div>
    </div>
`;

const S05_OLD =
`        <button class="slevel-btn" id="sLevelBtn5" onclick="setSLevelFilter(5)">S05</button>
    </div>`;

const S05_NEW =
`        <button class="slevel-btn" id="sLevelBtn5" onclick="setSLevelFilter(5)">S05</button>
        <button class="slevel-btn" onclick="setFilter('bull')">Bull <span id="bc" style="color:var(--green)">0</span></button>
        <button class="slevel-btn" onclick="setFilter('bear')">Bear <span id="rc" style="color:var(--red)">0</span></button>
        <button class="slevel-btn" onclick="setFilter('all')">All <span id="allCount">0</span></button>
        <button class="slevel-btn" onclick="setFilter('target')">Target <span id="targetCount2" style="color:var(--gold)">0</span></button>
    </div>`;

for (const path of FILES) {
  let html = fs.readFileSync(path, 'utf8');
  console.log('--- ' + path + ' ---');

  if (!html.includes(GRID_OLD)) console.error('FAILED: counters-grid block not found');
  else { html = html.replace(GRID_OLD, ''); console.log('OK: counters-grid removed'); }

  if (!html.includes(S05_OLD)) console.error('FAILED: S05/close-div anchor not found');
  else { html = html.replace(S05_OLD, S05_NEW); console.log('OK: Bull/Bear/All/Target pills added'); }

  fs.writeFileSync(path, html, 'utf8');
}
console.log('Done.');
