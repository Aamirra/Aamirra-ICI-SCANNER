const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');

const old1 = `async function getKey() {
    let attempts = 0;
    while (true) {
        const key = getAvailableKey();
        if (key) return key;
        attempts++;
        if (attempts > 2) {
            console.warn('[getKey] Keys exhausted after retries — skipping this job instead of blocking forever.');
            return null;
        }
        if (allKeysExhaustedForMinute()) await sleep(MINUTE_WAIT_MS);
        else await sleep(500);
    }
}`;
const new1 = `async function getKey() {
    let key = getAvailableKey();
    if (key) return key;
    await sleep(500);
    key = getAvailableKey();
    if (key) return key;
    console.warn('[getKey] No key available — skipping this job to keep scan moving.');
    return null;
}`;
const ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

fs.writeFileSync(path, content);
console.log('Patch applied:', ok1);
