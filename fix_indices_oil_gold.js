const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let content = fs.readFileSync(path, 'utf8');

const oldFn = `function forexYahooSymbol(pairName) {
    // e.g. EURUSD -> EURUSD=X, XAUUSD -> XAUUSD=X
    return \`\${pairName}=X\`;
}`;

const newFn = `const NON_FOREX_YAHOO_MAP = {
    'XAUUSD': 'GC=F',
    'USOIL':  'CL=F',
    'US500':  '^GSPC',
    'US100':  '^NDX',
    'US30':   '^DJI',
    'GER40':  '^GDAXI',
    'UK100':  '^FTSE',
    'JPN225': '^N225',
};

function forexYahooSymbol(pairName) {
    if (NON_FOREX_YAHOO_MAP[pairName]) return NON_FOREX_YAHOO_MAP[pairName];
    // e.g. EURUSD -> EURUSD=X
    return \`\${pairName}=X\`;
}`;

if (!content.includes(oldFn)) {
    console.error('❌ Old function nahi mila — file already badal chuki hai ya match nahi ho raha. Kuch change nahi kiya gaya.');
    process.exit(1);
}

content = content.replace(oldFn, newFn);
fs.writeFileSync(path, content, 'utf8');
console.log('✅ Patched: USOIL, XAUUSD aur 6 Indices ab sahi Yahoo symbols use karenge.');
