const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let src = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_stockdailyfix', src);

const oldStock = `async function fetchStockCandlesFull(symbol, market, interval, totalWanted) {
    const yahooSymbol = market === 'psx' ? \`\${symbol}.KA\` : symbol;
    let candles = [];
    try {
        if (interval === '1h') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d'));
        } else if (interval === '4h') {
            candles = aggregate4h(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
        } else if (interval === '1week') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '1wk', 'max'));
        } else {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', 'max'));
        }
    } catch (e) { candles = []; }`;

const newStock = `async function fetchStockCandlesFull(symbol, market, interval, totalWanted) {
    const yahooSymbol = market === 'psx' ? \`\${symbol}.KA\` : symbol;
    let candles = [];
    try {
        if (interval === '1h') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d'));
        } else if (interval === '4h') {
            candles = aggregate4h(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
        } else if (interval === '1week') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '1wk', '20y'));
        } else {
            const recentDaily = aggregateDaily(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
            const olderDaily = fixNativeOpens(yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', '10y')));
            candles = mergeOlderWithRecent(olderDaily, recentDaily);
        }
    } catch (e) { candles = []; }`;

if (!src.includes(oldStock)) {
    console.error('MATCH FAILED - stock block not found, aborting. No changes made.');
    process.exit(1);
}
src = src.replace(oldStock, newStock);
fs.writeFileSync(path, src);
console.log('Patched fetchStockCandlesFull: same daily/weekly range=max fix applied as forex');
