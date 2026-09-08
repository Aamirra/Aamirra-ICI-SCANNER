const fs = require('fs');

const CSS_ANCHOR = `        .screener-wrap { overflow-x:visible; }`;
const CSS_NEW = CSS_ANCHOR + `
        .type-search-indicator { position:sticky; top:0; z-index:20; background:var(--acc); color:#fff; font-size:13px; font-weight:600; padding:8px 14px; border-radius:10px; margin-bottom:8px; display:flex; align-items:center; gap:6px; }`;

const TYPEAHEAD_JS = `
// ── Type-anywhere-to-search (no visible search bar) ──
let typeSearchBuffer = '';
function updateTypeSearchIndicator() {
    let el = document.getElementById('typeSearchIndicator');
    const wrap = document.querySelector('.screener-wrap');
    if (!typeSearchBuffer) { if (el) el.remove(); return; }
    if (!el) {
        el = document.createElement('div');
        el.id = 'typeSearchIndicator';
        el.className = 'type-search-indicator';
        wrap.prepend(el);
    }
    el.textContent = '🔍 ' + typeSearchBuffer + ' (Esc to clear)';
}
document.addEventListener('keydown', function(e) {
    const active = document.activeElement;
    const tag = active ? active.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (active && active.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape') {
        typeSearchBuffer = '';
        filterPairs('');
        updateTypeSearchIndicator();
        return;
    }
    if (e.key === 'Backspace') {
        typeSearchBuffer = typeSearchBuffer.slice(0, -1);
        filterPairs(typeSearchBuffer);
        updateTypeSearchIndicator();
        e.preventDefault();
        return;
    }
    if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        typeSearchBuffer += e.key;
        filterPairs(typeSearchBuffer);
        updateTypeSearchIndicator();
    }
});
`;

const CONFIGS = [
  {
    path: '/home/ubuntu/ICI-SCANNER/index.html',
    searchDivOld: `    <div class="search-container"><input type="text" class="search-bar" placeholder="Search pairs..." oninput="filterPairs(this.value)"></div>\n`,
    filterFnOld: `function filterPairs(txt) {\n    filteredPairs = txt ? PAIRS.filter(p => p.n.toLowerCase().includes(txt.toLowerCase())) : [...PAIRS];\n    render();\n}`
  },
  {
    path: '/home/ubuntu/ICI-SCANNER/crypto.html',
    searchDivOld: `    <div class="search-container"><input type="text" class="search-bar" placeholder="Search crypto..." oninput="filterPairs(this.value)"></div>\n`,
    filterFnOld: `function filterPairs(txt) {\n    filteredPairs = txt ? PAIRS.filter(p => p.n.toLowerCase().includes(txt.toLowerCase())) : [...PAIRS];\n    render();\n}`
  },
  {
    path: '/home/ubuntu/ICI-SCANNER/stocks.html',
    searchDivOld: `    <div class="search-container"><input type="text" class="search-bar" placeholder="Search stocks..." oninput="filterPairs(this.value)"></div>\n`,
    filterFnOld: `function filterPairs(txt) {\n    filteredSymbols = txt ? Object.keys(MARKET_DATA).filter(s => s.toLowerCase().includes(txt.toLowerCase())).sort() : [];\n    render();\n}`
  }
];

for (const cfg of CONFIGS) {
  let html = fs.readFileSync(cfg.path, 'utf8');
  console.log('--- ' + cfg.path + ' ---');

  if (!html.includes(CSS_ANCHOR)) console.error('FAILED: CSS anchor');
  else { html = html.replace(CSS_ANCHOR, CSS_NEW); console.log('OK: indicator CSS added'); }

  if (!html.includes(cfg.searchDivOld)) console.error('FAILED: search bar div not found');
  else { html = html.replace(cfg.searchDivOld, ''); console.log('OK: search bar removed'); }

  if (!html.includes(cfg.filterFnOld)) console.error('FAILED: filterPairs anchor not found');
  else { html = html.replace(cfg.filterFnOld, cfg.filterFnOld + '\n' + TYPEAHEAD_JS); console.log('OK: type-anywhere listener added'); }

  fs.writeFileSync(cfg.path, html, 'utf8');
}
console.log('Done.');
