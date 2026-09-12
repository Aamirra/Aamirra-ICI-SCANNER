const fs = require('fs');

// ============ 1) chartFetchers.js ============
const cfPath = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let cf = fs.readFileSync(cfPath, 'utf8');
fs.writeFileSync(cfPath + '.before_forexchart', cf);

const cfOld = `module.exports = { fetchCryptoCandlesFull, refreshCryptoCandles, fetchStockCandlesFull, refreshStockCandles };`;
const cfNew = `// ---------- Yahoo Finance (forex) ----------
function forexYahooSymbol(pairName) {
    // e.g. EURUSD -> EURUSD=X, XAUUSD -> XAUUSD=X
    return \`\${pairName}=X\`;
}

async function fetchForexCandlesFull(symbol, interval, totalWanted) {
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
    } catch (e) { candles = []; }
    if (candles.length > totalWanted) candles = candles.slice(candles.length - totalWanted);
    return candles;
}

async function refreshForexCandles(meta) {
    return fetchForexCandlesFull(meta.symbol, meta.interval, 15000);
}

module.exports = { fetchCryptoCandlesFull, refreshCryptoCandles, fetchStockCandlesFull, refreshStockCandles, fetchForexCandlesFull, refreshForexCandles };`;

const cfOk = cf.includes(cfOld);
if (cfOk) cf = cf.replace(cfOld, cfNew);
fs.writeFileSync(cfPath, cf);

// ============ 2) ici-server.js ============
const srvPath = '/home/ubuntu/ICI-SCANNER/ici-server.js';
let srv = fs.readFileSync(srvPath, 'utf8');
fs.writeFileSync(srvPath + '.before_forexchart', srv);

// 2a) background refresh registration
const srvOld1 = `chartCache.startBackgroundRefresh({
    crypto: chartFetchers.refreshCryptoCandles,
    stock: chartFetchers.refreshStockCandles
});`;
const srvNew1 = `chartCache.startBackgroundRefresh({
    crypto: chartFetchers.refreshCryptoCandles,
    stock: chartFetchers.refreshStockCandles,
    forex: chartFetchers.refreshForexCandles
});`;
const srvOk1 = srv.includes(srvOld1);
if (srvOk1) srv = srv.replace(srvOld1, srvNew1);

// 2b) new /api/forex-chart route, added right before /api/stock-chart
const srvOld2 = `    if (safePath === '/api/stock-chart') {`;
const srvNew2 = `    if (safePath === '/api/forex-chart') {
        (async () => {
            try {
                const urlParams = new URL(req.url, \`http://\${req.headers.host}\`).searchParams;
                const symbol = urlParams.get('symbol');
                const interval = urlParams.get('interval') || '1h';
                const totalWanted = Math.min(parseInt(urlParams.get('limit')) || 15000, 15000);

                if (!symbol) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'symbol is required' }));
                    return;
                }

                const cacheKey = \`forex:\${symbol}:\${interval}\`;
                const fullCandles = await chartCache.getCandles(
                    cacheKey,
                    { type: 'forex', symbol, interval },
                    () => chartFetchers.fetchForexCandlesFull(symbol, interval, 15000)
                );
                const candles = fullCandles.length > totalWanted ? fullCandles.slice(fullCandles.length - totalWanted) : fullCandles;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ symbol, interval, candles }));
            } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        })();
        return;
    }
    if (safePath === '/api/stock-chart') {`;
const srvOk2 = srv.includes(srvOld2);
if (srvOk2) srv = srv.replace(srvOld2, srvNew2);

fs.writeFileSync(srvPath, srv);
console.log('Patches applied:', { cfOk, srvOk1, srvOk2 });
