const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/ici-server.js';
let js = fs.readFileSync(path, 'utf8');

const ANCHOR = `    if (safePath === '/api/debug-raw') {`;
const NEW_ROUTE = `    if (safePath === '/api/debug-raw-keys') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ keys: Object.keys(scannerModule.RAW_1H || {}) }, null, 2));
        return;
    }
${ANCHOR}`;

if (!js.includes(ANCHOR)) console.error('FAILED: anchor not found');
else { js = js.replace(ANCHOR, NEW_ROUTE); fs.writeFileSync(path, js, 'utf8'); console.log('OK: keys route added'); }
