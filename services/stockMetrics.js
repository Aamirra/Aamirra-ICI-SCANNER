const https = require('https');
const firebasePut = require('./database');
const calcEMA = require('../utils/emaCalc');
const calcSMA = require('../utils/smaCalc');
function sma50Of(a) { if (!a || a.length < 50) return null; let s = 0; for (let i = a.length - 50; i < a.length; i++) s += a[i]; return s / 50; }
function dotSig(price, sma) { return (sma && price != null) ? (price > sma ? 'bull' : 'bear') : null; }
const stockList = require('../stockList');
let stockBrokers = {};
try { stockBrokers = require('../stockBrokers.json'); } catch (e) { console.log('[Stocks] stockBrokers.json nahi mila'); }
const psxStockList = require('../psxStockList');
const { updateSLevelsForPair } = require('../core/slevelEngine');

// ── Fetch Yahoo candles (generic, full OHLCV, index-aligned) ──
function fetchYahooOnce(symbol, range, interval) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    return new Promise((resolve) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 429 || res.statusCode >= 500) { resolve({ retry: true, value: null }); return; }
                try {
                    const json = JSON.parse(data);
                    const result = json?.chart?.result?.[0];
                    if (!result) { resolve({ retry: false, value: null }); return; }
                    const quotes = result.indicators.quote[0];
                    if (!quotes || !quotes.close || quotes.close.length === 0) { resolve({ retry: false, value: null }); return; }
                    const timestamps = result.timestamp || [];
                    const rawOpens = quotes.open || [];
                    const rawHighs = quotes.high || [];
                    const rawLows = quotes.low || [];
                    const rawCloses = quotes.close || [];
                    const rawVolumes = quotes.volume || [];
                    const opens = [], highs = [], lows = [], closes = [], volumes = [], times = [];
                    for (let i = 0; i < rawCloses.length; i++) {
                        if (rawCloses[i] == null || rawOpens[i] == null || rawHighs[i] == null || rawLows[i] == null) continue;
                        opens.push(rawOpens[i]);
                        highs.push(rawHighs[i]);
                        lows.push(rawLows[i]);
                        closes.push(rawCloses[i]);
                        volumes.push(rawVolumes[i] || 0);
                        times.push(timestamps[i] ? new Date(timestamps[i] * 1000).toISOString() : null);
                    }
                    resolve({ retry: false, value: { opens, highs, lows, closes, volumes, times } });
                } catch (e) { resolve({ retry: true, value: null }); }
            });
        });
        req.on('error', () => resolve({ retry: true, value: null }));
        req.setTimeout(20000, () => { req.destroy(new Error('timeout')); });
    });
}

async function fetchYahooCandles(symbol, range = '1y', interval = '1d') {
    for (let attempt = 0; attempt < 4; attempt++) {
        const r = await fetchYahooOnce(symbol, range, interval);
        if (!r.retry) return r.value;
        if (attempt < 3) await new Promise(res => setTimeout(res, 1500 * (attempt + 1)));
    }
    return null;
}

// ── Aggregate 1h → 4h (closes only, used for legacy signal calc) ──
function aggregateTo4Hour(hourlyCloses) {
    if (!hourlyCloses || hourlyCloses.length === 0) return [];
    const agg = [];
    for (let i = 3; i < hourlyCloses.length; i += 4) agg.push(hourlyCloses[i]);
    return agg;
}

// ── Aggregate 1h OHLC → 4h OHLC (used for S01-S05 structure engine) ──
function aggregateOHLCTo4Hour(hourlyOHLC) {
    const empty = { opens: [], highs: [], lows: [], closes: [], times: [] };
    if (!hourlyOHLC || !hourlyOHLC.closes || hourlyOHLC.closes.length === 0) return empty;
    const { opens, highs, lows, closes, times } = hourlyOHLC;
    const aggOpens = [], aggHighs = [], aggLows = [], aggCloses = [], aggTimes = [];
    for (let i = 3; i < closes.length; i += 4) {
        aggOpens.push(opens[i - 3]);
        aggHighs.push(Math.max(highs[i - 3], highs[i - 2], highs[i - 1], highs[i]));
        aggLows.push(Math.min(lows[i - 3], lows[i - 2], lows[i - 1], lows[i]));
        aggCloses.push(closes[i]);
        aggTimes.push(times[i]);
    }
    return { opens: aggOpens, highs: aggHighs, lows: aggLows, closes: aggCloses, times: aggTimes };
}

function aggregateTo4HourSession(closes, times) {
    if (!closes || closes.length === 0) return [];
    if (!times || times.length !== closes.length) return aggregateTo4Hour(closes);
    const out = [];
    let curDay = null, k = 0;
    for (let i = 0; i < closes.length; i++) {
        const d = times[i] ? String(times[i]).slice(0, 10) : curDay;
        if (d !== curDay) { curDay = d; k = 0; }
        if (k % 4 === 0) out.push(closes[i]); else out[out.length - 1] = closes[i];
        k++;
    }
    return out;
}

function formatDollarVolume(volume, price) {
    const total = volume * price;
    if (total >= 1e9) return (total / 1e9).toFixed(2) + ' B';
    if (total >= 1e6) return (total / 1e6).toFixed(2) + ' M';
    if (total >= 1e3) return (total / 1e3).toFixed(2) + ' K';
    return total.toFixed(2);
}

// ── Pullback Detection (weekly required, min 20 candles) ──
const MIN_WEEKLY_CANDLES = 20;

function detectStockPullback(symbol, hourlyCloses, dailySignal, weeklySignal) {
    if (!hourlyCloses || hourlyCloses.length < 20) return null;
    const ema20 = calcEMA(hourlyCloses, 20);
    const sma50 = calcSMA(hourlyCloses, 50);
    if (!ema20 || !sma50) return null;

    if (!weeklySignal || !dailySignal) return null;
    if (dailySignal !== weeklySignal) return null;
    const direction = dailySignal;

    const structureValid = direction === 'bull' ? ema20 > sma50 : ema20 < sma50;
    if (!structureValid) return null;

    const lastClose = hourlyCloses[hourlyCloses.length - 1];
    let phase = null;
    if (direction === 'bull') {
        phase = lastClose < ema20 ? 'pullback' : 'mark_high';
    } else {
        phase = lastClose > ema20 ? 'pullback' : 'mark_low';
    }

    return {
        dir: direction,
        phase: phase || 'watching',
        firedAt: Date.now(),
        reminded: false
    };
}

// ── Stock sentiment (same Custom MTF Engine as stocks_sentiment.py, computed from data already fetched) ──
function ewmSeries(arr, span) {
    const a = 2 / (span + 1);
    const out = new Array(arr.length);
    out[0] = arr[0];
    for (let i = 1; i < arr.length; i++) out[i] = a * arr[i] + (1 - a) * out[i - 1];
    return out;
}
function windowScore(closes, lookback) {
    if (!closes || closes.length < 50) return null;
    const e10 = ewmSeries(closes, 10), e20 = ewmSeries(closes, 20);
    const rows = [];
    for (let i = 49; i < closes.length; i++) {
        let sum = 0;
        for (let j = i - 49; j <= i; j++) sum += closes[j];
        rows.push({ c: closes[i], e10: e10[i], e20: e20[i], s50: sum / 50 });
    }
    if (rows.length < lookback) return null;
    const w = rows.slice(-lookback);
    let pts = 0;
    w.forEach(r => { if (r.c > r.e10) pts++; if (r.e10 > r.e20) pts++; if (r.e20 > r.s50) pts++; });
    return pts / (w.length * 3);
}
function stockSentiment(c15, c1h, c1d) {
    if (!c15 || !c1h || !c1d) return null;
    const s15 = windowScore(c15.slice(-130), 32);
    const s1h = windowScore(c1h.slice(-147), 24);
    const s1d = windowScore(c1d, 14);
    if (s15 === null || s1h === null || s1d === null) return null;
    const intra = Math.round(((s15 * 0.4) + (s1h * 0.6)) * 100);
    const daily = Math.round(((s1h * 0.3) + (s1d * 0.7)) * 100);
    return {
        bullish_pct: intra, bearish_pct: 100 - intra,
        daily_bullish_pct: daily, daily_bearish_pct: 100 - daily,
        source: 'Custom MTF Engine'
    };
}

// ── Process a single stock list (generic) ──
async function processStockList(list, firebaseNode, prefix = '') {
    const results = [];
    const pbStates = {};

    const processSymbol = async (symbol) => {
        try {
            const yahooSymbol = prefix ? `${symbol}.${prefix}` : symbol.includes('.') ? symbol : symbol;
            console.log(`[Stocks] Fetching ${symbol} (${yahooSymbol})...`);

            const [dailyData, hourlyRaw, weeklyData, m15Data] = await Promise.all([
                fetchYahooCandles(yahooSymbol, '1y', '1d'),
                fetchYahooCandles(yahooSymbol, prefix ? '1y' : '6mo', '1h'),
                fetchYahooCandles(yahooSymbol, '5y', '1wk'),
                fetchYahooCandles(yahooSymbol, '60d', '15m')
            ]);

            if (!dailyData || dailyData.closes.length < 50) {
                console.warn(`[Stocks] Insufficient daily data for ${symbol}`);
                return;
            }

            const dailyCloses = dailyData.closes.slice(-200);
            const dailyVolumes = (dailyData.volumes || []).slice(-200);
            const currentPrice = dailyCloses[dailyCloses.length - 1];

            const ema20d = calcEMA(dailyCloses, 20);
            const signal1d = ema20d && currentPrice > ema20d ? 'bull' : 'bear';

            let signal1w = null;
            if (weeklyData && weeklyData.closes.length >= MIN_WEEKLY_CANDLES) {
                const weeklyCloses = weeklyData.closes.slice(-200);
                const ema20w = calcEMA(weeklyCloses, 20);
                if (ema20w) signal1w = weeklyCloses[weeklyCloses.length - 1] > ema20w ? 'bull' : 'bear';
            }

            let signal1h = null, signal4h = null, microMomentum = null;
            let hourlyCloses = [];
            const MIN_HOURLY_FOR_1H = 50;
            const MIN_4H_BARS = 20;
            if (hourlyRaw && hourlyRaw.closes.length >= MIN_HOURLY_FOR_1H) {
                hourlyCloses = hourlyRaw.closes;
                const currentHourly = hourlyCloses[hourlyCloses.length - 1];
                const ema20h = calcEMA(hourlyCloses, 20);
                if (ema20h) signal1h = currentHourly > ema20h ? 'bull' : 'bear';

                const fourHourCloses = aggregateTo4HourSession(hourlyCloses, hourlyRaw.times);
                if (fourHourCloses.length >= MIN_4H_BARS) {
                    const ema20_4h = calcEMA(fourHourCloses, 20);
                    if (ema20_4h) signal4h = fourHourCloses[fourHourCloses.length - 1] > ema20_4h ? 'bull' : 'bear';
                }

                if (!prefix && hourlyCloses.length >= 11) {
                    const close10h = hourlyCloses[hourlyCloses.length - 11];
                    microMomentum = ((currentHourly - close10h) / close10h) * 100;
                }
            }

            const close200Ago = dailyCloses[0];
            const longTermTrend = ((currentPrice - close200Ago) / close200Ago) * 100;
            const close10D = dailyCloses.length > 10 ? dailyCloses[dailyCloses.length - 11] : dailyCloses[0];
            const shortTermMomentum = ((currentPrice - close10D) / close10D) * 100;

            const last7Volumes = dailyVolumes.slice(-7);
            const volume7dAvg = calcSMA(last7Volumes, 7);
            const todayVolume = dailyVolumes[dailyVolumes.length - 1] || 0;
            const dollarVolume1d = formatDollarVolume(todayVolume, currentPrice) + (prefix ? ' PKR' : '');

            const metric = {
                name: symbol,
                brokers: stockBrokers[symbol] || null,
                price: parseFloat(currentPrice.toFixed(2)),
                signal1h, signal4h, signal1d, signal1w,
                sma50_1h: sma50Of(hourlyCloses), sma50_4h: sma50Of(aggregateTo4HourSession(hourlyCloses, hourlyRaw && hourlyRaw.times)), sma50_1d: sma50Of(dailyCloses), sma50_1w: sma50Of(weeklyData && weeklyData.closes),
                dot1h: dotSig(currentPrice, sma50Of(hourlyCloses)), dot4h: dotSig(currentPrice, sma50Of(aggregateTo4HourSession(hourlyCloses, hourlyRaw && hourlyRaw.times))), dot1d: dotSig(currentPrice, sma50Of(dailyCloses)), dot1w: dotSig(currentPrice, sma50Of(weeklyData && weeklyData.closes)),
                longTermTrend: parseFloat(longTermTrend.toFixed(2)),
                shortTermMomentum: parseFloat(shortTermMomentum.toFixed(2)),
                microMomentum: microMomentum !== null ? parseFloat(microMomentum.toFixed(2)) : null,
                volume7dAvg: volume7dAvg !== null ? Math.round(volume7dAvg) : null,
                dollarVolume1d,
                updatedAt: Date.now()
            };

            await firebasePut(`${firebaseNode}/${symbol}`, metric);
            if (!prefix) {
                const sent = stockSentiment(m15Data && m15Data.closes, hourlyRaw && hourlyRaw.closes, dailyData.closes);
                if (sent) await firebasePut(`sentiment/${symbol}`, sent);
            }
            results.push(metric);

            const pbState = detectStockPullback(symbol, hourlyCloses, signal1d, signal1w);
            if (pbState) pbStates[symbol] = pbState;

            // ── S01-S05 structure engine (same engine used for forex/crypto/indices) ──
            // Guard: a truncated/partial Yahoo weekly fetch computes a DIFFERENT (wrong)
            // structure than the full history, so only pass it through if it looks complete —
            // otherwise skip this cycle's write and leave the last good value in Firebase.
            const MIN_WEEKLY_FOR_SLEVEL = 100;
            const weeklyOkForSLevel = weeklyData && weeklyData.closes && weeklyData.closes.length >= MIN_WEEKLY_FOR_SLEVEL;
            const h4Raw = hourlyRaw ? aggregateOHLCTo4Hour(hourlyRaw) : null;
            // PSX: Yahoo .KA intraday (1h/15m) asal mai daily bars deta hai, isliye sirf weekly S-level likhte hain
            await updateSLevelsForPair(symbol, weeklyOkForSLevel ? weeklyData : null, prefix ? null : h4Raw, prefix ? null : m15Data, firebasePut);

            console.log(`[Stocks] ${symbol} saved (1H:${signal1h}, 4H:${signal4h}, 1D:${signal1d}, 1W:${signal1w})`);
        } catch (err) {
            console.error(`[Stocks] Error processing ${symbol}:`, err.message);
        }
    };

    const STOCK_BATCH_SIZE = 15;
    for (let i = 0; i < list.length; i += STOCK_BATCH_SIZE) {
        const slice = list.slice(i, i + STOCK_BATCH_SIZE);
        await Promise.all(slice.map(symbol => processSymbol(symbol)));
        await new Promise(r => setTimeout(r, 1500));
    }

    if (Object.keys(pbStates).length > 0) {
        await firebasePut(`${firebaseNode}PbState`, pbStates);
        console.log(`[Stocks] Pullback states updated for ${Object.keys(pbStates).length} stocks.`);
    }
    console.log(`[Stocks] Updated ${results.length}/${list.length} stocks in ${firebaseNode}`);
    return results;
}

async function calculateAndUpdateStockMetrics() {
    console.log('[Stocks] Starting Exness + PSX stock metrics...');
    await processStockList(stockList, 'stockMarketData');
    await processStockList(psxStockList, 'psxStockMarketData', 'KA');
    console.log('[Stocks] All stock metrics completed.');
}

module.exports = { calculateAndUpdateStockMetrics };
