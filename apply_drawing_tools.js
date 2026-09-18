// apply_drawing_tools.js
// Adds the ICI Drawing Tools (trendline, fib, rectangle, etc.) to
// index.html, crypto.html, stocks.html.
// Safe to re-run: creates a .bak-drawingtools backup and skips
// anything already patched.
//
// Usage:  node apply_drawing_tools.js
// Then:   pm2 restart <your app name>   (check with: pm2 list)

const fs = require('fs');

const FILES = ['index.html', 'crypto.html', 'stocks.html'];
const SCRIPT_TAG = '<script src="drawing-tools.js?v=1"></script>\n';

const DESTROY_OLD =
`    const container = document.getElementById('tv_chart_'+slot);
    container.innerHTML = '';`;
const DESTROY_NEW =
`    const container = document.getElementById('tv_chart_'+slot);
    if (window.ICIDrawingTools) { try { window.ICIDrawingTools.destroy(slot); } catch(e){} }
    container.innerHTML = '';`;

const INIT_OLD =
`            await window.ICIIndicator.render({
                chart, series, container, candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(symbol, tfKey)
            });`;
const INIT_NEW = INIT_OLD +
`
            if (window.ICIDrawingTools) { try { window.ICIDrawingTools.init({ chart, series, container, slot, symbol, interval }); } catch(e){} }`;

const SCRIPT_TAG_RE = /<script[^>]*barReplay\.js[^>]*><\/script>/;

let anyIssues = false;

FILES.forEach((file) => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  ${file} not found — skipping`);
    anyIssues = true;
    return;
  }

  let html = fs.readFileSync(file, 'utf8');
  const backupPath = file + '.bak-drawingtools';
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, html);
  }

  let changed = false;

  // 1. Script tag
  if (!html.includes('drawing-tools.js')) {
    if (SCRIPT_TAG_RE.test(html)) {
      html = html.replace(SCRIPT_TAG_RE, (m) => SCRIPT_TAG + m);
      changed = true;
    } else {
      console.log(`⚠️  ${file}: could not find barReplay.js script tag — add manually:\n    ${SCRIPT_TAG.trim()}`);
      anyIssues = true;
    }
  } else {
    console.log(`ℹ️  ${file}: script tag already present`);
  }

  // 2. destroy() call
  if (!html.includes('ICIDrawingTools.destroy')) {
    if (html.includes(DESTROY_OLD)) {
      html = html.replace(DESTROY_OLD, DESTROY_NEW);
      changed = true;
    } else {
      console.log(`⚠️  ${file}: destroy() anchor not found in drawChart() — add manually`);
      anyIssues = true;
    }
  } else {
    console.log(`ℹ️  ${file}: destroy() call already present`);
  }

  // 3. init() call
  if (!html.includes('ICIDrawingTools.init')) {
    if (html.includes(INIT_OLD)) {
      html = html.replace(INIT_OLD, INIT_NEW);
      changed = true;
    } else {
      console.log(`⚠️  ${file}: init() anchor not found in drawChart() — add manually`);
      anyIssues = true;
    }
  } else {
    console.log(`ℹ️  ${file}: init() call already present`);
  }

  if (changed) {
    fs.writeFileSync(file, html);
    console.log(`✅ ${file} patched (backup saved as ${backupPath})`);
  } else {
    console.log(`ℹ️  ${file}: no changes written`);
  }
});

console.log('');
if (anyIssues) {
  console.log('⚠️  Some files need a manual check (see warnings above).');
} else {
  console.log('✅ All files patched successfully.');
}
console.log('Next: restart your app, e.g.  pm2 restart ici-server   (run `pm2 list` to confirm the process name)');
