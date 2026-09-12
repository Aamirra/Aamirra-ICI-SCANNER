const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let content = fs.readFileSync(path, 'utf8');

const oldMap = `const NON_FOREX_YAHOO_MAP = {
    'XAUUSD': 'GC=F',
    'USOIL':  'CL=F',
    'US500':  '^GSPC',
    'US100':  '^NDX',
    'US30':   '^DJI',
    'GER40':  '^GDAXI',
    'UK100':  '^FTSE',
    'JPN225': '^N225',
};`;

const newMap = `const NON_FOREX_YAHOO_MAP = {
    'XAUUSD': 'GC=F',
    'USOIL':  'CL=F',
    'US500':  '^GSPC',
    'US100':  '^NDX',
    'US30':   '^DJI',
    'GER40':  '^GDAXI',
    'UK100':  '^FTSE',
    'JPN225': '^N225',
    'BTCUSD': 'BTC-USD',
    'ETHUSD': 'ETH-USD',
};`;

if (!content.includes(oldMap)) {
    console.error('❌ Map nahi mila — pehla patch shayad already alag ho chuka hai ya kuch match nahi ho raha. Kuch change nahi kiya gaya.');
    process.exit(1);
}

content = content.replace(oldMap, newMap);
fs.writeFileSync(path, content, 'utf8');
console.log('✅ Patched: BTCUSD/ETHUSD (forex page wale) ab sahi Yahoo ticker (BTC-USD/ETH-USD) use karenge.');
