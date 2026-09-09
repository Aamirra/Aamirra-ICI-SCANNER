const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let js = fs.readFileSync(path, 'utf8');

function apply(label, oldStr, newStr) {
  if (!js.includes(oldStr)) {
    console.error('FAILED: ' + label);
    return false;
  }
  js = js.replace(oldStr, newStr);
  console.log('OK: ' + label);
  return true;
}

// 1. aggregate1hTo4h helper — add opens support
apply('aggregate1hTo4h (opens support)',
`function aggregate1hTo4h(candles) {
    if (!candles || candles.closes.length < 4) return null;
    const { closes, highs, lows, times, volumes } = candles;
    const aggCloses = [], aggHighs = [], aggLows = [], aggTimes = [], aggVolumes = [];
    for (let i = 3; i < closes.length; i += 4) {
        const cSlice = closes.slice(i-3, i+1);
        const hSlice = highs.slice(i-3, i+1);
        const lSlice = lows.slice(i-3, i+1);
        const vSlice = volumes.slice(i-3, i+1);
        aggCloses.push(cSlice[cSlice.length-1]);
        aggHighs.push(Math.max(...hSlice));
        aggLows.push(Math.min(...lSlice));
        aggTimes.push(times[i]);
        aggVolumes.push(vSlice.reduce((a,b)=>a+b,0));
    }
    return { closes: aggCloses, highs: aggHighs, lows: aggLows, times: aggTimes, volumes: aggVolumes };
}`,
`function aggregate1hTo4h(candles) {
    if (!candles || candles.closes.length < 4) return null;
    const { closes, highs, lows, times, volumes, opens } = candles;
    const aggOpens = [], aggCloses = [], aggHighs = [], aggLows = [], aggTimes = [], aggVolumes = [];
    for (let i = 3; i < closes.length; i += 4) {
        const oSlice = opens ? opens.slice(i-3, i+1) : null;
        const cSlice = closes.slice(i-3, i+1);
        const hSlice = highs.slice(i-3, i+1);
        const lSlice = lows.slice(i-3, i+1);
        const vSlice = volumes.slice(i-3, i+1);
        aggOpens.push(oSlice ? oSlice[0] : cSlice[0]);
        aggCloses.push(cSlice[cSlice.length-1]);
        aggHighs.push(Math.max(...hSlice));
        aggLows.push(Math.min(...lSlice));
        aggTimes.push(times[i]);
        aggVolumes.push(vSlice.reduce((a,b)=>a+b,0));
    }
    return { opens: aggOpens, closes: aggCloses, highs: aggHighs, lows: aggLows, times: aggTimes, volumes: aggVolumes };
}`);

// 2. Finnhub fetch (indices multi-source) — capture opens
apply('Finnhub fetch (opens)',
`                const url = \`https://finnhub.io/api/v1/stock/candle?symbol=\${finnhubSymbol}&resolution=\${resolution}&count=200&token=\${process.env.FINNHUB_KEY}\`;
                const res = await fetch(url);
                const json = await res.json();
                if (json.s !== 'ok' || !json.c) return null;
                const times = json.t.map(t => new Date(t * 1000).toISOString());
                let result = { closes: json.c, highs: json.h, lows: json.l, volumes: json.v || [], times };
                if (tf === '4h') result = aggregate1hTo4h(result);
                return result && result.closes.length >= 20 ? result : null;`,
`                const url = \`https://finnhub.io/api/v1/stock/candle?symbol=\${finnhubSymbol}&resolution=\${resolution}&count=200&token=\${process.env.FINNHUB_KEY}\`;
                const res = await fetch(url);
                const json = await res.json();
                if (json.s !== 'ok' || !json.c) return null;
                const times = json.t.map(t => new Date(t * 1000).toISOString());
                let result = { opens: json.o, closes: json.c, highs: json.h, lows: json.l, volumes: json.v || [], times };
                if (tf === '4h') result = aggregate1hTo4h(result);
                return result && result.closes.length >= 20 ? result : null;`);

// 3. Yahoo fetch (indices multi-source) — capture opens
apply('Yahoo fetch indices (opens)',
`                const timestamps = result.timestamp || [];
                let closes = quotes.close.filter(v => v !== null);
                let highs = (quotes.high || []).filter(v => v !== null);
                let lows = (quotes.low || []).filter(v => v !== null);
                let volumes = (quotes.volume || []).map(v => v || 0);
                let times = timestamps.map(t => new Date(t * 1000).toISOString());
                const minLen = Math.min(closes.length, highs.length, lows.length, times.length);
                let candles = { closes: closes.slice(-minLen), highs: highs.slice(-minLen), lows: lows.slice(-minLen), volumes: volumes.slice(-minLen), times: times.slice(-minLen) };
                if (tf === '4h') candles = aggregate1hTo4h(candles);
                return candles && candles.closes.length >= 20 ? candles : null;`,
`                const timestamps = result.timestamp || [];
                let opens = (quotes.open || []).filter(v => v !== null);
                let closes = quotes.close.filter(v => v !== null);
                let highs = (quotes.high || []).filter(v => v !== null);
                let lows = (quotes.low || []).filter(v => v !== null);
                let volumes = (quotes.volume || []).map(v => v || 0);
                let times = timestamps.map(t => new Date(t * 1000).toISOString());
                const minLen = Math.min(opens.length, closes.length, highs.length, lows.length, times.length);
                let candles = { opens: opens.slice(-minLen), closes: closes.slice(-minLen), highs: highs.slice(-minLen), lows: lows.slice(-minLen), volumes: volumes.slice(-minLen), times: times.slice(-minLen) };
                if (tf === '4h') candles = aggregate1hTo4h(candles);
                return candles && candles.closes.length >= 20 ? candles : null;`);

// 4. TwelveData fetch (indices multi-source) — capture opens
apply('TwelveData fetch indices (opens)',
`                if (json.code === 429 || !json.values) return null;
                const sorted = [...json.values].sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
                const closes = sorted.map(v => parseFloat(v.close));
                const highs = sorted.map(v => parseFloat(v.high));
                const lows = sorted.map(v => parseFloat(v.low));
                const volumes = sorted.map(v => parseFloat(v.volume || '0'));
                const times = sorted.map(v => v.datetime);
                let candles = { closes, highs, lows, volumes, times };
                if (tf === '4h') candles = aggregate1hTo4h(candles);
                return candles && candles.closes.length >= 20 ? candles : null;`,
`                if (json.code === 429 || !json.values) return null;
                const sorted = [...json.values].sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
                const opens = sorted.map(v => parseFloat(v.open));
                const closes = sorted.map(v => parseFloat(v.close));
                const highs = sorted.map(v => parseFloat(v.high));
                const lows = sorted.map(v => parseFloat(v.low));
                const volumes = sorted.map(v => parseFloat(v.volume || '0'));
                const times = sorted.map(v => v.datetime);
                let candles = { opens, closes, highs, lows, volumes, times };
                if (tf === '4h') candles = aggregate1hTo4h(candles);
                return candles && candles.closes.length >= 20 ? candles : null;`);

// 5. Alpha Vantage fetch (indices multi-source) — capture opens
apply('Alpha Vantage fetch indices (opens)',
`                const entries = Object.entries(series).sort(([a],[b]) => new Date(a) - new Date(b));
                const closes = [], highs = [], lows = [], volumes = [], times = [];
                for (const [date, values] of entries.slice(-200)) {
                    closes.push(parseFloat(values['4. close']));
                    highs.push(parseFloat(values['2. high']));
                    lows.push(parseFloat(values['3. low']));
                    volumes.push(parseFloat(values['5. volume']));
                    times.push(date);
                }
                return { closes, highs, lows, volumes, times };`,
`                const entries = Object.entries(series).sort(([a],[b]) => new Date(a) - new Date(b));
                const opens = [], closes = [], highs = [], lows = [], volumes = [], times = [];
                for (const [date, values] of entries.slice(-200)) {
                    opens.push(parseFloat(values['1. open']));
                    closes.push(parseFloat(values['4. close']));
                    highs.push(parseFloat(values['2. high']));
                    lows.push(parseFloat(values['3. low']));
                    volumes.push(parseFloat(values['5. volume']));
                    times.push(date);
                }
                return { opens, closes, highs, lows, volumes, times };`);

// 6. fetchIndexCandlesAndStore — storage (opens + full times), incl. inline 15m TwelveData sub-fetch
apply('fetchIndexCandlesAndStore storage (opens + times)',
`        if (tf === '1h') {
            RAW_1H[p.n] = { closes: data.closes, highs: data.highs, lows: data.lows, time: data.times[data.times.length-1] };
            const last50Closes = data.closes.slice(-50);
            firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
        }
        if (tf === '4h') {
            RAW_4H[p.n] = { closes: data.closes, highs: data.highs, lows: data.lows, time: data.times[data.times.length-1] };
        }
        if (tf === '15m') {
            // Indices ke liye Twelve Data se 15m data fetch karo
            const key = config.KEYS[0];
            if (key) {
                const twSymbol = INDEX_SYMBOLS[p.n]?.twelvedata;
                if (twSymbol) {
                    const url = \`https://api.twelvedata.com/time_series?symbol=\${twSymbol}&interval=15min&outputsize=200&apikey=\${key}\`;
                    try {
                        const res = await fetch(url);
                        const json = await res.json();
                        if (json.values && json.values.length > 1) {
                            const sorted = [...json.values].sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
                            const closes = sorted.map(v => parseFloat(v.close));
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows = sorted.map(v => parseFloat(v.low));
                            const times = sorted.map(v => v.datetime);
                            RAW_15M[p.n] = { closes, highs, lows, time: times[times.length-1] };
                        }
                    } catch (e) {
                        console.error(\`[Index] 15m fetch error for \${p.n}:\`, e.message);
                    }
                }
            }
        }
        if (tf === '1day') {
            RAW_DAILY[p.n] = { closes: data.closes, volumes: data.volumes, time: data.times[data.times.length-1] };
        }
        if (tf === '1week') {
            RAW_WEEKLY[p.n] = { closes: data.closes, time: data.times[data.times.length-1] };
        }`,
`        if (tf === '1h') {
            RAW_1H[p.n] = { opens: data.opens, closes: data.closes, highs: data.highs, lows: data.lows, times: data.times, time: data.times[data.times.length-1] };
            const last50Closes = data.closes.slice(-50);
            firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
        }
        if (tf === '4h') {
            RAW_4H[p.n] = { opens: data.opens, closes: data.closes, highs: data.highs, lows: data.lows, times: data.times, time: data.times[data.times.length-1] };
        }
        if (tf === '15m') {
            // Indices ke liye Twelve Data se 15m data fetch karo
            const key = config.KEYS[0];
            if (key) {
                const twSymbol = INDEX_SYMBOLS[p.n]?.twelvedata;
                if (twSymbol) {
                    const url = \`https://api.twelvedata.com/time_series?symbol=\${twSymbol}&interval=15min&outputsize=200&apikey=\${key}\`;
                    try {
                        const res = await fetch(url);
                        const json = await res.json();
                        if (json.values && json.values.length > 1) {
                            const sorted = [...json.values].sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
                            const opens = sorted.map(v => parseFloat(v.open));
                            const closes = sorted.map(v => parseFloat(v.close));
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows = sorted.map(v => parseFloat(v.low));
                            const times = sorted.map(v => v.datetime);
                            RAW_15M[p.n] = { opens, closes, highs, lows, times, time: times[times.length-1] };
                        }
                    } catch (e) {
                        console.error(\`[Index] 15m fetch error for \${p.n}:\`, e.message);
                    }
                }
            }
        }
        if (tf === '1day') {
            RAW_DAILY[p.n] = { opens: data.opens, closes: data.closes, volumes: data.volumes, times: data.times, time: data.times[data.times.length-1] };
        }
        if (tf === '1week') {
            RAW_WEEKLY[p.n] = { opens: data.opens, closes: data.closes, times: data.times, time: data.times[data.times.length-1] };
        }`);

// 7. fetchTF (regular forex, direct TwelveData) — storage (opens + full times)
apply('fetchTF forex storage (opens + times)',
`                        const sorted = [...j.values].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
                        const cls = sorted.map(v => parseFloat(v.close));
                        const ema20 = calcEMA(cls, 20);
                        const currentPrice = cls[cls.length - 1];
                        if (ema20) {
                            DATA_STORE[p.n][tf] = currentPrice > ema20 ? 'bull' : 'bear';
                            // ✅ SAVE EMA20 FOR THIS TIMEFRAME
                            DATA_STORE[p.n][tf + '_ema20'] = parseFloat(ema20.toFixed(5));
                            if (tf === '1h') {
                                DATA_STORE[p.n].currentPrice = parseFloat(currentPrice.toFixed(5));
                                DATA_STORE[p.n].ema20        = parseFloat(ema20.toFixed(5));
                            }
                        }
                        if (tf === '1h') {
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows  = sorted.map(v => parseFloat(v.low));
                            RAW_1H[p.n] = { closes: cls, highs: highs, lows: lows, time: sorted[sorted.length-1]?.datetime };
                            const last50Closes = cls.slice(-50);
                            firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
                        }
                        if (tf === '4h') {
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows  = sorted.map(v => parseFloat(v.low));
                            RAW_4H[p.n] = { closes: cls, highs: highs, lows: lows, time: sorted[sorted.length-1]?.datetime };
                        }
                        if (tf === '15m') {
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows  = sorted.map(v => parseFloat(v.low));
                            RAW_15M[p.n] = { closes: cls, highs: highs, lows: lows, time: sorted[sorted.length-1]?.datetime };
                        }
                        if (tf === '1day') {
                            const dailyCls = sorted.map(v => parseFloat(v.close));
                            const dailyVols = sorted.map(v => parseFloat(v.volume || '0'));
                            RAW_DAILY[p.n] = { closes: dailyCls, volumes: dailyVols, time: sorted[sorted.length-1]?.datetime };
                        }
                        if (tf === '1week') {
                            RAW_WEEKLY[p.n] = { closes: cls, time: sorted[sorted.length-1]?.datetime };
                        }`,
`                        const sorted = [...j.values].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
                        const cls = sorted.map(v => parseFloat(v.close));
                        const opns = sorted.map(v => parseFloat(v.open));
                        const allTimes = sorted.map(v => v.datetime);
                        const ema20 = calcEMA(cls, 20);
                        const currentPrice = cls[cls.length - 1];
                        if (ema20) {
                            DATA_STORE[p.n][tf] = currentPrice > ema20 ? 'bull' : 'bear';
                            // ✅ SAVE EMA20 FOR THIS TIMEFRAME
                            DATA_STORE[p.n][tf + '_ema20'] = parseFloat(ema20.toFixed(5));
                            if (tf === '1h') {
                                DATA_STORE[p.n].currentPrice = parseFloat(currentPrice.toFixed(5));
                                DATA_STORE[p.n].ema20        = parseFloat(ema20.toFixed(5));
                            }
                        }
                        if (tf === '1h') {
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows  = sorted.map(v => parseFloat(v.low));
                            RAW_1H[p.n] = { opens: opns, closes: cls, highs: highs, lows: lows, times: allTimes, time: sorted[sorted.length-1]?.datetime };
                            const last50Closes = cls.slice(-50);
                            firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
                        }
                        if (tf === '4h') {
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows  = sorted.map(v => parseFloat(v.low));
                            RAW_4H[p.n] = { opens: opns, closes: cls, highs: highs, lows: lows, times: allTimes, time: sorted[sorted.length-1]?.datetime };
                        }
                        if (tf === '15m') {
                            const highs = sorted.map(v => parseFloat(v.high));
                            const lows  = sorted.map(v => parseFloat(v.low));
                            RAW_15M[p.n] = { opens: opns, closes: cls, highs: highs, lows: lows, times: allTimes, time: sorted[sorted.length-1]?.datetime };
                        }
                        if (tf === '1day') {
                            const dailyCls = sorted.map(v => parseFloat(v.close));
                            const dailyVols = sorted.map(v => parseFloat(v.volume || '0'));
                            RAW_DAILY[p.n] = { opens: opns, closes: dailyCls, volumes: dailyVols, times: allTimes, time: sorted[sorted.length-1]?.datetime };
                        }
                        if (tf === '1week') {
                            RAW_WEEKLY[p.n] = { opens: opns, closes: cls, times: allTimes, time: sorted[sorted.length-1]?.datetime };
                        }`);

fs.writeFileSync(path, js, 'utf8');
console.log('Done.');
