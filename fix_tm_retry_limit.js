const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/services/technicalMetrics.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_retryfix', content);

const old1 = `async function fetchTwelveDataVolume(pairName) {
    const keyIndex = await getAvailableKeyIndex(TD_KEYS, 'td_counter', TD_DAILY_LIMIT_PER_KEY);`;
const new1 = `async function fetchTwelveDataVolume(pairName, retryCount = 0) {
    if (retryCount > 5) {
        console.warn(\`[TwelveData] Max retries reached for \${pairName} — skipping to avoid hanging.\`);
        return null;
    }
    const keyIndex = await getAvailableKeyIndex(TD_KEYS, 'td_counter', TD_DAILY_LIMIT_PER_KEY);`;
const ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

const old2 = `        await setKeyExhausted('td_counter', keyIndex);
        return fetchTwelveDataVolume(pairName);
    }`;
const new2 = `        await setKeyExhausted('td_counter', keyIndex);
        return fetchTwelveDataVolume(pairName, retryCount + 1);
    }`;
const ok2 = content.includes(old2);
if (ok2) content = content.replace(old2, new2);

const old3 = `                        await sleep(1000);
                        resolve(await fetchTwelveDataVolume(pairName));
                        return;`;
const new3 = `                        await sleep(1000);
                        resolve(await fetchTwelveDataVolume(pairName, retryCount + 1));
                        return;`;
const ok3 = content.includes(old3);
if (ok3) content = content.replace(old3, new3);

fs.writeFileSync(path, content);
console.log('Patches applied:', { ok1, ok2, ok3 });
