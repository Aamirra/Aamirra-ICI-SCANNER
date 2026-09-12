const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');

const old1 = `async function getKey() {
    let key = getAvailableKey();
    if (key) return key;
    await sleep(500);
    key = getAvailableKey();
    if (key) return key;
    console.warn('[getKey] No key available — skipping this job to keep scan moving.');
    return null;
}`;
const new1 = `async function getKey() {
    const maxWaitMs = 30000; // wait up to 30s for the per-minute window to clear
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
        const key = getAvailableKey();
        if (key) return key;
        await sleep(1000);
    }
    console.warn('[getKey] No key available after 30s — skipping this job to keep scan moving.');
    return null;
}`;
const ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

// Slow (TwelveData) pipeline concurrency ko keys ke hisab se rakhte hain
const old2 = `const MAX_CONCURRENT = 25;`;
const new2 = `const MAX_CONCURRENT = 12;       // matched to available TwelveData keys/rate`;
const ok2 = content.includes(old2);
if (ok2) content = content.replace(old2, new2);

fs.writeFileSync(path, content);
console.log('Patches applied:', { ok1, ok2 });
