const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/ici-server.js';
let js = fs.readFileSync(path, 'utf8');

const ANCHOR = `    if (safePath === '/scan') {`;

const DEBUG_ROUTE = `    if (safePath === '/api/debug-raw') {
        const urlParams = new URL(req.url, \`http://\${req.headers.host}\`).searchParams;
        const sym = urlParams.get('symbol') || Object.keys(scannerModule.RAW_1H || {})[0];
        const tf = urlParams.get('tf') || '1h';
        const rawMap = { '1h': scannerModule.RAW_1H, '4h': scannerModule.RAW_4H, '1day': scannerModule.RAW_DAILY, '1week': scannerModule.RAW_WEEKLY }[tf];
        const d = rawMap ? rawMap[sym] : null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            symbol: sym,
            tf,
            totalSymbolsInStore: rawMap ? Object.keys(rawMap).length : 0,
            hasOpens: !!(d && Array.isArray(d.opens)),
            opensLength: d && d.opens ? d.opens.length : 0,
            hasTimesArray: !!(d && Array.isArray(d.times)),
            timesLength: d && d.times ? d.times.length : 0,
            lastOpen: d && d.opens ? d.opens[d.opens.length-1] : null,
            lastClose: d && d.closes ? d.closes[d.closes.length-1] : null,
            lastTime: d && d.times ? d.times[d.times.length-1] : (d ? d.time : null)
        }, null, 2));
        return;
    }
${ANCHOR}`;

if (!js.includes(ANCHOR)) {
  console.error('FAILED: anchor not found');
} else {
  js = js.replace(ANCHOR, DEBUG_ROUTE);
  fs.writeFileSync(path, js, 'utf8');
  console.log('OK: debug route added');
}
