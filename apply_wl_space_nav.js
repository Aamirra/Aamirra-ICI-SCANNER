const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

// 1. Replace watchlist row onclick to use new dedicated function
const oldRow = `onclick="if(typeof openChartForPair===\\'function\\') openChartForPair(\\'' + sym + '\\')" style="cursor:pointer;"`;
const newRow = `onclick="openChartFromWatchlist(\\'' + sym + '\\')" style="cursor:pointer;"`;

// 2. Add openChartFromWatchlist function near wlRemoveSymbol
const fnAnchor = `window.wlRemoveSymbol = function(sym) {`;
const newFnAnchor = `window.openChartFromWatchlist = function(sym) {
        var tab = wlGetActiveTab();
        var list = (tab && tab.symbols && tab.symbols.length) ? tab.symbols.slice() : [sym];
        chartPairs = list;
        var idx = chartPairs.indexOf(sym);
        if (idx === -1) idx = 0;
        chartIndices[activeChartSlot-1] = idx;
        updateChartPairName();
        drawChart(activeChartSlot);
        document.getElementById('chartOverlay').style.display = 'flex';
        activeChartPair = sym;
        if (typeof render === 'function') render();
        if (typeof startCountdownTimer === 'function') startCountdownTimer();
    };
    window.wlRemoveSymbol = function(sym) {`;

// 3. Add Space-key handling in the main keydown listener
const keyAnchor = `document.addEventListener('keydown', function(e) {
    const active = document.activeElement;
    const tag = active ? active.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;`;

const newKeyAnchor = `document.addEventListener('keydown', function(e) {
    const active = document.activeElement;
    const tag = active ? active.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ' || e.code === 'Space') {
        const overlay = document.getElementById('chartOverlay');
        if (overlay && overlay.style.display === 'flex' && typeof movePair === 'function') {
            e.preventDefault();
            movePair(1);
        }
        return;
    }`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldRow)) { content = content.split(oldRow).join(newRow); log.push('watchlist row onclick updated OK'); }
  else log.push('WARNING: watchlist row onclick pattern not found');

  if (content.includes(fnAnchor)) { content = content.split(fnAnchor).join(newFnAnchor); log.push('openChartFromWatchlist added OK'); }
  else log.push('WARNING: wlRemoveSymbol anchor not found');

  if (content.includes(keyAnchor)) { content = content.split(keyAnchor).join(newKeyAnchor); log.push('Space-key nav added OK'); }
  else log.push('WARNING: keydown anchor not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
