const fs = require('fs');

const CSS_ANCHOR = `        .pill.scan-btn { background:var(--acc); color:#fff; display:flex; align-items:center; gap:4px; }`;
const CSS_NEW = CSS_ANCHOR + `
        .pill-mini { padding:4px 9px; border-radius:14px; font-size:10px; font-weight:600; border:1px solid var(--border); background:var(--pill-bg); cursor:pointer; color:var(--txt); text-decoration:none; display:inline-flex; align-items:center; gap:2px; white-space:nowrap; }
        .pill-mini.active-blue { background:var(--acc); color:#fff; border-color:var(--acc); }
        .pill-mini.scan-btn { background:var(--acc); color:#fff; }`;

const ICON_BTN_OLD = `        .icon-btn { width:32px; height:32px; border-radius:50%; border:1px solid var(--border); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; color:var(--txt); }`;
const ICON_BTN_NEW = `        .icon-btn { width:27px; height:27px; border-radius:50%; border:1px solid var(--border); background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; color:var(--txt); }`;

const ACTIONS_ANCHOR_OLD = `        <div class="header-actions">
            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>`;

const SYNCINFO_OLD = `    <div class="sync-info">
        <span class="toggle-4h active" id="toggle4hBtn" onclick="event.stopPropagation(); toggle4H()">4H ON</span>
    </div>
`;

const CONFIGS = [
  {
    path: '/home/ubuntu/ICI-SCANNER/index.html',
    pillsRowOld: `    <div class="pills-row">
        <div class="market-dropdown-wrap" id="marketDropdownWrap">
            <button class="pill active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Forex <i class="fas fa-caret-down"></i></button>
            <div class="market-dropdown-panel" id="marketDropdownPanel">
                <a href="/crypto" class="market-option">Crypto</a>
                <a href="/stocks" class="market-option">Stocks (Exness)</a>
                <a href="/stocks?market=psx" class="market-option">Stocks (PSX)</a>
            </div>
        </div>
        <a href="/journal" class="pill" style="text-decoration:none">📒 Journal</a>
        <button class="pill scan-btn" onclick="actualScan()">Scan</button>
        <button class="pill" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
    </div>
`,
    movedBlock: `            <div class="market-dropdown-wrap" id="marketDropdownWrap">
                <button class="pill-mini active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Forex <i class="fas fa-caret-down"></i></button>
                <div class="market-dropdown-panel" id="marketDropdownPanel">
                    <a href="/crypto" class="market-option">Crypto</a>
                    <a href="/stocks" class="market-option">Stocks (Exness)</a>
                    <a href="/stocks?market=psx" class="market-option">Stocks (PSX)</a>
                </div>
            </div>
            <a href="/journal" class="pill-mini" style="text-decoration:none">📒 Journal</a>
            <button class="pill-mini scan-btn" onclick="actualScan()">Scan</button>
            <button class="pill-mini" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
            <span class="toggle-4h active" id="toggle4hBtn" onclick="event.stopPropagation(); toggle4H()">4H ON</span>
`
  },
  {
    path: '/home/ubuntu/ICI-SCANNER/crypto.html',
    pillsRowOld: `    <div class="pills-row">
        <div class="market-dropdown-wrap" id="marketDropdownWrap">
            <button class="pill active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Crypto <i class="fas fa-caret-down"></i></button>
            <div class="market-dropdown-panel" id="marketDropdownPanel">
                <a href="/" class="market-option">Forex</a>
                <a href="/stocks" class="market-option">Stocks (Exness)</a>
                <a href="/stocks?market=psx" class="market-option">Stocks (PSX)</a>
            </div>
        </div>
        <a href="/journal" class="pill" style="text-decoration:none">📒 Journal</a>
        <button class="pill scan-btn" onclick="actualScan()">Scan</button>
        <button class="pill" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
    </div>
`,
    movedBlock: `            <div class="market-dropdown-wrap" id="marketDropdownWrap">
                <button class="pill-mini active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Crypto <i class="fas fa-caret-down"></i></button>
                <div class="market-dropdown-panel" id="marketDropdownPanel">
                    <a href="/" class="market-option">Forex</a>
                    <a href="/stocks" class="market-option">Stocks (Exness)</a>
                    <a href="/stocks?market=psx" class="market-option">Stocks (PSX)</a>
                </div>
            </div>
            <a href="/journal" class="pill-mini" style="text-decoration:none">📒 Journal</a>
            <button class="pill-mini scan-btn" onclick="actualScan()">Scan</button>
            <button class="pill-mini" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
            <span class="toggle-4h active" id="toggle4hBtn" onclick="event.stopPropagation(); toggle4H()">4H ON</span>
`
  },
  {
    path: '/home/ubuntu/ICI-SCANNER/stocks.html',
    pillsRowOld: `    <div class="pills-row">
        <div class="market-dropdown-wrap" id="marketDropdownWrap">
            <button class="pill active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Stocks (Exness) <i class="fas fa-caret-down"></i></button>
            <div class="market-dropdown-panel" id="marketDropdownPanel">
                <a href="/" class="market-option">Forex</a>
                <a href="/crypto" class="market-option">Crypto</a>
                <button class="market-option active-market" id="exnessBtn" onclick="setMarket('exness')">Stocks (Exness)</button>
                <button class="market-option" id="psxBtn" onclick="setMarket('psx')">Stocks (PSX)</button>
            </div>
        </div>
        <button class="pill scan-btn" onclick="actualScan()">Scan</button>

        <a href="/journal" class="pill" style="text-decoration:none">📒 Journal</a>
        <button class="pill" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
    </div>
`,
    movedBlock: `            <div class="market-dropdown-wrap" id="marketDropdownWrap">
                <button class="pill-mini active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Stocks (Exness) <i class="fas fa-caret-down"></i></button>
                <div class="market-dropdown-panel" id="marketDropdownPanel">
                    <a href="/" class="market-option">Forex</a>
                    <a href="/crypto" class="market-option">Crypto</a>
                    <button class="market-option active-market" id="exnessBtn" onclick="setMarket('exness')">Stocks (Exness)</button>
                    <button class="market-option" id="psxBtn" onclick="setMarket('psx')">Stocks (PSX)</button>
                </div>
            </div>
            <button class="pill-mini scan-btn" onclick="actualScan()">Scan</button>
            <a href="/journal" class="pill-mini" style="text-decoration:none">📒 Journal</a>
            <button class="pill-mini" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
            <span class="toggle-4h active" id="toggle4hBtn" onclick="event.stopPropagation(); toggle4H()">4H ON</span>
`
  }
];

for (const cfg of CONFIGS) {
  let html = fs.readFileSync(cfg.path, 'utf8');
  console.log('--- ' + cfg.path + ' ---');

  if (!html.includes(CSS_ANCHOR)) console.error('FAILED: CSS anchor');
  else { html = html.replace(CSS_ANCHOR, CSS_NEW); console.log('OK: pill-mini CSS added'); }

  if (!html.includes(ICON_BTN_OLD)) console.error('FAILED (non-critical): icon-btn shrink');
  else { html = html.replace(ICON_BTN_OLD, ICON_BTN_NEW); console.log('OK: icon-btn shrunk'); }

  if (!html.includes(ACTIONS_ANCHOR_OLD)) console.error('FAILED: header-actions anchor');
  else {
    html = html.replace(ACTIONS_ANCHOR_OLD, `        <div class="header-actions">
${cfg.movedBlock}            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>`);
    console.log('OK: buttons inserted into header-actions');
  }

  if (!html.includes(cfg.pillsRowOld)) console.error('FAILED: old pills-row removal');
  else { html = html.replace(cfg.pillsRowOld, ''); console.log('OK: old pills-row removed'); }

  if (!html.includes(SYNCINFO_OLD)) console.error('FAILED: old sync-info removal');
  else { html = html.replace(SYNCINFO_OLD, ''); console.log('OK: old sync-info removed'); }

  fs.writeFileSync(cfg.path, html, 'utf8');
}
console.log('Done.');
