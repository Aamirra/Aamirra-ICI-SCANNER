const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let src = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_missinghelpersfix', src);

const oldAnchor = `    });
}

async function fetchStockCandlesFull(symbol, market, interval, totalWanted) {`;

const newAnchor = `    });
}

function fixNativeOpens(daily) {
    const fixed = [];
    for (let i = 0; i < daily.length; i++) {
        const c = daily[i];
        const open = i === 0 ? c.open : daily[i - 1].close;
        fixed.push({ time: c.time, open, high: c.high, low: c.low, close: c.close });
    }
    return fixed;
}

function mergeOlderWithRecent(older, recent) {
    if (!recent.length) return older;
    const cutoff = recent[0].time;
    const trimmedOlder = older.filter(c => c.time < cutoff);
    return trimmedOlder.concat(recent);
}

async function fetchStockCandlesFull(symbol, market, interval, totalWanted) {`;

if (!src.includes(oldAnchor)) {
    console.error('MATCH FAILED - aborting. No changes made.');
    process.exit(1);
}
src = src.replace(oldAnchor, newAnchor);
fs.writeFileSync(path, src);
console.log('Added missing fixNativeOpens() and mergeOlderWithRecent() functions');
