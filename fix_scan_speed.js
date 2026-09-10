const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_speedfix', content);

// 1) Concurrency + delays badhao/ghatao
content = content.replace(
  'const MAX_CONCURRENT = 2;        // only 2 parallel requests',
  'const MAX_CONCURRENT = 10;       // 10 parallel requests (16 keys available)'
);
content = content.replace(
  'const REQUEST_DELAY_MS  = 3500;  // 3.5 seconds between calls',
  'const REQUEST_DELAY_MS  = 300;   // small stagger only'
);
content = content.replace(
  'const BATCH_DELAY_MS    = 4000;  // 4 seconds after every batch',
  'const BATCH_DELAY_MS    = 200;   // minimal gap between batches'
);

// 2) Scan duration tracking add karo
content = content.replace(
  `async function masterScan() {
    if (isScanning) return;
    isScanning = true;`,
  `async function masterScan() {
    if (isScanning) return;
    isScanning = true;
    const scanStartTime = Date.now();`
);

content = content.replace(
  `        // 👇 AUTO‑SCAN NOTIFICATION (always send if AUTO_SCAN=true)
        if (process.env.AUTO_SCAN === 'true') {
            await sendTelegramDirect(\`✅ ICI Scanner: auto‑scan completed at \${new Date().toLocaleString()}\`);
        }

        isScanning = false;`,
  `        const scanDurationSec = ((Date.now() - scanStartTime) / 1000).toFixed(1);
        console.log(\`⏱️ Master Scan finished in \${scanDurationSec}s\`);

        // 👇 AUTO‑SCAN NOTIFICATION (always send if AUTO_SCAN=true)
        if (process.env.AUTO_SCAN === 'true') {
            await sendTelegramDirect(\`✅ ICI Scanner: auto‑scan completed at \${new Date().toLocaleString()} (\${scanDurationSec}s)\`);
        }

        isScanning = false;`
);

// 3) Sequential loop ko parallel batches mein badlo
const oldLoop = `        for (const p of config.PAIRS) {
            if (DATA_STORE[p.n]) {
                await firebasePut(\`marketData/\${p.n}\`, DATA_STORE[p.n]);
                // Determine category
                const category = p.isCrypto ? 'crypto' : 'forex';
                // Use conditional TG for pullback engine
                pullbackEngine.checkRules(p, DATA_STORE[p.n], RAW_1H[p.n], (msg) => conditionalSendTG(msg, category), firebasePut, '1h');
                if (RAW_4H[p.n]) {
                    pullbackEngine.checkRules(p, DATA_STORE[p.n], RAW_4H[p.n], (msg) => conditionalSendTG(msg, category), firebasePut, '4h');
                }
            }

            // 🔥 Execute Strategy Monitors
            const pairName = p.n;
            const dailyData = {
                closes: RAW_DAILY[pairName]?.closes,
                weeklyCloses: RAW_WEEKLY[pairName]?.closes
            };
            const hourlyData = {
                closes: RAW_1H[pairName]?.closes
            };
            const category = p.isCrypto ? 'crypto' : 'forex';

            if (dailyData.closes && hourlyData.closes) {
                await bullMonitor(\`\${pairName}_BULL\`, pairName, dailyData, hourlyData, (msg) => conditionalSendTG(msg, category), firebasePut, category, alertSettings);
                await bearMonitor(\`\${pairName}_BEAR\`, pairName, dailyData, hourlyData, (msg) => conditionalSendTG(msg, category), firebasePut, category, alertSettings);
            }

            // ✅ LTF Bull Monitor (all markets, requires 4h and 15m data)
            if (RAW_4H[pairName] && RAW_15M[pairName]) {
                const fourHourData = { closes: RAW_4H[pairName].closes };
                const fifteenMinData = { closes: RAW_15M[pairName].closes };
                await ltfBullMonitor(
                    \`\${pairName}_LTF_BULL\`,
                    pairName,
                    fourHourData,
                    fifteenMinData,
                    (msg) => conditionalSendTG(msg, category),
                    firebasePut,
                    category,
                    alertSettings
                );
            }
        }`;

const newLoop = `        const processPair = async (p) => {
            if (DATA_STORE[p.n]) {
                await firebasePut(\`marketData/\${p.n}\`, DATA_STORE[p.n]);
                const category = p.isCrypto ? 'crypto' : 'forex';
                pullbackEngine.checkRules(p, DATA_STORE[p.n], RAW_1H[p.n], (msg) => conditionalSendTG(msg, category), firebasePut, '1h');
                if (RAW_4H[p.n]) {
                    pullbackEngine.checkRules(p, DATA_STORE[p.n], RAW_4H[p.n], (msg) => conditionalSendTG(msg, category), firebasePut, '4h');
                }
            }

            const pairName = p.n;
            const dailyData = {
                closes: RAW_DAILY[pairName]?.closes,
                weeklyCloses: RAW_WEEKLY[pairName]?.closes
            };
            const hourlyData = {
                closes: RAW_1H[pairName]?.closes
            };
            const category = p.isCrypto ? 'crypto' : 'forex';

            if (dailyData.closes && hourlyData.closes) {
                await bullMonitor(\`\${pairName}_BULL\`, pairName, dailyData, hourlyData, (msg) => conditionalSendTG(msg, category), firebasePut, category, alertSettings);
                await bearMonitor(\`\${pairName}_BEAR\`, pairName, dailyData, hourlyData, (msg) => conditionalSendTG(msg, category), firebasePut, category, alertSettings);
            }

            if (RAW_4H[pairName] && RAW_15M[pairName]) {
                const fourHourData = { closes: RAW_4H[pairName].closes };
                const fifteenMinData = { closes: RAW_15M[pairName].closes };
                await ltfBullMonitor(
                    \`\${pairName}_LTF_BULL\`,
                    pairName,
                    fourHourData,
                    fifteenMinData,
                    (msg) => conditionalSendTG(msg, category),
                    firebasePut,
                    category,
                    alertSettings
                );
            }
        };

        const PAIR_BATCH_SIZE = 20;
        for (let i = 0; i < config.PAIRS.length; i += PAIR_BATCH_SIZE) {
            const slice = config.PAIRS.slice(i, i + PAIR_BATCH_SIZE);
            await Promise.all(slice.map(p => processPair(p).catch(err => {
                console.error(\`[masterScan] processPair failed for \${p.n}:\`, err.message);
            })));
        }`;

if (content.includes(oldLoop)) {
  content = content.replace(oldLoop, newLoop);
  console.log('✅ Loop parallelized successfully.');
} else {
  console.log('⚠️ Loop pattern match nahi hua — is hissay mein change nahi hui, manually check karni hogi.');
}

fs.writeFileSync(path, content);
console.log('✅ scanner.js update ho gayi. Backup: scanner.js.before_speedfix');
