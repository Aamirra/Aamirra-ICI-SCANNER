// Shared in-memory candle cache + in-flight request de-duplication.
// One pm2 process = one cache shared by every user/browser hitting the server.
const cache = {};     // key -> { candles, meta, updatedAt }
const inFlight = {};  // key -> Promise (prevents duplicate simultaneous fetches)
const lastSeen = {};  // key -> last time someone actually requested it

const REFRESH_TICK_MS = 60 * 1000;     // background refresh cadence
const DROP_AFTER_MS = 15 * 60 * 1000;  // stop refreshing/evict symbols nobody viewed in 15 min

async function getCandles(key, meta, coldFetchFn) {
    lastSeen[key] = Date.now();

    if (cache[key]) return cache[key].candles;
    if (inFlight[key]) return inFlight[key];

    inFlight[key] = (async () => {
        try {
            const candles = await coldFetchFn();
            if (candles && candles.length) {
                cache[key] = { candles, meta, updatedAt: Date.now() };
            }
            return candles || [];
        } finally {
            delete inFlight[key];
        }
    })();

    return inFlight[key];
}

function startBackgroundRefresh(refreshersByType) {
    setInterval(async () => {
        const now = Date.now();
        for (const key of Object.keys(cache)) {
            if (now - (lastSeen[key] || 0) > DROP_AFTER_MS) {
                delete cache[key];
                delete lastSeen[key];
                delete inFlight[key];
                continue;
            }
            const entry = cache[key];
            const refreshFn = refreshersByType[entry.meta.type];
            if (!refreshFn) continue;
            try {
                const merged = await refreshFn(entry.meta, entry.candles);
                if (merged && merged.length) {
                    cache[key] = { candles: merged, meta: entry.meta, updatedAt: Date.now() };
                }
            } catch (e) { /* keep serving old cache on a refresh error */ }
        }
    }, REFRESH_TICK_MS);
    console.log('[chartCache] background refresh started');
}

module.exports = { getCandles, startBackgroundRefresh };
