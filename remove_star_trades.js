const fs = require('fs');

function applyList(html, list, tag) {
  for (const [label, oldStr, newStr] of list) {
    if (!html.includes(oldStr)) {
      console.error('FAILED [' + tag + '] ' + label);
    } else {
      html = html.replace(oldStr, newStr);
      console.log('OK [' + tag + '] ' + label);
    }
  }
  return html;
}

// ---- shared across all 3 files ----
const TRADES_CARD_OLD = "        <div class=\"count-card\" onclick=\"setFilter('trades')\"><div class=\"num\" style=\"color:var(--gold)\" id=\"tradesCount\">0</div><div class=\"label\">Trades</div></div>\n";
const STAR_BTN_OLD = "        <button id=\"chartStarBtn\" onclick=\"toggleStarFromChart()\" style=\"background:none;border:none;font-size:20px;padding:8px;color:var(--gold);cursor:pointer;\" title=\"Star/Unstar\"><i class=\"far fa-star\"></i></button>\n";
const GRID_CSS_OLD = "        .counters-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; margin-bottom:16px; }";
const GRID_CSS_NEW = "        .counters-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; margin-bottom:16px; }";
const TARGET_TRADES_COND_OLD = "        if (curF === 'target' || curF === 'trades') {";
const TARGET_TRADES_COND_NEW = "        if (curF === 'target') {";
const TRADESCOUNT_LINE_OLD = "    document.getElementById('tradesCount').textContent = starredPairs.length;\n";
const CALLSITE1_OLD = "    activeChartPair = pairName;\n    updateChartStarButton();\n    render();";
const CALLSITE1_NEW = "    activeChartPair = pairName;\n    render();";
const CALLSITE2_OLD = "    activeChartPair = chartPairs[chartIndices[activeChartSlot-1]];\n    updateChartStarButton();\n    drawChart(activeChartSlot);";
const CALLSITE2_NEW = "    activeChartPair = chartPairs[chartIndices[activeChartSlot-1]];\n    drawChart(activeChartSlot);";

const COMMON = [
  ['Trades count-card', TRADES_CARD_OLD, ''],
  ['Star button (chart header)', STAR_BTN_OLD, ''],
  ['counters-grid CSS (5→4 cols)', GRID_CSS_OLD, GRID_CSS_NEW],
  ['target||trades condition', TARGET_TRADES_COND_OLD, TARGET_TRADES_COND_NEW],
  ['tradesCount textContent line', TRADESCOUNT_LINE_OLD, ''],
  ['updateChartStarButton call #1', CALLSITE1_OLD, CALLSITE1_NEW],
  ['updateChartStarButton call #2', CALLSITE2_OLD, CALLSITE2_NEW],
];

// ---- INDEX.html ----
{
  const path = '/home/ubuntu/ICI-SCANNER/index.html';
  let html = fs.readFileSync(path, 'utf8');
  console.log('--- index.html ---');
  html = applyList(html, COMMON, 'index');

  const FUNCBLOCK_OLD =
    "let starredPairs = JSON.parse(localStorage.getItem('ici_starred') || '[]');\n" +
    "let activeChartPair = null;\n\n" +
    "function toggleStar(pair) {\n" +
    "    const idx = starredPairs.indexOf(pair);\n" +
    "    if (idx > -1) starredPairs.splice(idx, 1);\n" +
    "    else starredPairs.push(pair);\n" +
    "    localStorage.setItem('ici_starred', JSON.stringify(starredPairs));\n" +
    "    render();\n" +
    "    if (pair === activeChartPair) updateChartStarButton();\n" +
    "}\n\n" +
    "function toggleStarFromChart() {\n" +
    "    if (activeChartPair) toggleStar(activeChartPair);\n" +
    "}\n\n" +
    "function updateChartStarButton() {\n" +
    "    const btn = document.getElementById('chartStarBtn');\n" +
    "    if (btn) {\n" +
    "        const isStarred = starredPairs.includes(activeChartPair);\n" +
    "        btn.innerHTML = `<i class=\"${isStarred ? 'fas' : 'far'} fa-star\"></i>`;\n" +
    "    }\n" +
    "}";
  const FUNCBLOCK_NEW = "let activeChartPair = null;";

  const FILTER_LINE_OLD = "    else if (curF === 'trades') filtered = currentPairs.filter(p => starredPairs.includes(p.n));\n";

  const ROW_OLD =
    "        const isStarred = starredPairs.includes(p.n);\n" +
    "        const starIcon = `<i class=\"${isStarred ? 'fas' : 'far'} fa-star\" style=\"color:var(--gold); cursor:pointer; margin-right:4px; font-size:14px;\" onclick=\"event.stopPropagation(); toggleStar('${p.n}')\"></i>`;\n\n" +
    "        let cells = `<div class=\"col-pair-fixed\">${starIcon}<span style=\"font-weight:700;font-size:14px;\">${p.n}</span></div>`;";
  const ROW_NEW = "        let cells = `<div class=\"col-pair-fixed\"><span style=\"font-weight:700;font-size:14px;\">${p.n}</span></div>`;";

  html = applyList(html, [
    ['starredPairs + 3 star functions', FUNCBLOCK_OLD, FUNCBLOCK_NEW],
    ['trades filter branch', FILTER_LINE_OLD, ''],
    ['row star icon + cells', ROW_OLD, ROW_NEW],
  ], 'index');

  fs.writeFileSync(path, html, 'utf8');
}

// ---- CRYPTO.html ----
{
  const path = '/home/ubuntu/ICI-SCANNER/crypto.html';
  let html = fs.readFileSync(path, 'utf8');
  console.log('--- crypto.html ---');
  html = applyList(html, COMMON, 'crypto');

  const FUNCBLOCK_OLD =
    "let starredPairs = JSON.parse(localStorage.getItem('ici_crypto_starred') || '[]');\n" +
    "let activeChartPair = null;\n\n" +
    "function toggleStar(pair) {\n" +
    "    const idx = starredPairs.indexOf(pair);\n" +
    "    if (idx > -1) starredPairs.splice(idx, 1);\n" +
    "    else starredPairs.push(pair);\n" +
    "    localStorage.setItem('ici_crypto_starred', JSON.stringify(starredPairs));\n" +
    "    render();\n" +
    "    if (pair === activeChartPair) updateChartStarButton();\n" +
    "}\n" +
    "function toggleStarFromChart() {\n" +
    "    if (activeChartPair) toggleStar(activeChartPair);\n" +
    "}\n" +
    "function updateChartStarButton() {\n" +
    "    const btn = document.getElementById('chartStarBtn');\n" +
    "    if (btn) {\n" +
    "        const isStarred = starredPairs.includes(activeChartPair);\n" +
    "        btn.innerHTML = `<i class=\"${isStarred ? 'fas' : 'far'} fa-star\"></i>`;\n" +
    "    }\n" +
    "}";
  const FUNCBLOCK_NEW = "let activeChartPair = null;";

  const FILTER_LINE_OLD = "    else if (curF === 'trades') filtered = currentPairs.filter(p => starredPairs.includes(p.n));\n";

  const ROW_OLD =
    "        const isStarred = starredPairs.includes(p.n);\n" +
    "        const starIcon = `<i class=\"${isStarred ? 'fas' : 'far'} fa-star\" style=\"color:var(--gold); cursor:pointer; margin-right:4px; font-size:14px;\" onclick=\"event.stopPropagation(); toggleStar('${p.n}')\"></i>`;\n\n" +
    "        let cells = `<div class=\"col-pair-fixed\">${starIcon}<span style=\"font-weight:700;font-size:14px;\">${p.n}</span></div>`;";
  const ROW_NEW = "        let cells = `<div class=\"col-pair-fixed\"><span style=\"font-weight:700;font-size:14px;\">${p.n}</span></div>`;";

  html = applyList(html, [
    ['starredPairs + 3 star functions', FUNCBLOCK_OLD, FUNCBLOCK_NEW],
    ['trades filter branch', FILTER_LINE_OLD, ''],
    ['row star icon + cells', ROW_OLD, ROW_NEW],
  ], 'crypto');

  fs.writeFileSync(path, html, 'utf8');
}

// ---- STOCKS.html ----
{
  const path = '/home/ubuntu/ICI-SCANNER/stocks.html';
  let html = fs.readFileSync(path, 'utf8');
  console.log('--- stocks.html ---');
  html = applyList(html, COMMON, 'stocks');

  const DECL_OLD = "let starredPairs = JSON.parse(localStorage.getItem('ici_stocks_starred') || '[]');\n";

  const FUNCBLOCK_OLD =
    "function toggleStar(pair) {\n" +
    "    const idx = starredPairs.indexOf(pair);\n" +
    "    if (idx > -1) starredPairs.splice(idx, 1);\n" +
    "    else starredPairs.push(pair);\n" +
    "    localStorage.setItem('ici_stocks_starred', JSON.stringify(starredPairs));\n" +
    "    render();\n" +
    "    if (pair === activeChartPair) updateChartStarButton();\n" +
    "}\n\n" +
    "function toggleStarFromChart() {\n" +
    "    if (activeChartPair) toggleStar(activeChartPair);\n" +
    "}\n\n" +
    "function updateChartStarButton() {\n" +
    "    const btn = document.getElementById('chartStarBtn');\n" +
    "    if (btn) {\n" +
    "        const isStarred = starredPairs.includes(activeChartPair);\n" +
    "        btn.innerHTML = `<i class=\"${isStarred ? 'fas' : 'far'} fa-star\"></i>`;\n" +
    "    }\n" +
    "}";

  const FILTER_BLOCK_OLD =
    "    } else if (curF === 'trades') {\n" +
    "        filtered = allSymbols.filter(sym => starredPairs.includes(sym));\n" +
    "    }";
  const FILTER_BLOCK_NEW = "    }";

  const ROW_OLD =
    "        const isStarred = starredPairs.includes(sym);\n" +
    "        const starIcon = `<i class=\"${isStarred ? 'fas' : 'far'} fa-star\" style=\"color:var(--gold); cursor:pointer; margin-right:4px; font-size:14px;\" onclick=\"event.stopPropagation(); toggleStar('${sym}')\"></i>`;\n\n" +
    "        let cells = `<div class=\"col-pair-fixed\">${starIcon}<span style=\"font-weight:700;font-size:14px;\">${sym}</span></div>`;";
  const ROW_NEW = "        let cells = `<div class=\"col-pair-fixed\"><span style=\"font-weight:700;font-size:14px;\">${sym}</span></div>`;";

  html = applyList(html, [
    ['starredPairs declaration', DECL_OLD, ''],
    ['3 star functions', FUNCBLOCK_OLD, ''],
    ['trades filter block', FILTER_BLOCK_OLD, FILTER_BLOCK_NEW],
    ['row star icon + cells', ROW_OLD, ROW_NEW],
  ], 'stocks');

  fs.writeFileSync(path, html, 'utf8');
}

console.log('Done.');
