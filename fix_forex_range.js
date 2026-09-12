const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let src = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_rangefix', src);

const oldForex = `async function fetchForexCandlesFull(symbol, interval, totalWanted) {
    const yahooSymbol = forexYahooSymbol(symbol);
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

const newForex = `async function fetchForexCandlesFull(symbol, interval, totalWanted) {
    const yahooSymbol = forexYahooSymbol(symbol);
    let candles = [];
    try {
        if (interval === '1h') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d'));
        } else if (interval === '4h') {
            candles = aggregate4h(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
        } else if (interval === '1week') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '1wk', '20y'));
        } else {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', '10y'));
        }
    } catch (e) { candles = []; }`;

if (!src.includes(oldForex)) {
    console.error('MATCH FAILED — forex block not found, aborting. No changes made.');
    process.exit(1);
}
src = src.replace(oldForex, newForex);
fs.writeFileSync(path, src);
console.log('Patched fetchForexCandlesFull: 1week range -> 20y, 1day range -> 10y');
