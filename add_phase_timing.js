const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_phasetiming', content);

const oldBlock1 = `        let failed = await fetchBatch(jobs);
        fetchMentFXSentiment();
        await calculateAndUpdateTechnicalMetrics(RAW_DAILY, RAW_1H);
        if (calculateAndUpdateStockMetrics) {
            try { await calculateAndUpdateStockMetrics(); } catch (err) {
                console.error('[Scanner] Stock metrics failed:', err.message);
            }
        }
        await sendStrongPullbackNotifications();`;

const newBlock1 = `        console.time('⏱️ [Phase 1] Fetch data');
        let failed = await fetchBatch(jobs);
        console.timeEnd('⏱️ [Phase 1] Fetch data');

        fetchMentFXSentiment();

        console.time('⏱️ [Phase 2] Technical metrics');
        await calculateAndUpdateTechnicalMetrics(RAW_DAILY, RAW_1H);
        console.timeEnd('⏱️ [Phase 2] Technical metrics');

        if (calculateAndUpdateStockMetrics) {
            console.time('⏱️ [Phase 3] Stock metrics');
            try { await calculateAndUpdateStockMetrics(); } catch (err) {
                console.error('[Scanner] Stock metrics failed:', err.message);
            }
            console.timeEnd('⏱️ [Phase 3] Stock metrics');
        }

        console.time('⏱️ [Phase 4] Pullback notifications');
        await sendStrongPullbackNotifications();
        console.timeEnd('⏱️ [Phase 4] Pullback notifications');`;

const oldBlock2 = `        const PAIR_BATCH_SIZE = 20;
        for (let i = 0; i < config.PAIRS.length; i += PAIR_BATCH_SIZE) {
            const slice = config.PAIRS.slice(i, i + PAIR_BATCH_SIZE);
            await Promise.all(slice.map(p => processPair(p).catch(err => {
                console.error(\`[masterScan] processPair failed for \${p.n}:\`, err.message);
            })));
        }
        await refreshRealUsage();`;

const newBlock2 = `        console.time('⏱️ [Phase 5] Per-pair monitors');
        const PAIR_BATCH_SIZE = 20;
        for (let i = 0; i < config.PAIRS.length; i += PAIR_BATCH_SIZE) {
            const slice = config.PAIRS.slice(i, i + PAIR_BATCH_SIZE);
            await Promise.all(slice.map(p => processPair(p).catch(err => {
                console.error(\`[masterScan] processPair failed for \${p.n}:\`, err.message);
            })));
        }
        console.timeEnd('⏱️ [Phase 5] Per-pair monitors');

        console.time('⏱️ [Phase 6] Refresh key usage');
        await refreshRealUsage();
        console.timeEnd('⏱️ [Phase 6] Refresh key usage');`;

let ok1 = false, ok2 = false;
if (content.includes(oldBlock1)) { content = content.replace(oldBlock1, newBlock1); ok1 = true; }
if (content.includes(oldBlock2)) { content = content.replace(oldBlock2, newBlock2); ok2 = true; }

fs.writeFileSync(path, content);
console.log('Block 1 (fetch/metrics/pullback) patched:', ok1);
console.log('Block 2 (per-pair loop) patched:', ok2);
