const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/ici-server.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_restorecache', content);

const old1 = `(async () => {
    await restoreState(firebaseGet);
    if (scannerModule && typeof scannerModule.masterScan === 'function') {`;
const new1 = `(async () => {
    await restoreState(firebaseGet);
    if (scannerModule && typeof scannerModule.restoreRawCandleCache === 'function') {
        await scannerModule.restoreRawCandleCache();
    }
    if (scannerModule && typeof scannerModule.masterScan === 'function') {`;
const ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

fs.writeFileSync(path, content);
console.log('Patch applied:', ok1);
