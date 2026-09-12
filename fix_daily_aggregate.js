const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let src = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_dailyaggfix', src);

// 1) Add aggregateDaily() right after aggregate4h()
const oldAgg = `function aggregate4h(hourly) {
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
}`;

const newAgg = `function aggregate4h(hourly) {
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
}`;

// 2) Make fetchForexCandlesFull use aggregateDaily() instead of Yahoo's native '1d'
const oldForex = `async function fetchForexCandlesFull(symbol, interval, totalWanted) {
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
            candles = aggregateDaily(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
        }
    } catch (e) { candles = []; }`;

const aggOk = src.includes(oldAgg);
const forexOk = src.includes(oldForex);

if (!aggOk || !forexOk) {
    console.error('MATCH FAILED', { aggOk, forexOk }, '- aborting, no changes made.');
    process.exit(1);
}

src = src.replace(oldAgg, newAgg);
src = src.replace(oldForex, newForex);
fs.writeFileSync(path, src);
console.log('Patched: added aggregateDaily(), forex 1day now built from 60m hourly data (fixes Open≈Close bug for all forex symbols)');
