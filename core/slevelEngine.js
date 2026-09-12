const admin = require('./firebase');

// ---------- Helpers: convert stored raw data into candle-object arrays ----------

function toCandleArray(raw) {
    if (!raw || !raw.opens) return [];
    const { opens, highs, lows, closes, times } = raw;
    const arr = [];
    for (let i = 0; i < opens.length; i++) {
        arr.push({ open: opens[i], high: highs[i], low: lows[i], close: closes[i], time: times[i] });
    }
    return arr;
}

function m30Key(t) {
    const ms = new Date(t).getTime();
    const THIRTY_MIN = 30 * 60 * 1000;
    return Math.floor(ms / THIRTY_MIN) * THIRTY_MIN;
}

// Builds M30 candles from M15 data (no extra API calls needed)
function aggregateM30(raw15m) {
    if (!raw15m || !raw15m.opens || raw15m.opens.length === 0) return [];
    const { opens, highs, lows, closes, times } = raw15m;
    const groups = [];
    let curKey = null, cur = null;
    for (let i = 0; i < opens.length; i++) {
        const key = m30Key(times[i]);
        if (key !== curKey) {
            curKey = key;
            cur = { open: opens[i], high: highs[i], low: lows[i], close: closes[i], time: times[i] };
            groups.push(cur);
        } else {
            cur.high = Math.max(cur.high, highs[i]);
            cur.low = Math.min(cur.low, lows[i]);
            cur.close = closes[i];
        }
    }
    return groups;
}

// ---------- Structure + Fractals (adapted from ici-indicator.js) ----------

function calcFractals(candles) {
    const up = [], down = [];
    for (let i = 4; i < candles.length; i++) {
        const h0=candles[i].high, h1=candles[i-1].high, h2=candles[i-2].high, h3=candles[i-3].high, h4=candles[i-4].high;
        if (h2>h3 && h2>h1 && h2>h4 && h2>h0) up.push({ index: i-2, price: h2 });
        const l0=candles[i].low, l1=candles[i-1].low, l2=candles[i-2].low, l3=candles[i-3].low, l4=candles[i-4].low;
        if (l2<l3 && l2<l1 && l2<l4 && l2<l0) down.push({ index: i-2, price: l2 });
    }
    return { up, down };
}

function computeStructureDirections(candles) {
    let range_dir = 1, range_high = null, range_low = null, high_locked = false, low_locked = false;
    let lowest_since_bd = null, highest_since_bu = null;
    const dirArr = new Array(candles.length).fill(null);

    for (let i = 0; i < candles.length; i++) {
        const o=candles[i].open, h=candles[i].high, l=candles[i].low, c=candles[i].close;
        const prevLow = i>0 ? candles[i-1].low : null;
        const prevHigh = i>0 ? candles[i-1].high : null;
        const bd_event = prevLow!=null && (o<prevLow || c<prevLow);
        lowest_since_bd = bd_event ? l : (lowest_since_bd==null ? l : Math.min(lowest_since_bd,l));
        const bu_event = prevHigh!=null && (o>prevHigh || c>prevHigh);
        highest_since_bu = bu_event ? h : (highest_since_bu==null ? h : Math.max(highest_since_bu,h));

        let mfx_ph=false, mfx_pl=false;
        if (i>=2) {
            const cH=candles[i-1].high, lH=candles[i-2].high, rH=h;
            mfx_ph = cH>lH && cH>rH;
            const cL=candles[i-1].low, lL=candles[i-2].low, rL=l;
            mfx_pl = cL<lL && cL<rL;
        }

        if (range_dir===1) {
            if (!high_locked) {
                const cur_high = range_high==null ? h : Math.max(range_high,h);
                const was_na_h = range_high==null;
                if (was_na_h || cur_high>range_high) range_high = cur_high;
                if (mfx_ph) high_locked = true;
            } else {
                if (o>range_high || c>range_high) {
                    high_locked=false; range_high=h; range_low=lowest_since_bd;
                }
            }
            if (range_low==null) range_low = lowest_since_bd;
            if (range_low!=null && (o<range_low || c<range_low)) {
                range_dir=-1; high_locked=false; low_locked=false;
                range_low=l; range_high=highest_since_bu;
            }
        } else {
            if (!low_locked) {
                const cur_low = range_low==null ? l : Math.min(range_low,l);
                const was_na_l = range_low==null;
                if (was_na_l || cur_low<range_low) range_low = cur_low;
                if (mfx_pl) low_locked = true;
            } else {
                if (o<range_low || c<range_low) {
                    low_locked=false; range_low=l; range_high=highest_since_bu;
                }
            }
            if (range_high==null) range_high = highest_since_bu;
            if (range_high!=null && (o>range_high || c>range_high)) {
                range_dir=1; high_locked=false; low_locked=false;
                range_high=h; range_low=lowest_since_bd;
            }
        }
        dirArr[i] = range_dir;
    }
    return dirArr;
}

// ---------- S01-S05 state machine ----------

function computeSLevel(candles) {
    if (!candles || candles.length < 10) return null;

    const dirArr = computeStructureDirections(candles);
    const { up: upFractals, down: downFractals } = calcFractals(candles);

    const upFractalAt = {};
    for (const f of upFractals) upFractalAt[f.index + 2] = f.price;
    const downFractalAt = {};
    for (const f of downFractals) downFractalAt[f.index + 2] = f.price;

    let direction = null;
    let level = 0;
    let awaitingFractal = null;
    let lastEventIndex = -1;

    for (let i = 0; i < candles.length; i++) {
        const c = candles[i];

        // Flip: structure bias changed direction -> S01 in new direction
        if (i > 0 && dirArr[i] !== dirArr[i-1]) {
            direction = dirArr[i] === 1 ? 'bull' : 'bear';
            level = 1;
            awaitingFractal = null;
            lastEventIndex = i;
            continue;
        }

        if (direction === null) continue;

        // Arm the next fractal to watch (formed after the last flip/advance)
        if (awaitingFractal === null) {
            if (direction === 'bull' && upFractalAt[i] !== undefined && i > lastEventIndex) {
                awaitingFractal = upFractalAt[i];
            } else if (direction === 'bear' && downFractalAt[i] !== undefined && i > lastEventIndex) {
                awaitingFractal = downFractalAt[i];
            }
        }

        // Check if the armed fractal breaks + closes -> advance
        if (awaitingFractal !== null) {
            if (direction === 'bull' && c.close > awaitingFractal) {
                level = Math.min(5, level + 1);
                awaitingFractal = null;
                lastEventIndex = i;
            } else if (direction === 'bear' && c.close < awaitingFractal) {
                level = Math.min(5, level + 1);
                awaitingFractal = null;
                lastEventIndex = i;
            }
        }
    }

    if (direction === null) return null;
    return { direction, level };
}

// ---------- Firebase write/delete per pair, per HTF ----------

async function firebaseDeleteSLevel(path) {
    try {
        await admin.database().ref(path).remove();
    } catch (err) {
        console.error(`❌ SLevel delete failed [${path}]:`, err.message);
    }
}

async function updateSLevelsForPair(pairName, weeklyRaw, h4Raw, m15Raw, firebasePut) {
    const htfCandles = {
        W: toCandleArray(weeklyRaw),
        '240': toCandleArray(h4Raw),
        '30': aggregateM30(m15Raw)
    };

    for (const htfKey of Object.keys(htfCandles)) {
        const candles = htfCandles[htfKey];
        const path = `slevelState/${htfKey}/${pairName}`;
        if (!candles || candles.length < 10) continue;

        const result = computeSLevel(candles);
        if (result) {
            await firebasePut(path, { level: result.level, direction: result.direction, updatedAt: Date.now() });
        } else {
            await firebaseDeleteSLevel(path);
        }
    }
}

module.exports = { updateSLevelsForPair, computeSLevel, calcFractals, computeStructureDirections, aggregateM30 };
