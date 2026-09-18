const fs = require('fs');
const file = 'stocks.html';
let html = fs.readFileSync(file, 'utf8');

const OLD = `            await window.ICIIndicator.render({
                chart, series, container, candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(sym, tfKey)
            });`;

const NEW = OLD + `
            if (window.ICIDrawingTools) { try { window.ICIDrawingTools.init({ chart, series, container, slot, symbol: sym, interval }); } catch(e){} }`;

if (html.includes('ICIDrawingTools.init')) {
  console.log('ℹ️  stocks.html: init() already present, no change made');
} else if (html.includes(OLD)) {
  html = html.replace(OLD, NEW);
  fs.writeFileSync(file, html);
  console.log('✅ stocks.html: init() added successfully');
} else {
  console.log('⚠️  anchor still not found — paste stocks.html lines 1440-1460 here');
}
