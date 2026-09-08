const fs = require('fs');

const MINWIDTH_OLD = `.alert-dropdown-panel { display:none; position:absolute; top:36px; right:0; flex-direction:column; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:8px; z-index:50; box-shadow:0 4px 12px rgba(0,0,0,0.15); min-width:90px; }`;
const MINWIDTH_NEW = `.alert-dropdown-panel { display:none; position:absolute; top:36px; right:0; flex-direction:column; gap:6px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:8px; z-index:50; box-shadow:0 4px 12px rgba(0,0,0,0.15); min-width:170px; }`;

const CONFIGS = [
  {
    path: '/home/ubuntu/ICI-SCANNER/index.html',
    lsKey: 'desktop-mode',
    actionsOld: `        <div class="header-actions">
            <div class="market-dropdown-wrap" id="marketDropdownWrap">
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
            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>
            <button class="icon-btn" onclick="toggleDesktopMode()" id="desktopBtn"><i class="fas fa-desktop"></i></button>
            <div class="alert-dropdown-wrap" id="alertDropdownWrap">
                <button class="icon-btn" onclick="toggleAlertDropdown(event)" id="alertDropdownBtn"><i class="fab fa-whatsapp"></i></button>
                <div class="alert-dropdown-panel" id="alertDropdownPanel">
                    <button class="alert-toggle" id="tgToggle" onclick="toggleAlert('telegram')">TG</button>
                    <button class="alert-toggle" id="waToggle" onclick="toggleAlert('whatsapp')">WA</button>
                    <button class="alert-toggle" id="ltfAlertBtn" onclick="toggleLtfAlert()">LTF OFF</button>
                </div>
            </div>
        </div>`,
    actionsNew: `        <div class="header-actions">
            <div class="market-dropdown-wrap" id="marketDropdownWrap">
                <button class="pill-mini active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Forex <i class="fas fa-caret-down"></i></button>
                <div class="market-dropdown-panel" id="marketDropdownPanel">
                    <a href="/crypto" class="market-option">Crypto</a>
                    <a href="/stocks" class="market-option">Stocks (Exness)</a>
                    <a href="/stocks?market=psx" class="market-option">Stocks (PSX)</a>
                </div>
            </div>
            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>
            <div class="alert-dropdown-wrap" id="alertDropdownWrap">
                <button class="icon-btn" onclick="toggleAlertDropdown(event)" id="alertDropdownBtn"><i class="fas fa-bars"></i></button>
                <div class="alert-dropdown-panel" id="alertDropdownPanel">
                    <a href="/journal" class="alert-toggle" style="text-decoration:none;">📒 Journal</a>
                    <button class="alert-toggle" onclick="actualScan()" style="background:var(--acc);color:#fff;">Scan</button>
                    <button class="alert-toggle" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
                    <span class="toggle-4h active" id="toggle4hBtn" onclick="event.stopPropagation(); toggle4H()">4H ON</span>
                    <button class="alert-toggle" id="tgToggle" onclick="toggleAlert('telegram')">TG</button>
                    <button class="alert-toggle" id="waToggle" onclick="toggleAlert('whatsapp')">WA</button>
                    <button class="alert-toggle" id="ltfAlertBtn" onclick="toggleLtfAlert()">LTF OFF</button>
                </div>
            </div>
        </div>`
  },
  {
    path: '/home/ubuntu/ICI-SCANNER/crypto.html',
    lsKey: 'crypto-desktop-mode',
    actionsOld: `        <div class="header-actions">
            <div class="market-dropdown-wrap" id="marketDropdownWrap">
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
            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>
            <button class="icon-btn" onclick="toggleDesktopMode()" id="desktopBtn"><i class="fas fa-desktop"></i></button>
            <div class="alert-dropdown-wrap" id="alertDropdownWrap">
                <button class="icon-btn" onclick="toggleAlertDropdown(event)" id="alertDropdownBtn"><i class="fab fa-whatsapp"></i></button>
                <div class="alert-dropdown-panel" id="alertDropdownPanel">
                    <button class="alert-toggle" id="tgToggle" onclick="toggleAlert('telegram')">TG</button>
                    <button class="alert-toggle" id="waToggle" onclick="toggleAlert('whatsapp')">WA</button>
                    <button class="alert-toggle" id="ltfAlertBtn" onclick="toggleLtfAlert()">LTF OFF</button>
                </div>
            </div>
        </div>`,
    actionsNew: `        <div class="header-actions">
            <div class="market-dropdown-wrap" id="marketDropdownWrap">
                <button class="pill-mini active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Crypto <i class="fas fa-caret-down"></i></button>
                <div class="market-dropdown-panel" id="marketDropdownPanel">
                    <a href="/" class="market-option">Forex</a>
                    <a href="/stocks" class="market-option">Stocks (Exness)</a>
                    <a href="/stocks?market=psx" class="market-option">Stocks (PSX)</a>
                </div>
            </div>
            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>
            <div class="alert-dropdown-wrap" id="alertDropdownWrap">
                <button class="icon-btn" onclick="toggleAlertDropdown(event)" id="alertDropdownBtn"><i class="fas fa-bars"></i></button>
                <div class="alert-dropdown-panel" id="alertDropdownPanel">
                    <a href="/journal" class="alert-toggle" style="text-decoration:none;">📒 Journal</a>
                    <button class="alert-toggle" onclick="actualScan()" style="background:var(--acc);color:#fff;">Scan</button>
                    <button class="alert-toggle" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
                    <span class="toggle-4h active" id="toggle4hBtn" onclick="event.stopPropagation(); toggle4H()">4H ON</span>
                    <button class="alert-toggle" id="tgToggle" onclick="toggleAlert('telegram')">TG</button>
                    <button class="alert-toggle" id="waToggle" onclick="toggleAlert('whatsapp')">WA</button>
                    <button class="alert-toggle" id="ltfAlertBtn" onclick="toggleLtfAlert()">LTF OFF</button>
                </div>
            </div>
        </div>`
  },
  {
    path: '/home/ubuntu/ICI-SCANNER/stocks.html',
    lsKey: 'stocks-desktop-mode',
    actionsOld: `        <div class="header-actions">
            <div class="market-dropdown-wrap" id="marketDropdownWrap">
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
            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>
            <button class="icon-btn" onclick="toggleDesktopMode()" id="desktopBtn"><i class="fas fa-desktop"></i></button>
            <div class="alert-dropdown-wrap" id="alertDropdownWrap">
                <button class="icon-btn" onclick="toggleAlertDropdown(event)" id="alertDropdownBtn"><i class="fab fa-whatsapp"></i></button>
                <div class="alert-dropdown-panel" id="alertDropdownPanel">
                    <button class="alert-toggle" id="tgToggle" onclick="toggleAlert('telegram')">TG</button>
                    <button class="alert-toggle" id="waToggle" onclick="toggleAlert('whatsapp')">WA</button>
                    <button class="alert-toggle" id="ltfAlertBtn" onclick="toggleLtfAlert()">LTF OFF</button>
                </div>
            </div>
        </div>`,
    actionsNew: `        <div class="header-actions">
            <div class="market-dropdown-wrap" id="marketDropdownWrap">
                <button class="pill-mini active-blue" onclick="toggleMarketDropdown(event)" id="marketDropdownBtn">Stocks (Exness) <i class="fas fa-caret-down"></i></button>
                <div class="market-dropdown-panel" id="marketDropdownPanel">
                    <a href="/" class="market-option">Forex</a>
                    <a href="/crypto" class="market-option">Crypto</a>
                    <button class="market-option active-market" id="exnessBtn" onclick="setMarket('exness')">Stocks (Exness)</button>
                    <button class="market-option" id="psxBtn" onclick="setMarket('psx')">Stocks (PSX)</button>
                </div>
            </div>
            <button class="icon-btn" onclick="toggleTheme()" id="themeBtn"><i class="fas fa-moon"></i></button>
            <div class="alert-dropdown-wrap" id="alertDropdownWrap">
                <button class="icon-btn" onclick="toggleAlertDropdown(event)" id="alertDropdownBtn"><i class="fas fa-bars"></i></button>
                <div class="alert-dropdown-panel" id="alertDropdownPanel">
                    <button class="alert-toggle" onclick="actualScan()" style="background:var(--acc);color:#fff;">Scan</button>
                    <a href="/journal" class="alert-toggle" style="text-decoration:none;">📒 Journal</a>
                    <button class="alert-toggle" onclick="openAlertsList()" style="background:var(--gold); color:#fff; border-color:var(--gold);">Alerts</button>
                    <span class="toggle-4h active" id="toggle4hBtn" onclick="event.stopPropagation(); toggle4H()">4H ON</span>
                    <button class="alert-toggle" id="tgToggle" onclick="toggleAlert('telegram')">TG</button>
                    <button class="alert-toggle" id="waToggle" onclick="toggleAlert('whatsapp')">WA</button>
                    <button class="alert-toggle" id="ltfAlertBtn" onclick="toggleLtfAlert()">LTF OFF</button>
                </div>
            </div>
        </div>`
  }
];

for (const cfg of CONFIGS) {
  let html = fs.readFileSync(cfg.path, 'utf8');
  console.log('--- ' + cfg.path + ' ---');

  if (!html.includes('<body>')) console.error('FAILED: <body> tag');
  else { html = html.replace('<body>', '<body class="desktop-mode">'); console.log('OK: desktop-mode hardcoded on body'); }

  if (!html.includes(cfg.actionsOld)) console.error('FAILED: header-actions block not matched');
  else { html = html.replace(cfg.actionsOld, cfg.actionsNew); console.log('OK: menu consolidated'); }

  const fnOld = `function toggleDesktopMode() {
    const isDesktop = document.body.classList.toggle('desktop-mode');
    document.getElementById('chartOverlay').style.display = isDesktop ? 'flex' : 'none';
    document.querySelector('#desktopBtn i').className = isDesktop ? 'fas fa-mobile-alt' : 'fas fa-desktop';
    localStorage.setItem('${cfg.lsKey}', isDesktop ? 'desktop' : 'mobile');
    render();
}`;
  if (!html.includes(fnOld)) console.error('FAILED: toggleDesktopMode function not matched');
  else { html = html.replace(fnOld, ''); console.log('OK: toggleDesktopMode function removed'); }

  const initOld = `    if (localStorage.getItem('${cfg.lsKey}') === 'desktop') {
        document.body.classList.add('desktop-mode');
        document.getElementById('chartOverlay').style.display = 'flex';
        document.querySelector('#desktopBtn i').className = 'fas fa-mobile-alt';
    }
`;
  if (!html.includes(initOld)) console.error('FAILED: init desktop-mode block not matched');
  else { html = html.replace(initOld, ''); console.log('OK: init desktop-mode block removed'); }

  if (!html.includes(MINWIDTH_OLD)) console.error('FAILED (non-critical): dropdown min-width CSS');
  else { html = html.replace(MINWIDTH_OLD, MINWIDTH_NEW); console.log('OK: dropdown widened'); }

  fs.writeFileSync(cfg.path, html, 'utf8');
}
console.log('Done.');
