const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let js = fs.readFileSync(path, 'utf8');

// 1. aggregateTo4Hour: accept + aggregate opens too
const AGG_OLD = `function aggregateTo4Hour(hourlyCloses, hourlyHighs, hourlyLows, hourlyTimes, hourlyVolumes) {
    if (!hourlyCloses || hourlyCloses.length < 4) return null;
    const aggCloses = [], aggHighs = [], aggLows = [], aggTimes = [], aggVolumes = [];
    for (let i = 3; i < hourlyCloses.length; i += 4) {
        const cChunk = hourlyCloses.slice(i-3, i+1);
        const hChunk = hourlyHighs.slice(i-3, i+1);
        const lChunk = hourlyLows.slice(i-3, i+1);
        const vChunk = hourlyVolumes.slice(i-3, i+1);
        aggCloses.push(cChunk[cChunk.length-1]);
        aggHighs.push(Math.max(...hChunk));
        aggLows.push(Math.min(...lChunk));
        aggTimes.push(hourlyTimes[i]);
        aggVolumes.push(vChunk.reduce((a,b)=>a+b,0));
    }
    return { closes: aggCloses, highs: aggHighs, lows: aggLows, times: aggTimes, volumes: aggVolumes };
}`;

const AGG_NEW = `function aggregateTo4Hour(hourlyCloses, hourlyHighs, hourlyLows, hourlyTimes, hourlyVolumes, hourlyOpens) {
    if (!hourlyCloses || hourlyCloses.length < 4) return null;
    const aggOpens = [], aggCloses = [], aggHighs = [], aggLows = [], aggTimes = [], aggVolumes = [];
    for (let i = 3; i < hourlyCloses.length; i += 4) {
        const oChunk = hourlyOpens ? hourlyOpens.slice(i-3, i+1) : null;
        const cChunk = hourlyCloses.slice(i-3, i+1);
        const hChunk = hourlyHighs.slice(i-3, i+1);
        const lChunk = hourlyLows.slice(i-3, i+1);
        const vChunk = hourlyVolumes.slice(i-3, i+1);
        aggOpens.push(oChunk ? oChunk[0] : cChunk[0]);
        aggCloses.push(cChunk[cChunk.length-1]);
        aggHighs.push(Math.max(...hChunk));
        aggLows.push(Math.min(...lChunk));
        aggTimes.push(hourlyTimes[i]);
        aggVolumes.push(vChunk.reduce((a,b)=>a+b,0));
    }
    return { opens: aggOpens, closes: aggCloses, highs: aggHighs, lows: aggLows, times: aggTimes, volumes: aggVolumes };
}`;

if (!js.includes(AGG_OLD)) console.error('FAILED part 1: aggregateTo4Hour');
else { js = js.replace(AGG_OLD, AGG_NEW); console.log('OK part 1: aggregateTo4Hour now handles opens'); }

// 2. fetchYahooCandles: capture opens, return full times array
const FYC_OLD = `                    const timestamps = result.timestamp || [];
                    let closes = quotes.close.filter(v => v !== null);
                    let highs = (quotes.high || []).filter(v => v !== null);
                    let lows = (quotes.low || []).filter(v => v !== null);
                    let volumes = (quotes.volume || []).map(v => v || 0);
                    let times = timestamps.map(t => new Date(t * 1000).toISOString());
                    const minLen = Math.min(closes.length, highs.length, lows.length, times.length);
                    closes = closes.slice(-minLen); highs = highs.slice(-minLen); lows = lows.slice(-minLen); volumes = volumes.slice(-minLen); times = times.slice(-minLen);
                    if (tf === '4h') {
                        const agg = aggregateTo4Hour(closes, highs, lows, times, volumes);
                        if (!agg) { resolve(null); return; }
                        resolve({ closes: agg.closes, highs: agg.highs, lows: agg.lows, volumes: agg.volumes, time: agg.times[agg.times.length-1] });
                    } else {
                        resolve({ closes, highs, lows, volumes, time: times[times.length-1] });
                    }`;

const FYC_NEW = `                    const timestamps = result.timestamp || [];
                    let opens = (quotes.open || []).filter(v => v !== null);
                    let closes = quotes.close.filter(v => v !== null);
                    let highs = (quotes.high || []).filter(v => v !== null);
                    let lows = (quotes.low || []).filter(v => v !== null);
                    let volumes = (quotes.volume || []).map(v => v || 0);
                    let times = timestamps.map(t => new Date(t * 1000).toISOString());
                    const minLen = Math.min(opens.length, closes.length, highs.length, lows.length, times.length);
                    opens = opens.slice(-minLen); closes = closes.slice(-minLen); highs = highs.slice(-minLen); lows = lows.slice(-minLen); volumes = volumes.slice(-minLen); times = times.slice(-minLen);
                    if (tf === '4h') {
                        const agg = aggregateTo4Hour(closes, highs, lows, times, volumes, opens);
                        if (!agg) { resolve(null); return; }
                        resolve({ opens: agg.opens, closes: agg.closes, highs: agg.highs, lows: agg.lows, times: agg.times, volumes: agg.volumes, time: agg.times[agg.times.length-1] });
                    } else {
                        resolve({ opens, closes, highs, lows, volumes, times, time: times[times.length-1] });
                    }`;

if (!js.includes(FYC_OLD)) console.error('FAILED part 2: fetchYahooCandles');
else { js = js.replace(FYC_OLD, FYC_NEW); console.log('OK part 2: fetchYahooCandles now captures opens + full times'); }

// 3. fetchTF_Yahoo — Yahoo fallback storage block
const YSTORE_OLD = `        if (tf === '1h') {
            RAW_1H[p.n] = { closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, time: yahooData.time };
            const last50Closes = yahooData.closes.slice(-50);
            firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
        }
        if (tf === '4h') {
            RAW_4H[p.n] = { closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, time: yahooData.time };
        }
        if (tf === '15m') { // ✅ Store 15m data from Yahoo fallback (though Yahoo may not support 15m)
            RAW_15M[p.n] = { closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, time: yahooData.time };
        }
        if (tf === '1day') {
            RAW_DAILY[p.n] = { closes: yahooData.closes, volumes: yahooData.volumes, time: yahooData.time };
        }
        if (tf === '1week') {
            RAW_WEEKLY[p.n] = { closes: yahooData.closes, time: yahooData.time };
        }`;

const YSTORE_NEW = `        if (tf === '1h') {
            RAW_1H[p.n] = { opens: yahooData.opens, closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, times: yahooData.times, time: yahooData.time };
            const last50Closes = yahooData.closes.slice(-50);
            firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
        }
        if (tf === '4h') {
            RAW_4H[p.n] = { opens: yahooData.opens, closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, times: yahooData.times, time: yahooData.time };
        }
        if (tf === '15m') { // ✅ Store 15m data from Yahoo fallback (though Yahoo may not support 15m)
            RAW_15M[p.n] = { opens: yahooData.opens, closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, times: yahooData.times, time: yahooData.time };
        }
        if (tf === '1day') {
            RAW_DAILY[p.n] = { opens: yahooData.opens, closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, volumes: yahooData.volumes, times: yahooData.times, time: yahooData.time };
        }
        if (tf === '1week') {
            RAW_WEEKLY[p.n] = { opens: yahooData.opens, closes: yahooData.closes, highs: yahooData.highs, lows: yahooData.lows, times: yahooData.times, time: yahooData.time };
        }`;

if (!js.includes(YSTORE_OLD)) console.error('FAILED part 3: Yahoo fallback storage block');
else { js = js.replace(YSTORE_OLD, YSTORE_NEW); console.log('OK part 3: Yahoo fallback storage now includes opens + times'); }

fs.writeFileSync(path, js, 'utf8');
console.log('Done.');
