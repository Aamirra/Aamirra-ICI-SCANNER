const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/services/technicalMetrics.js';
let content = fs.readFileSync(path, 'utf8');

const old1 = `    for (const pair of allPairs) {
        let daily = RAW_DAILY ? RAW_DAILY[pair.n] : undefined;`;
const new1 = `    const processPair = async (pair) => {
        let daily = RAW_DAILY ? RAW_DAILY[pair.n] : undefined;`;
let ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

const old2 = `                console.warn(\`[Metrics] Skipping \${pair.n} due to unavailability of historical tracking.\`);
                continue;`;
const new2 = `                console.warn(\`[Metrics] Skipping \${pair.n} due to unavailability of historical tracking.\`);
                return null;`;
let ok2 = content.includes(old2);
if (ok2) content = content.replace(old2, new2);

const old3 = `        results.push({
            pair: pair.n,
            longTermTrend: parseFloat(longTermTrend.toFixed(2)),
            shortTermMomentum: parseFloat(shortTermMomentum.toFixed(2)),
            microMomentum: microMomentum !== null ? parseFloat(microMomentum.toFixed(2)) : null,
            volume7dAvg: volume7dAvg !== null ? Math.round(volume7dAvg) : null,
            dollarVolume1d
        });

        await sleep(150); 
    }`;
const new3 = `        return {
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
let ok3 = content.includes(old3);
if (ok3) content = content.replace(old3, new3);

const old4 = `    // Sync results back to Firebase
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
const new4 = `    // Sync results back to Firebase (parallel batches)
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
let ok4 = content.includes(old4);
if (ok4) content = content.replace(old4, new4);

fs.writeFileSync(path, content);
console.log('Patches applied:', { ok1, ok2, ok3, ok4 });
