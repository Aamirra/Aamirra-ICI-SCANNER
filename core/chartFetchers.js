// Cold (full history, parallel) + warm (tail-only) fetchers for
// /api/crypto-chart, /api/forex-chart and /api/stock-chart.
const https = require('https');
const keepAliveAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });

// ---------- Shared: custom-interval parsing + aggregation ----------
function parseCustomInterval(intervalStr) {
    const m = /^(\d+)([mhdw])$/i.exec(intervalStr || '');
    if (!m) return null;
    return { value: parseInt(m[1], 10), unit: m[2].toLowerCase() };
}

function aggregateCandles(candles, groupSize) {
    if (groupSize <= 1) return candles.map(c => ({ time: c.time, open: c.open, high: Math.max(c.high, c.open, c.close), low: Math.min(c.low, c.open, c.close), close: c.close }));
    const agg = [];
    for (let i = 0; i + groupSize <= candles.length; i += groupSize) {
        const group = candles.slice(i, i + groupSize);
        agg.push({
            time: group[0].time,
            open: group[0].open,
            high: Math.max.apply(null, group.map(c => c.high).concat([group[0].open, group[group.length - 1].close])),
            low: Math.min.apply(null, group.map(c => c.low).concat([group[0].open, group[group.length - 1].close])),
            close: group[group.length - 1].close
        });
    }
    return agg;
}

// ---------- Binance (crypto) ----------
const LEGACY_INTERVAL_MAP = { '1h': '1h', '4h': '4h', '1day': '1d', '1week': '1w' };
const BINANCE_NATIVE = new Set(['1m','3m','5m','15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w','1M']);
const BINANCE_CANDLE_MS = {
    '1m':60000,'3m':180000,'5m':300000,'15m':900000,'30m':1800000,
    '1h':3600000,'2h':7200000,'4h':14400000,'6h':21600000,'8h':28800000,'12h':43200000,
    '1d':86400000,'3d':259200000,'1w':604800000,'1M':2592000000
};

function resolveBinanceInterval(interval) {
    if (LEGACY_INTERVAL_MAP[interval]) return { base: LEGACY_INTERVAL_MAP[interval], groupSize: 1 };
    if (BINANCE_NATIVE.has(interval)) return { base: interval, groupSize: 1 };
    const parsed = parseCustomInterval(interval);
    if (!parsed) return { base: '1h', groupSize: 1 };
    if (parsed.unit === 'm') return { base: '1m', groupSize: parsed.value };
    if (parsed.unit === 'h') return { base: '1h', groupSize: parsed.value };
    if (parsed.unit === 'd') return { base: '1d', groupSize: parsed.value };
    if (parsed.unit === 'w') return { base: '1w', groupSize: parsed.value };
    return { base: '1h', groupSize: 1 };
}

function binanceSymbolOf(symbol) { return symbol.replace('USD', 'USDT'); }

function fetchKlinesSpot(binanceSymbol, binanceInterval, endTime) {
    return new Promise((resolve) => {
        let url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=1000`;
        if (endTime) url += `&endTime=${endTime}`;
        https.get(url, { agent: keepAliveAgent, headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(Array.isArray(json) ? json : []);
                } catch (e) { resolve([]); }
            });
        }).on('error', () => resolve([]));
    });
}

// ---- Binance FUTURES klines (preferred); falls back to spot for symbols not listed on futures ----
function fetchKlinesFutures(binanceSymbol, binanceInterval, endTime) {
    return new Promise((resolve) => {
        let url = 'https://fapi.binance.com/fapi/v1/klines?symbol=' + binanceSymbol + '&interval=' + binanceInterval + '&limit=1000';
        if (endTime) url += '&endTime=' + endTime;
        https.get(url, { agent: keepAliveAgent, headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => {
                try { const j = JSON.parse(data); resolve(Array.isArray(j) ? j : null); }
                catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}
async function fetchKlines(binanceSymbol, binanceInterval, endTime) {
    const f = await fetchKlinesFutures(binanceSymbol, binanceInterval, endTime);
    if (f && f.length) return f;
    return fetchKlinesSpot(binanceSymbol, binanceInterval, endTime);
}

function klinesToCandles(klines) {
    return klines.map(k => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4])
    }));
}

function dedupeSorted(klines) {
    klines.sort((a, b) => a[0] - b[0]);
    const out = [];
    let lastT = null;
    for (const k of klines) {
        if (k[0] === lastT) continue;
        out.push(k);
        lastT = k[0];
    }
    return out;
}

async function fetchCryptoCandlesFull(symbol, interval, totalWanted) {
    const { base, groupSize } = resolveBinanceInterval(interval);
    const stepMs = (BINANCE_CANDLE_MS[base] || 3600000) * 1000;
    const binanceSymbol = binanceSymbolOf(symbol);
    const rawWanted = totalWanted * groupSize;
    const batches = Math.min(Math.ceil(rawWanted / 1000), 20);
    const now = Date.now();

    const jobs = [];
    for (let i = 0; i < batches; i++) {
        jobs.push(fetchKlines(binanceSymbol, base, i === 0 ? null : now - i * stepMs));
    }
    const results = await Promise.all(jobs);
    let all = dedupeSorted([].concat(...results));
    let candles = klinesToCandles(all);
    if (groupSize > 1) candles = aggregateCandles(candles, groupSize);
    if (candles.length > totalWanted) candles = candles.slice(candles.length - totalWanted);
    return candles;
}

async function refreshCryptoCandles(meta, oldCandles) {
    const { base, groupSize } = resolveBinanceInterval(meta.interval);
    if (groupSize > 1) {
        return fetchCryptoCandlesFull(meta.symbol, meta.interval, (oldCandles && oldCandles.length) || 500);
    }
    const binanceSymbol = binanceSymbolOf(meta.symbol);
    const latest = klinesToCandles(await fetchKlines(binanceSymbol, base, null));
    if (!latest.length) return oldCandles;
    if (!oldCandles || !oldCandles.length) return latest;
    const cutoff = latest[0].time;
    return oldCandles.filter(c => c.time < cutoff).concat(latest);
}

// ---------- Yahoo Finance (stocks / PSX / forex) ----------
function fetchYahooChart(yahooSymbol, yInterval, yRange) {
    return new Promise((resolve) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?range=${yRange}&interval=${yInterval}`;
        https.get(url, { agent: keepAliveAgent, headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve((json && json.chart && json.chart.result && json.chart.result[0]) || null);
                } catch (e) {
                    console.error('[fetchYahooChart PARSE ERROR]', yahooSymbol, yInterval, yRange, 'status:', r.statusCode, 'dataLen:', data.length, 'snippet:', data.slice(0, 200), e.message);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error('[fetchYahooChart REQUEST ERROR]', yahooSymbol, yInterval, yRange, err.message);
            resolve(null);
        });
    });
}

function yahooToCandles(result) {
    if (!result || !result.timestamp) return [];
    const q = result.indicators && result.indicators.quote && result.indicators.quote[0];
    if (!q) return [];
    const candles = [];
    for (let i = 0; i < result.timestamp.length; i++) {
        const o = q.open[i], h = q.high[i], l = q.low[i], c = q.close[i];
        if (o == null || h == null || l == null || c == null) continue;
        candles.push({ time: result.timestamp[i], open: o, high: h, low: l, close: c });
    }
    if (candles.length > 1) {
        const isFlat = c => c.high === c.low && c.open === c.close;
        let n = 0;
        while (n < candles.length - 1 && isFlat(candles[candles.length - 1 - n])) n++;
        if (n >= 3) candles.splice(candles.length - n, n);
        else if (n > 0) candles.pop();
    }
    return candles;
}

function aggregate4h(hourly) {
    const agg = [];
    for (let i = 0; i + 3 < hourly.length; i += 4) {
        const group = hourly.slice(i, i + 4);
        agg.push({
            time: group[0].time,
            open: group[0].open,
            high: Math.max.apply(null, group.map(c => c.high)),
            low: Math.min.apply(null, group.map(c => c.low)),
            close: group[group.length - 1].close
        });
    }
    return agg;
}

function aggregateDaily(hourly) {
    const groups = {};
    const order = [];
    for (const c of hourly) {
        const key = new Date(c.time * 1000).toISOString().slice(0, 10);
        if (!groups[key]) { groups[key] = []; order.push(key); }
        groups[key].push(c);
    }
    return order.map(key => {
        const group = groups[key];
        return {
            time: group[0].time,
            open: group[0].open,
            high: Math.max.apply(null, group.map(c => c.high)),
            low: Math.min.apply(null, group.map(c => c.low)),
            close: group[group.length - 1].close
        };
    });
}

function fixNativeOpens(daily) {
    const fixed = [];
    for (let i = 0; i < daily.length; i++) {
        const c = daily[i];
        const open = i === 0 ? c.open : daily[i - 1].close;
        fixed.push({ time: c.time, open, high: c.high, low: c.low, close: c.close });
    }
    return fixed;
}

function mergeOlderWithRecent(older, recent) {
    if (!recent.length) return older;
    const cutoff = recent[0].time;
    const trimmedOlder = older.filter(c => c.time < cutoff);
    return trimmedOlder.concat(recent);
}

const YAHOO_NATIVE_MINUTES = new Set([1, 2, 5, 15, 30]);

async function fetchYahooCustomCandles(yahooSymbol, custom) {
    const { value, unit } = custom;
    if (unit === 'm') {
        if (YAHOO_NATIVE_MINUTES.has(value)) {
            return yahooToCandles(await fetchYahooChart(yahooSymbol, value + 'm', value === 1 ? '7d' : '60d'));
        }
        const base = yahooToCandles(await fetchYahooChart(yahooSymbol, '1m', '7d'));
        return aggregateCandles(base, value);
    }
    if (unit === 'h') {
        const base = yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d'));
        return aggregateCandles(base, value);
    }
    if (unit === 'd') {
        const recentDaily = aggregateDaily(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
        const olderDaily = fixNativeOpens(yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', '10y')));
        const daily = mergeOlderWithRecent(olderDaily, recentDaily);
        return aggregateCandles(daily, value);
    }
    if (unit === 'w') {
        const weekly = yahooToCandles(await fetchYahooChart(yahooSymbol, '1wk', '20y'));
        return aggregateCandles(weekly, value);
    }
    return [];
}

async function fetchStockCandlesFull(symbol, market, interval, totalWanted) {
    const yahooSymbol = market === 'psx' ? `${symbol}.KA` : symbol;
    let candles = [];
    try {
        if (interval === '1h') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d'));
        } else if (interval === '4h') {
            candles = aggregate4h(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
        } else if (interval === '1week') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '1wk', '20y'));
        } else {
            const custom = parseCustomInterval(interval);
            if (custom) {
                candles = await fetchYahooCustomCandles(yahooSymbol, custom);
            } else {
                const recentDaily = aggregateDaily(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
                const olderDaily = fixNativeOpens(yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', '10y')));
                candles = mergeOlderWithRecent(olderDaily, recentDaily);
            }
        }
    } catch (e) { console.error('[fetchStockCandlesFull ERROR]', symbol, interval, e && e.stack); candles = []; }
    if (candles.length > totalWanted) candles = candles.slice(candles.length - totalWanted);
    return candles;
}

async function refreshStockCandles(meta) {
    return fetchStockCandlesFull(meta.symbol, meta.market, meta.interval, 15000);
}

// ---------- Yahoo Finance (forex) ----------
const NON_FOREX_YAHOO_MAP = {
    'XAUUSD': 'GC=F',
    'USOIL':  'CL=F',
    'US500':  '^GSPC',
    'US100':  '^NDX',
    'US30':   '^DJI',
    'GER40':  '^GDAXI',
    'UK100':  '^FTSE',
    'JPN225': '^N225',
    'BTCUSD': 'BTC-USD',
    'ETHUSD': 'ETH-USD',
};

// Yahoo futures ~24h chalte hain (CFD jaisa); cash index sirf ~7 bars/day deta hai
const INDEX_FUT_CHART = { US500: 'ES=F', US100: 'NQ=F', US30: 'YM=F', JPN225: 'NKD=F' };

function forexYahooSymbol(pairName) {
    if (NON_FOREX_YAHOO_MAP[pairName]) return NON_FOREX_YAHOO_MAP[pairName];
    return `${pairName}=X`;
}

// Yahoo forex bad-tick wicks hatao: wick ko recent median range ke 1.5x tak limit karo
function cleanForexWicks(candles) {
    const N = 50, K = 0.6;
    const ranges = candles.map(c => c.high - c.low);
    const out = new Array(candles.length);
    for (let i = 0; i < candles.length; i++) {
        const c = candles[i];
        const from = Math.max(0, i - N);
        const win = ranges.slice(from, i + 1).filter(r => r > 0).sort((x, y) => x - y);
        if (win.length < 10) { out[i] = c; continue; }
        const med = win[Math.floor(win.length / 2)];
        const allow = med * K;
        const bodyHi = Math.max(c.open, c.close), bodyLo = Math.min(c.open, c.close);
        out[i] = {
            time: c.time,
            open: c.open,
            high: Math.min(c.high, bodyHi + allow),
            low: Math.max(c.low, bodyLo - allow),
            close: c.close
        };
    }
    return out;
}

async function fetchForexCandlesFull(symbol, interval, totalWanted) {
    if (symbol === 'BTCUSD' || symbol === 'ETHUSD') {
        try { const bc = await fetchCryptoCandlesFull(symbol, interval, totalWanted); if (bc && bc.length) return bc; } catch (e) {}
    }
    const yahooSymbol = forexYahooSymbol(symbol);
    const futSym = INDEX_FUT_CHART[symbol];
    if (futSym && (interval === '1h' || interval === '4h')) {
        try {
            const fut = yahooToCandles(await fetchYahooChart(futSym, '60m', '730d'));
            if (fut.length >= 200) {
                let out = interval === '4h' ? aggregate4h(fut) : fut;
                if (out.length > totalWanted) out = out.slice(out.length - totalWanted);
                return out;
            }
        } catch (e) { /* fallback: cash index neeche */ }
    }
    let candles = [];
    try {
        if (interval === '1h') {
            candles = cleanForexWicks(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
        } else if (interval === '4h') {
            candles = aggregate4h(cleanForexWicks(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d'))));
        } else if (interval === '1week') {
            candles = yahooToCandles(await fetchYahooChart(yahooSymbol, '1wk', '20y'));
        } else {
            const custom = parseCustomInterval(interval);
            if (custom) {
                candles = await fetchYahooCustomCandles(yahooSymbol, custom);
            } else {
                const recentDaily = aggregateDaily(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
                const olderDaily = fixNativeOpens(yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', '10y')));
                candles = mergeOlderWithRecent(olderDaily, recentDaily);
            }
        }
    } catch (e) { candles = []; }
    if (candles.length > totalWanted) candles = candles.slice(candles.length - totalWanted);
    return candles;
}

async function refreshForexCandles(meta) {
    return fetchForexCandlesFull(meta.symbol, meta.interval, 15000);
}

module.exports = { fetchCryptoCandlesFull, refreshCryptoCandles, fetchStockCandlesFull, refreshStockCandles, fetchForexCandlesFull, refreshForexCandles };
