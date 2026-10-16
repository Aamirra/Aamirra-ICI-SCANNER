const admin = require('firebase-admin');
const lastMet = new Map();
let busy = false;

const CCY = '(AUD|CAD|CHF|EUR|GBP|JPY|NZD|USD)';
const FOREX_RE = new RegExp('^' + CCY + CCY + '$');
const YAHOO_MAP = {
    XAUUSD: 'GC=F', USOIL: 'CL=F', US500: '^GSPC', US100: '^NDX', US30: '^DJI',
    GER40: '^GDAXI', UK100: '^FTSE', JPN225: '^N225', BTCUSD: 'BTC-USD', ETHUSD: 'ETH-USD'
};

function fmtTime() {
    try { return new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi' }); }
    catch (e) { return new Date().toISOString(); }
}

async function yahooPrice(sym) {
    try {
        const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=1d&interval=1m', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(8000)
        });
        const j = await r.json();
        const m = j && j.chart && j.chart.result && j.chart.result[0] && j.chart.result[0].meta;
        const p = m && Number(m.regularMarketPrice);
        return p > 0 ? p : null;
    } catch (e) { return null; }
}

async function binancePrice(pair) {
    const bs = /USDT$/.test(pair) ? pair : pair.replace(/USD$/, 'USDT');
    const urls = [
        'https://fapi.binance.com/fapi/v1/ticker/price?symbol=' + bs,
        'https://api.binance.com/api/v3/ticker/price?symbol=' + bs
    ];
    for (const u of urls) {
        try {
            const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
            const j = await r.json();
            const p = Number(j && j.price);
            if (p > 0) return p;
        } catch (e) {}
    }
    return null;
}

async function getPairInfo(db, pair) {
    let d = (await db.ref('marketData/' + pair).once('value')).val();
    let kind = null, sym = null;
    if (d) {
        if (pair === 'BTCUSD' || pair === 'ETHUSD') { kind = 'crypto'; sym = pair; }
        else if (YAHOO_MAP[pair]) { kind = 'yahoo'; sym = YAHOO_MAP[pair]; }
        else if (FOREX_RE.test(pair)) { kind = 'yahoo'; sym = pair + '=X'; }
        else { kind = 'crypto'; sym = pair; }
    } else {
        d = (await db.ref('stockMarketData/' + pair).once('value')).val();
        if (d) { kind = 'yahoo'; sym = pair; }
        else {
            d = (await db.ref('psxStockMarketData/' + pair).once('value')).val();
            if (d) { kind = 'yahoo'; sym = pair + '.KA'; }
        }
    }
    if (!d) return null;
    let live = kind === 'crypto' ? await binancePrice(sym) : await yahooPrice(sym);
    if (live == null && kind === 'yahoo' && YAHOO_MAP[pair] && /USD$/.test(pair)) live = await binancePrice(pair);
    const stale = d.currentPrice != null ? d.currentPrice : d.price;
    return Object.assign({}, d, { currentPrice: live != null ? live : stale, _live: live != null });
}

function isMet(a, d) {
    const p = Number(d.currentPrice);
    if (!p) return null;
    const t = a.targetPrice;
    switch (a.condition) {
        case 'PRICE_ABOVE_VAL': return t != null && p >= t;
        case 'PRICE_BELOW_VAL': return t != null && p <= t;
        case 'PRICE_ABOVE_EMA20': return d.ema20 != null ? p > d.ema20 : null;
        case 'PRICE_BELOW_EMA20': return d.ema20 != null ? p < d.ema20 : null;
        case 'PRICE_ABOVE_SMA20': return d.sma20 != null ? p > d.sma20 : null;
        case 'PRICE_BELOW_SMA20': return d.sma20 != null ? p < d.sma20 : null;
        case 'PRICE_ABOVE_SMA50': return d.sma50 != null ? p > d.sma50 : null;
        case 'PRICE_BELOW_SMA50': return d.sma50 != null ? p < d.sma50 : null;
        default: return null;
    }
}

async function sendTG(text) {
    const token = process.env.BOT_TOKEN, chatId = process.env.CHAT_ID;
    if (!token || !chatId) return;
    const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: text })
    });
    const j = await r.json();
    if (!j.ok) console.error('userAlert TG error:', j.description);
}

async function check() {
    const db = admin.database();
    const devices = (await db.ref('userAlerts').once('value')).val();
    if (!devices) return;
    const list = [];
    Object.keys(devices).forEach(function (dev) {
        Object.values(devices[dev] || {}).forEach(function (a) {
            if (a && a.active) {
                const tp = String(a.targetPrice).replace(/[^A-Za-z0-9]/g, 'p');
                list.push(Object.assign({ key: dev + '_' + a.id + '_' + a.condition + '_' + tp, dev: dev }, a));
            }
        });
    });
    if (!list.length) return;
    const state = (await db.ref('userAlertState').once('value')).val() || {};
    const infoCache = new Map();

    for (const a of list) {
        if (!infoCache.has(a.pair)) infoCache.set(a.pair, await getPairInfo(db, a.pair));
        const d = infoCache.get(a.pair);
        if (!d) continue;
        const met = isMet(a, d);
        if (met === null) continue;

        const once = (a.frequency || 'Only Once') === 'Only Once';
        let fire = false;
        if (once) {
            if (met && !state[a.key]) fire = true;
        } else {
            const prev = lastMet.get(a.key);
            if (prev === false && met) fire = true;
            lastMet.set(a.key, met);
        }
        if (!fire) continue;

        const price = d.currentPrice;
        const text = (a.message || '{{ticker}} triggered!')
            .replace('{{ticker}}', a.pair)
            .replace('{{price}}', price)
            .replace('{{ema20}}', d.ema20 || '')
            .replace('{{time}}', fmtTime());
        const msg = '[' + a.pair + '] ' + text + '\nAlert: ' + (a.name || a.pair) + ' | Price: ' + price;

        if (once) {
            await db.ref('userAlertState/' + a.key).set(true);
            await db.ref('userAlerts/' + a.dev + '/' + a.id + '/active').set(false);
        }
        await sendTG(msg);
        console.log('User alert fired:', a.pair, a.condition, a.targetPrice, price, d._live ? '(live)' : '(STALE)');
    }
}

function start() {
    setInterval(async function () {
        if (busy) return;
        busy = true;
        try { await check(); } catch (e) { console.error('userAlertChecker error:', e.message); }
        busy = false;
    }, 20000);
    console.log('userAlertChecker started (20s, live prices)');
}

module.exports = { start };
