const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let js = fs.readFileSync(path, 'utf8');

// 1. fetchBinanceCandles: capture Open prices too
const FETCH_OLD = `                    const closes = klines.map(k => parseFloat(k[4]));
                    const highs = klines.map(k => parseFloat(k[2]));
                    const lows = klines.map(k => parseFloat(k[3]));
                    const volumes = klines.map(k => parseFloat(k[5]));
                    const times = klines.map(k => new Date(k[6]).toISOString());

                    if (tf === '1week') {
                        const aggCloses = [], aggHighs = [], aggLows = [], aggTimes = [], aggVolumes = [];
                        for (let i = 6; i < closes.length; i += 7) {
                            const cSlice = closes.slice(i-6, i+1);
                            const hSlice = highs.slice(i-6, i+1);
                            const lSlice = lows.slice(i-6, i+1);
                            const vSlice = volumes.slice(i-6, i+1);
                            aggCloses.push(cSlice[cSlice.length-1]);
                            aggHighs.push(Math.max(...hSlice));
                            aggLows.push(Math.min(...lSlice));
                            aggTimes.push(times[i]);
                            aggVolumes.push(vSlice.reduce((a,b)=>a+b,0));
                        }
                        resolve({ closes: aggCloses, highs: aggHighs, lows: aggLows, times: aggTimes, volumes: aggVolumes });
                    } else {
                        resolve({ closes, highs, lows, times, volumes });
                    }`;

const FETCH_NEW = `                    const opens = klines.map(k => parseFloat(k[1]));
                    const closes = klines.map(k => parseFloat(k[4]));
                    const highs = klines.map(k => parseFloat(k[2]));
                    const lows = klines.map(k => parseFloat(k[3]));
                    const volumes = klines.map(k => parseFloat(k[5]));
                    const times = klines.map(k => new Date(k[6]).toISOString());

                    if (tf === '1week') {
                        const aggOpens = [], aggCloses = [], aggHighs = [], aggLows = [], aggTimes = [], aggVolumes = [];
                        for (let i = 6; i < closes.length; i += 7) {
                            const oSlice = opens.slice(i-6, i+1);
                            const cSlice = closes.slice(i-6, i+1);
                            const hSlice = highs.slice(i-6, i+1);
                            const lSlice = lows.slice(i-6, i+1);
                            const vSlice = volumes.slice(i-6, i+1);
                            aggOpens.push(oSlice[0]);
                            aggCloses.push(cSlice[cSlice.length-1]);
                            aggHighs.push(Math.max(...hSlice));
                            aggLows.push(Math.min(...lSlice));
                            aggTimes.push(times[i]);
                            aggVolumes.push(vSlice.reduce((a,b)=>a+b,0));
                        }
                        resolve({ opens: aggOpens, closes: aggCloses, highs: aggHighs, lows: aggLows, times: aggTimes, volumes: aggVolumes });
                    } else {
                        resolve({ opens, closes, highs, lows, times, volumes });
                    }`;

if (!js.includes(FETCH_OLD)) console.error('FAILED part 1: fetchBinanceCandles block');
else { js = js.replace(FETCH_OLD, FETCH_NEW); console.log('OK part 1: opens capture added to fetchBinanceCandles'); }

// 2. Storage blocks in fetchTF_Yahoo (Binance branch): store opens + full times array
const STORE_OLD = `            if (tf === '1h') {
                RAW_1H[p.n] = { closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, time: binanceData.times[binanceData.times.length-1] };
                const last50Closes = binanceData.closes.slice(-50);
                firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
            }
            if (tf === '4h') {
                RAW_4H[p.n] = { closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, time: binanceData.times[binanceData.times.length-1] };
            }
            if (tf === '15m') { // ✅ Store 15m data
                RAW_15M[p.n] = { closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, time: binanceData.times[binanceData.times.length-1] };
            }
            if (tf === '1day') {
                RAW_DAILY[p.n] = { closes: binanceData.closes, volumes: binanceData.volumes, time: binanceData.times[binanceData.times.length-1] };
            }
            if (tf === '1week') {
                RAW_WEEKLY[p.n] = { closes: binanceData.closes, time: binanceData.times[binanceData.times.length-1] };
            }`;

const STORE_NEW = `            if (tf === '1h') {
                RAW_1H[p.n] = { opens: binanceData.opens, closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, times: binanceData.times, time: binanceData.times[binanceData.times.length-1] };
                const last50Closes = binanceData.closes.slice(-50);
                firebasePut(\`miniChart/\${p.n}\`, { closes: last50Closes, updatedAt: Date.now() });
            }
            if (tf === '4h') {
                RAW_4H[p.n] = { opens: binanceData.opens, closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, times: binanceData.times, time: binanceData.times[binanceData.times.length-1] };
            }
            if (tf === '15m') { // ✅ Store 15m data
                RAW_15M[p.n] = { opens: binanceData.opens, closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, times: binanceData.times, time: binanceData.times[binanceData.times.length-1] };
            }
            if (tf === '1day') {
                RAW_DAILY[p.n] = { opens: binanceData.opens, closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, volumes: binanceData.volumes, times: binanceData.times, time: binanceData.times[binanceData.times.length-1] };
            }
            if (tf === '1week') {
                RAW_WEEKLY[p.n] = { opens: binanceData.opens, closes: binanceData.closes, highs: binanceData.highs, lows: binanceData.lows, times: binanceData.times, time: binanceData.times[binanceData.times.length-1] };
            }`;

if (!js.includes(STORE_OLD)) console.error('FAILED part 2: RAW_* storage block');
else { js = js.replace(STORE_OLD, STORE_NEW); console.log('OK part 2: opens + full times array stored for crypto (Binance)'); }

fs.writeFileSync(path, js, 'utf8');
console.log('Done.');
