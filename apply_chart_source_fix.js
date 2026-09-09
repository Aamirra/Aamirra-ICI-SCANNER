const fs = require('fs');

const targets = [
  { file: 'index.html', chartPairsLine: `    chartPairs = filtered.map(p => p.n);`, openChartAnchor: `function openChartForPair(pairName) {\n    chartPairs = currentDisplayPairs.length ? currentDisplayPairs : PAIRS.map(p=>p.n);` },
  { file: 'crypto.html', chartPairsLine: `    chartPairs = filtered.map(p => p.n);`, openChartAnchor: `function openChartForPair(pairName) {\n    chartPairs = currentDisplayPairs.length ? currentDisplayPairs : PAIRS.map(p=>p.n);` },
  { file: 'stocks.html', chartPairsLine: `    chartPairs = filtered.slice();`, openChartAnchor: `function openChartForPair(pairName) {\n    chartPairs = currentDisplayPairs.length ? currentDisplayPairs : Object.keys(MARKET_DATA).sort();` },
];

targets.forEach(({file, chartPairsLine, openChartAnchor}) => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  const guardedLine = `if (window.activeChartSource !== 'watchlist') { ${chartPairsLine.trim()} }`;
  if (content.includes(chartPairsLine)) {
    content = content.split(chartPairsLine).join('    ' + guardedLine);
    log.push('render() chartPairs overwrite guarded OK');
  } else {
    log.push('WARNING: chartPairs line not found in render()');
  }

  const openChartReplacement = openChartAnchor.replace('function openChartForPair(pairName) {\n', "function openChartForPair(pairName) {\n    window.activeChartSource = 'screener';\n");
  if (content.includes(openChartAnchor)) {
    content = content.split(openChartAnchor).join(openChartReplacement);
    log.push('openChartForPair sets source=screener OK');
  } else {
    log.push('WARNING: openChartForPair anchor not found');
  }

  const wlAnchor = `window.openChartFromWatchlist = function(sym) {`;
  const wlReplacement = `window.openChartFromWatchlist = function(sym) {
        window.activeChartSource = 'watchlist';`;
  if (content.includes(wlAnchor)) {
    content = content.split(wlAnchor).join(wlReplacement);
    log.push('openChartFromWatchlist sets source=watchlist OK');
  } else {
    log.push('WARNING: openChartFromWatchlist anchor not found');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
