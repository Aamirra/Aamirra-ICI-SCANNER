const fs = require('fs');

// ============ technicalMetrics.js ============
const tmPath = '/home/ubuntu/ICI-SCANNER/services/technicalMetrics.js';
let tm = fs.readFileSync(tmPath, 'utf8');
fs.writeFileSync(tmPath + '.before_speedfix', tm);

let tmOk = [false, false, false, false];

const tm1_old = `    for (const pair of allPairs) {
        let daily = RAW_DAILY ? RAW_DAILY[pair.n] : undefined;`;
const tm1_new = `    const processPair = async (pair) => {
        let daily = RAW_DAILY ? RAW_DAILY[pair.n] : undefined;`;
if (tm.includes(tm1_old)) { tm = tm.replace(tm1_old, tm1_new); tmOk[0] = true; }

const tm2_old = `                console.warn(\`[Metrics] Skipping \${pair.n} due to unavailability of historical tracking.\`);
                continue;`;
const tm2_new = `                console.warn(\`[Metrics] Skipping \${pair.n} due to unavailability of historical tracking.\`);
                return null;`;
if (tm.includes(tm2_old)) { tm = tm.replace(tm2_old, tm2_new); tmOk[1] = true; }

const tm3_old = `        results.push({
            pair: pair.n,
            longTermTrend: parseFloat(longTermTrend.toFixed(2)),
            shortTermMomentum: parseFloat(shortTermMomentum.toFixed(2)),
            microMomentum: microMomentum !== null ? parseFloat(microMomentum.toFixed(2)) : null,
            volume7dAvg: volume7dAvg !== null ? Math.round(volume7dAvg) : null,
            dollarVolume1d
        });

        await sleep(150);
    }`;
const tm3_new = `        return {
            pair: pair.n,
            longTermTrend: parseFloat(longTermTrend.toFixed(2)),
            shortTermMomentum: parseFloat(shortTermMomentum.toFixed(2)),
            microMomentum: microMomentum !== null ? parseFloat(microMomentum.toFixed(2)) : null,
            volume7dAvg: volume7dAvg !== null ? Math.round(volume7dAvg) : null,
            dollarVolume1d
        };
    };

    const METRICS_BATCH_SIZE = 16;
    for (let i = 0; i < allPairs.length; i += METRICS_BATCH_SIZE) {
        const slice = allPairs.slice(i, i + METRICS_BATCH_SIZE);
        const batchResults = await Promise.all(slice.map(pair => processPair(pair).catch(err => {
            console.error(\`[Metrics] processPair failed for \${pair.n}:\`, err.message);
            return null;
        })));
        for (const r of batchResults) if (r) results.push(r);
    }`;
if (tm.includes(tm3_old)) { tm = tm.replace(tm3_old, tm3_new); tmOk[2] = true; }

const tm4_old = `    // Sync results back to Firebase
    for (const metric of results) {
        try {
            await firebasePut(\`technicalMetrics/\${metric.pair}\`, {
                longTermTrend: metric.longTermTrend,
                shortTermMomentum: metric.shortTermMomentum,
                microMomentum: metric.microMomentum,
                volume7dAvg: metric.volume7dAvg,
                dollarVolume1d: metric.dollarVolume1d,
                updatedAt: Date.now()
            });
        } catch (err) {
            console.error(\`[Firebase Error] Save failed for \${metric.pair}:\`, err.message);
        }
    }`;
const tm4_new = `    // Sync results back to Firebase (parallel batches)
    const FIREBASE_SYNC_BATCH = 20;
    for (let i = 0; i < results.length; i += FIREBASE_SYNC_BATCH) {
        const slice = results.slice(i, i + FIREBASE_SYNC_BATCH);
        await Promise.all(slice.map(metric => firebasePut(\`technicalMetrics/\${metric.pair}\`, {
            longTermTrend: metric.longTermTrend,
            shortTermMomentum: metric.shortTermMomentum,
            microMomentum: metric.microMomentum,
            volume7dAvg: metric.volume7dAvg,
            dollarVolume1d: metric.dollarVolume1d,
            updatedAt: Date.now()
        }).catch(err => console.error(\`[Firebase Error] Save failed for \${metric.pair}:\`, err.message))));
    }`;
if (tm.includes(tm4_old)) { tm = tm.replace(tm4_old, tm4_new); tmOk[3] = true; }

fs.writeFileSync(tmPath, tm);
console.log('technicalMetrics.js patches:', tmOk);

// ============ stockMetrics.js ============
const smPath = '/home/ubuntu/ICI-SCANNER/services/stockMetrics.js';
let sm = fs.readFileSync(smPath, 'utf8');
fs.writeFileSync(smPath + '.before_speedfix', sm);

let smOk = [false, false, false];

const sm1_old = `    for (const symbol of list) {
        try {
            const yahooSymbol = prefix ? \`\${symbol}.\${prefix}\` : symbol.includes('.') ? symbol : symbol;`;
const sm1_new = `    const processSymbol = async (symbol) => {
        try {
            const yahooSymbol = prefix ? \`\${symbol}.\${prefix}\` : symbol.includes('.') ? symbol : symbol;`;
if (sm.includes(sm1_old)) { sm = sm.replace(sm1_old, sm1_new); smOk[0] = true; }

const sm2_old = `            if (!dailyData || dailyData.closes.length < 50) {
                console.warn(\`[Stocks] Insufficient daily data for \${symbol}\`);
                continue;
            }`;
const sm2_new = `            if (!dailyData || dailyData.closes.length < 50) {
                console.warn(\`[Stocks] Insufficient daily data for \${symbol}\`);
                return;
            }`;
if (sm.includes(sm2_old)) { sm = sm.replace(sm2_old, sm2_new); smOk[1] = true; }

const sm3_old = `            console.log(\`[Stocks] \${symbol} saved (1H:\${signal1h}, 4H:\${signal4h}, 1D:\${signal1d}, 1W:\${signal1w})\`);
        } catch (err) {
            console.error(\`[Stocks] Error processing \${symbol}:\`, err.message);
        }
    }

    if (Object.keys(pbStates).length > 0) {`;
const sm3_new = `            console.log(\`[Stocks] \${symbol} saved (1H:\${signal1h}, 4H:\${signal4h}, 1D:\${signal1d}, 1W:\${signal1w})\`);
        } catch (err) {
            console.error(\`[Stocks] Error processing \${symbol}:\`, err.message);
        }
    };

    const STOCK_BATCH_SIZE = 15;
    for (let i = 0; i < list.length; i += STOCK_BATCH_SIZE) {
        const slice = list.slice(i, i + STOCK_BATCH_SIZE);
        await Promise.all(slice.map(symbol => processSymbol(symbol)));
    }

    if (Object.keys(pbStates).length > 0) {`;
if (sm.includes(sm3_old)) { sm = sm.replace(sm3_old, sm3_new); smOk[2] = true; }

fs.writeFileSync(smPath, sm);
console.log('stockMetrics.js patches:', smOk);
