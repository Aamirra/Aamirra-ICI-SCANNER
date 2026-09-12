const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_getkeyfix', content);

const old1 = `async function getKey() {
    while (true) {
        const key = getAvailableKey();
        if (key) return key;
        if (allKeysExhaustedForMinute()) await sleep(MINUTE_WAIT_MS);
        else await sleep(500);
    }
}`;
const new1 = `async function getKey() {
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
const ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

const old2 = `    const key = await getKey();
    let twelveInterval = tf;
    if (tf === '15m') twelveInterval = '15min';`;
const new2 = `    const key = await getKey();
    if (!key) return false;
    let twelveInterval = tf;
    if (tf === '15m') twelveInterval = '15min';`;
const ok2 = content.includes(old2);
if (ok2) content = content.replace(old2, new2);

fs.writeFileSync(path, content);
console.log('Patches applied:', { ok1, ok2 });
