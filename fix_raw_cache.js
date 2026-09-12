const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_rawcache', content);

// 1) Naye functions add karo (cache save + restore) masterScan se pehle
const anchor1 = `async function masterScan() {
    if (isScanning) return;
    isScanning = true;
    const scanStartTime = Date.now();`;
const newFns = `async function cacheRawCandlesToFirebase() {
    const RAW_MAP = { '1h': RAW_1H, '4h': RAW_4H, '15m': RAW_15M, '1day': RAW_DAILY, '1week': RAW_WEEKLY };
    const writes = [];
    for (const [tf, store] of Object.entries(RAW_MAP)) {
        for (const [pairName, data] of Object.entries(store)) {
            if (data) writes.push({ path: \`rawCandleCache/\${tf}/\${pairName}\`, data });
        }
    }
    const BATCH = 25;
    for (let i = 0; i < writes.length; i += BATCH) {
        const slice = writes.slice(i, i + BATCH);
        await Promise.all(slice.map(w => firebasePut(w.path, w.data).catch(err => console.error(\`[RawCache] Failed \${w.path}:\`, err.message))));
    }
}

async function restoreRawCandleCache() {
    try {
        const snap = await admin.database().ref('rawCandleCache').once('value');
        const val = snap.val();
        if (!val) { console.log('[RawCache] No cached candles found in Firebase.'); return; }
        if (val['1h']) Object.assign(RAW_1H, val['1h']);
        if (val['4h']) Object.assign(RAW_4H, val['4h']);
        if (val['15m']) Object.assign(RAW_15M, val['15m']);
        if (val['1day']) Object.assign(RAW_DAILY, val['1day']);
        if (val['1week']) Object.assign(RAW_WEEKLY, val['1week']);
        console.log('[RawCache] Restored candles from Firebase cache.');
    } catch (err) {
        console.error('[RawCache] Restore failed:', err.message);
    }
}

async function masterScan() {
    if (isScanning) return;
    isScanning = true;
    const scanStartTime = Date.now();`;
const ok1 = content.includes(anchor1);
if (ok1) content = content.replace(anchor1, newFns);

// 2) Har scan ke fetch ke turant baad, cache save karne wala call add karo
const anchor2 = `        console.time('⏱️ [Phase 1] Fetch data');
        let failed = await fetchBatch(jobs);
        console.timeEnd('⏱️ [Phase 1] Fetch data');

        fetchMentFXSentiment();`;
const new2 = `        console.time('⏱️ [Phase 1] Fetch data');
        let failed = await fetchBatch(jobs);
        console.timeEnd('⏱️ [Phase 1] Fetch data');

        console.time('⏱️ [Phase 1b] Cache candles to Firebase');
        await cacheRawCandlesToFirebase();
        console.timeEnd('⏱️ [Phase 1b] Cache candles to Firebase');

        fetchMentFXSentiment();`;
const ok2 = content.includes(anchor2);
if (ok2) content = content.replace(anchor2, new2);

// 3) restoreRawCandleCache ko export karo
const old3 = `module.exports = { masterScan, RAW_1H, RAW_4H, RAW_15M, RAW_DAILY, RAW_WEEKLY };`;
const new3 = `module.exports = { masterScan, RAW_1H, RAW_4H, RAW_15M, RAW_DAILY, RAW_WEEKLY, restoreRawCandleCache };`;
const ok3 = content.includes(old3);
if (ok3) content = content.replace(old3, new3);

fs.writeFileSync(path, content);
console.log('Patches applied:', { ok1, ok2, ok3 });
