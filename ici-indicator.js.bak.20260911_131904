window.ICIIndicator = (function() {
    function calcEMA(values, length) {
        const k = 2 / (length + 1);
        const out = new Array(values.length).fill(null);
        let ema = null;
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v == null) { out[i] = ema; continue; }
            ema = ema == null ? v : (v * k + ema * (1 - k));
            out[i] = ema;
        }
        return out;
    }

    function calcSMA(values, length) {
        const out = new Array(values.length).fill(null);
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
            sum += values[i];
            if (i >= length) sum -= values[i - length];
            if (i >= length - 1) out[i] = sum / length;
        }
        return out;
    }

    function calcATR(candles, length) {
        const trs = candles.map((c, i) => {
            if (i === 0) return c.high - c.low;
            const pc = candles[i-1].close;
            return Math.max(c.high - c.low, Math.abs(c.high - pc), Math.abs(c.low - pc));
        });
        const out = new Array(trs.length).fill(null);
        let rma = null;
        for (let i = 0; i < trs.length; i++) {
            if (i < length - 1) continue;
            if (i === length - 1) {
                let sum = 0;
                for (let j = 0; j <= i; j++) sum += trs[j];
                rma = sum / length;
            } else {
                rma = (rma * (length - 1) + trs[i]) / length;
            }
            out[i] = rma;
        }
        return out;
    }

    function calcFractals(candles) {
        const up = [], down = [];
        for (let i = 4; i < candles.length; i++) {
            const h0=candles[i].high, h1=candles[i-1].high, h2=candles[i-2].high, h3=candles[i-3].high, h4=candles[i-4].high;
            if (h2>h3 && h2>h1 && h2>h4 && h2>h0) up.push({ time: candles[i-2].time, price: h2 });
            const l0=candles[i].low, l1=candles[i-1].low, l2=candles[i-2].low, l3=candles[i-3].low, l4=candles[i-4].low;
            if (l2<l3 && l2<l1 && l2<l4 && l2<l0) down.push({ time: candles[i-2].time, price: l2 });
        }
        return { up, down };
    }

    function computeStructureMap(candles) {
        let range_dir = 1, range_high = null, range_low = null, high_locked = false, low_locked = false;
        let lowest_since_bd = null, highest_since_bu = null;
        const highLine = new Array(candles.length).fill(null);
        const lowLine = new Array(candles.length).fill(null);
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
            highLine[i]=range_high;
            lowLine[i]=range_low;
        }
        return { highLine, lowLine };
    }

    function aggregatePeriod(candles, period) {
        const groups = [];
        let curKey = null, curGroup = null;
        for (const c of candles) {
            const d = new Date(c.time * 1000);
            const key = period==='month' ? (d.getUTCFullYear()+'-'+d.getUTCMonth()) : (''+d.getUTCFullYear());
            if (key !== curKey) {
                curKey = key;
                curGroup = { time: c.time, open: c.open, high: c.high, low: c.low, close: c.close };
                groups.push(curGroup);
            } else {
                curGroup.high = Math.max(curGroup.high, c.high);
                curGroup.low = Math.min(curGroup.low, c.low);
                curGroup.close = c.close;
            }
        }
        return groups;
    }

    function mapHTFValue(mainTime, htfCandles, htfEmaArr) {
        let l=0, r=htfCandles.length-1, ans=-1;
        while (l<=r) {
            const mid=(l+r)>>1;
            if (htfCandles[mid].time <= mainTime) { ans=mid; l=mid+1; } else r=mid-1;
        }
        const completedIdx = ans - 1;
        if (completedIdx < 0) return null;
        return htfEmaArr[completedIdx];
    }

    function buildHTFLine(mainCandles, htfCandles, length, smoothLen) {
        if (!htfCandles || htfCandles.length < 2) return new Array(mainCandles.length).fill(null);
        const closes = htfCandles.map(c => c.close);
        let ema = calcEMA(closes, length);
        if (smoothLen > 1) ema = calcEMA(ema.map(v=>v==null?closes[0]:v), smoothLen);
        return mainCandles.map(c => mapHTFValue(c.time, htfCandles, ema));
    }

    // ---------------- Legend + Settings (TradingView style) ----------------

    const DEFAULT_SETTINGS = {
        ma1:       { label:'EMA',            period:5,  color:'#00FF00', width:1, visible:true },
        ma2:       { label:'EMA',            period:10, color:'#000000', width:1, visible:true },
        ma3:       { label:'EMA',            period:20, color:'#FF0000', width:2, visible:true },
        ma4:       { label:'EMA',            period:50, color:'#808080', width:1, visible:true },
        sma:       { label:'SMA',            period:50, color:'#BABDC0', width:1, visible:true },
        structure: { label:'Structure',                 color:'#2196F3', width:2, visible:true },
        htf1:      { label:'HTF EMA (auto)', period:20, smooth:3, color:'#FF6D00', width:2, visible:true },
        htf2:      { label:'HTF EMA (4H)',   period:20, smooth:3, color:'#AA00FF', width:2, visible:true },
        bigCandle: { label:'Big Candle ATR', period:14, multiplier:2.0, color:'#2196F3', visible:true },
        fractals:  { label:'Fractals',                  color:'#000000', visible:true }
    };
    let indicatorSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    const chartStates = {};      // containerId -> { chart, series, container, candles, interval, fetchHTF, lines, lastValues }
    const legendCollapsed = {};  // containerId -> bool
    let activeSettingsTab = 'inputs';
    let tempCfg = null;
    let settingsCtx = null;      // { containerId, id }

    function iconEye(open){
        return open
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.6 21.6 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a21.6 21.6 0 01-3.22 4.44"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 11-4.24-4.24"/></svg>';
    }
    const ICON_GEAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
    const ICON_CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';

    function ensureLegendCSS(){
        if (document.getElementById('ici-legend-css')) return;
        const style = document.createElement('style');
        style.id = 'ici-legend-css';
        style.textContent = `
.tv-legend{position:absolute;top:8px;left:8px;z-index:10;font-family:-apple-system,BlinkMacSystemFont,'Trebuchet MS',Roboto,Ubuntu,sans-serif;font-size:11px;user-select:none;}
.tv-legend-row{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.82);padding:2px 4px;border-radius:2px;margin-bottom:1px;white-space:nowrap;}
.tv-legend-row:hover{background:rgba(240,243,250,.95);}
.tv-legend-row:hover .tv-legend-actions{display:flex;}
.tv-legend-name{font-weight:400;}
.tv-legend-val{color:#787b86;}
.tv-legend-actions{display:none;align-items:center;gap:2px;margin-left:2px;}
.tv-legend-icon{width:15px;height:15px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#787b86;border-radius:2px;}
.tv-legend-icon:hover{background:rgba(0,0,0,.06);color:#131722;}
.tv-legend-icon svg{width:13px;height:13px;}
.tv-legend-collapse{cursor:pointer;color:#787b86;display:flex;align-items:center;gap:2px;padding:2px 4px;font-weight:600;}
.tv-legend-collapse:hover{color:#131722;}
.tv-legend-collapse svg{width:9px;height:9px;transition:transform .15s;}
.tv-legend.collapsed .tv-legend-row{display:none;}
.tv-legend.collapsed .tv-legend-collapse svg{transform:rotate(-90deg);}
.tv-settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,.1);z-index:999;display:flex;align-items:center;justify-content:center;}
.tv-settings-panel{width:400px;max-width:92vw;background:#fff;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,.25);font-family:-apple-system,BlinkMacSystemFont,'Trebuchet MS',Roboto,Ubuntu,sans-serif;overflow:hidden;}
.tv-settings-header{padding:14px 16px 0;font-size:16px;font-weight:590;color:#131722;}
.tv-settings-tabs{display:flex;gap:16px;padding:12px 16px 0;border-bottom:1px solid #e0e3eb;}
.tv-settings-tab{font-size:14px;color:#787b86;padding:6px 2px 10px;cursor:pointer;border-bottom:2px solid transparent;}
.tv-settings-tab.active{color:#131722;border-bottom-color:#2962ff;font-weight:590;}
.tv-settings-body{padding:16px;min-height:120px;}
.tv-settings-field{display:flex;align-items:center;justify-content:space-between;padding:7px 0;font-size:13px;color:#131722;}
.tv-settings-field input[type=number]{width:70px;padding:5px 6px;border:1px solid #d1d4dc;border-radius:4px;font-size:13px;}
.tv-settings-field input[type=color]{width:32px;height:24px;border:1px solid #d1d4dc;border-radius:4px;padding:0;cursor:pointer;}
.tv-settings-field input[type=checkbox]{width:14px;height:14px;cursor:pointer;}
.tv-settings-footer{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-top:1px solid #e0e3eb;}
.tv-btn{font-size:13px;padding:6px 14px;border-radius:4px;border:none;cursor:pointer;font-weight:590;}
.tv-btn-default{background:#f0f3fa;color:#131722;}
.tv-btn-default:hover{background:#e0e3eb;}
.tv-btn-primary{background:#2962ff;color:#fff;}
.tv-btn-primary:hover{background:#1e53e5;}
.tv-btn-cancel{background:transparent;color:#787b86;}
.tv-btn-cancel:hover{color:#131722;}
`;
        document.head.appendChild(style);
    }

    function formatVal(v){
        if (v == null) return '';
        return Math.abs(v) >= 100 ? v.toFixed(2) : v.toFixed(5);
    }

    function buildLegend(containerId){
        ensureLegendCSS();
        const st = chartStates[containerId];
        if (!st) return;
        let legend = st.container.querySelector('.tv-legend');
        if (legend) legend.remove();
        legend = document.createElement('div');
        legend.className = 'tv-legend';
        st.container.appendChild(legend);
        renderLegend(containerId);
    }

    function renderLegend(containerId){
        const st = chartStates[containerId];
        if (!st) return;
        const legend = st.container.querySelector('.tv-legend');
        if (!legend) return;
        legend.classList.toggle('collapsed', !!legendCollapsed[containerId]);
        let html = `<div class="tv-legend-collapse" onclick="window.ICIIndicator._toggleCollapse('${containerId}')">${ICON_CHEVRON}<span>ICI</span></div>`;
        Object.keys(indicatorSettings).forEach(id=>{
            const cfg = indicatorSettings[id];
            const val = st.lastValues ? st.lastValues[id] : null;
            html += `<div class="tv-legend-row">
                <span class="tv-legend-name" style="color:${cfg.visible?cfg.color:'#9598a1'}">${cfg.label}${cfg.period?(' '+cfg.period):''}</span>
                <span class="tv-legend-val">${cfg.visible ? formatVal(val) : ''}</span>
                <span class="tv-legend-actions">
                    <span class="tv-legend-icon" onclick="window.ICIIndicator._toggleVisible('${containerId}','${id}')" title="Show/Hide">${iconEye(cfg.visible)}</span>
                    <span class="tv-legend-icon" onclick="window.ICIIndicator._openSettings('${containerId}','${id}')" title="Settings">${ICON_GEAR}</span>
                </span>
            </div>`;
        });
        legend.innerHTML = html;
    }

    function toggleLegendCollapse(containerId){
        legendCollapsed[containerId] = !legendCollapsed[containerId];
        renderLegend(containerId);
    }

    function toggleIndicatorVisible(containerId, id){
        indicatorSettings[id].visible = !indicatorSettings[id].visible;
        redrawIndicators(containerId);
    }

    function openIndicatorSettings(containerId, id){
        tempCfg = JSON.parse(JSON.stringify(indicatorSettings[id]));
        settingsCtx = { containerId, id };
        activeSettingsTab = 'inputs';
        const overlay = document.createElement('div');
        overlay.className = 'tv-settings-overlay';
        overlay.id = 'ici-settings-overlay';
        overlay.onclick = function(e){ if (e.target===overlay) closeSettings(); };
        overlay.innerHTML = `
            <div class="tv-settings-panel">
                <div class="tv-settings-header">${tempCfg.label} — Settings</div>
                <div class="tv-settings-tabs">
                    <div class="tv-settings-tab active" data-tab="inputs" onclick="window.ICIIndicator._switchTab('inputs')">Inputs</div>
                    <div class="tv-settings-tab" data-tab="style" onclick="window.ICIIndicator._switchTab('style')">Style</div>
                </div>
                <div class="tv-settings-body" id="ici-settings-body"></div>
                <div class="tv-settings-footer">
                    <button class="tv-btn tv-btn-default" onclick="window.ICIIndicator._resetDefaults()">Defaults</button>
                    <div>
                        <button class="tv-btn tv-btn-cancel" onclick="window.ICIIndicator._closeSettings()">Cancel</button>
                        <button class="tv-btn tv-btn-primary" onclick="window.ICIIndicator._saveSettings()">Ok</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        renderSettingsBody();
    }

    function readInputsIntoTemp(){
        if (!tempCfg) return;
        const periodEl = document.getElementById('ici-set-period');
        const smoothEl = document.getElementById('ici-set-smooth');
        const multEl = document.getElementById('ici-set-multiplier');
        const colorEl = document.getElementById('ici-set-color');
        const widthEl = document.getElementById('ici-set-width');
        const visEl = document.getElementById('ici-set-visible');
        if (periodEl) tempCfg.period = Math.max(1, parseInt(periodEl.value)||tempCfg.period);
        if (smoothEl) tempCfg.smooth = Math.max(1, parseInt(smoothEl.value)||tempCfg.smooth);
        if (multEl) tempCfg.multiplier = parseFloat(multEl.value)||tempCfg.multiplier;
        if (colorEl) tempCfg.color = colorEl.value;
        if (widthEl) tempCfg.width = Math.max(1, parseInt(widthEl.value)||tempCfg.width);
        if (visEl) tempCfg.visible = visEl.checked;
    }

    function switchSettingsTab(tab){
        readInputsIntoTemp();
        activeSettingsTab = tab;
        document.querySelectorAll('.tv-settings-tab').forEach(function(t){ t.classList.toggle('active', t.dataset.tab===tab); });
        renderSettingsBody();
    }

    function renderSettingsBody(){
        const cfg = tempCfg;
        const body = document.getElementById('ici-settings-body');
        if (!body || !cfg) return;
        if (activeSettingsTab === 'inputs') {
            let html = '';
            if (cfg.period !== undefined) html += `<div class="tv-settings-field"><span>Length</span><input type="number" id="ici-set-period" min="1" value="${cfg.period}"></div>`;
            if (cfg.smooth !== undefined) html += `<div class="tv-settings-field"><span>Smoothing</span><input type="number" id="ici-set-smooth" min="1" value="${cfg.smooth}"></div>`;
            if (cfg.multiplier !== undefined) html += `<div class="tv-settings-field"><span>ATR Multiplier</span><input type="number" step="0.1" min="0.1" id="ici-set-multiplier" value="${cfg.multiplier}"></div>`;
            if (!html) html = '<div class="tv-settings-field"><span style="color:#787b86">No inputs</span></div>';
            body.innerHTML = html;
        } else {
            let html = `<div class="tv-settings-field"><span>Color</span><input type="color" id="ici-set-color" value="${cfg.color}"></div>`;
            if (cfg.width !== undefined) html += `<div class="tv-settings-field"><span>Line width</span><input type="number" id="ici-set-width" min="1" max="4" value="${cfg.width}"></div>`;
            html += `<div class="tv-settings-field"><span>Visible</span><input type="checkbox" id="ici-set-visible" ${cfg.visible?'checked':''}></div>`;
            body.innerHTML = html;
        }
    }

    function saveIndicatorSettings(){
        readInputsIntoTemp();
        if (!settingsCtx || !tempCfg) return;
        indicatorSettings[settingsCtx.id] = tempCfg;
        const containerId = settingsCtx.containerId;
        closeSettings();
        redrawIndicators(containerId);
    }

    function resetIndicatorDefaults(){
        if (!settingsCtx) return;
        tempCfg = JSON.parse(JSON.stringify(DEFAULT_SETTINGS[settingsCtx.id]));
        renderSettingsBody();
    }

    function closeSettings(){
        const overlay = document.getElementById('ici-settings-overlay');
        if (overlay) overlay.remove();
        tempCfg = null;
        settingsCtx = null;
    }

    async function redrawIndicators(containerId){
        const st = chartStates[containerId];
        if (!st) return;
        await drawIndicatorSeries(st);
        renderLegend(containerId);
    }

    async function drawIndicatorSeries(st){
        const { chart, series, container, candles, interval, fetchHTF } = st;
        const closes = candles.map(c=>c.close);
        st.lastValues = st.lastValues || {};

        container.querySelectorAll('.ici-overlay-label').forEach(el => el.remove());
        Object.values(st.lines || {}).forEach(ls => { try { chart.removeSeries(ls); } catch(e){} });
        st.lines = {};

        // 1) EMA/SMA lines
        ['ma1','ma2','ma3','ma4'].forEach(id => {
            const cfg = indicatorSettings[id];
            const vals = calcEMA(closes, cfg.period);
            const lastVal = vals.slice().reverse().find(v=>v!=null);
            st.lastValues[id] = lastVal!=null ? lastVal : null;
            if (!cfg.visible) return;
            const ls = chart.addLineSeries({ color: cfg.color, lineWidth: cfg.width, priceLineVisible: false, lastValueVisible: false });
            ls.setData(candles.map((c,i)=>({ time: c.time, value: vals[i] })).filter(p=>p.value!=null));
            st.lines[id] = ls;
        });
        {
            const cfg = indicatorSettings.sma;
            const vals = calcSMA(closes, cfg.period);
            const lastVal = vals.slice().reverse().find(v=>v!=null);
            st.lastValues.sma = lastVal!=null ? lastVal : null;
            if (cfg.visible) {
                const ls = chart.addLineSeries({ color: cfg.color, lineWidth: cfg.width, priceLineVisible: false, lastValueVisible: false });
                ls.setData(candles.map((c,i)=>({ time: c.time, value: vals[i] })).filter(p=>p.value!=null));
                st.lines.sma = ls;
            }
        }

        // 2) ATR + Big Candle Highlight
        const bcCfg = indicatorSettings.bigCandle;
        const atr = calcATR(candles, bcCfg.period);
        const bigEma20 = calcEMA(closes, 20);
        const lastAtr = atr.slice().reverse().find(v=>v!=null);
        st.lastValues.bigCandle = lastAtr!=null ? lastAtr : null;
        let coloredCandles = candles;
        if (bcCfg.visible) {
            coloredCandles = candles.map((c,i) => {
                const a = atr[i];
                if (a == null) return c;
                const range = c.high - c.low;
                const threshold = a * bcCfg.multiplier;
                const isBull = c.close > c.open, isBear = c.close < c.open;
                const e20 = bigEma20[i];
                const above = e20!=null && c.close > e20;
                const below = e20!=null && c.close < e20;
                const isBig = range >= threshold && ((above && isBull) || (below && isBear));
                return isBig ? { ...c, color: bcCfg.color, wickColor: bcCfg.color, borderColor: bcCfg.color } : c;
            });
        }
        series.setData(coloredCandles);

        // 3) Fractals as markers
        const frCfg = indicatorSettings.fractals;
        if (frCfg.visible) {
            const { up, down } = calcFractals(candles);
            const markers = [
                ...up.map(f => ({ time: f.time, position: 'aboveBar', color: frCfg.color, shape: 'circle', text: '' })),
                ...down.map(f => ({ time: f.time, position: 'belowBar', color: frCfg.color, shape: 'circle', text: '' }))
            ].sort((a,b) => a.time - b.time);
            series.setMarkers(markers);
        } else {
            series.setMarkers([]);
        }

        // 4) Structure Map
        {
            const cfg = indicatorSettings.structure;
            const { highLine, lowLine } = computeStructureMap(candles);
            const lastHigh = highLine.slice().reverse().find(v=>v!=null);
            st.lastValues.structure = lastHigh!=null ? lastHigh : null;
            if (cfg.visible) {
                const structHigh = chart.addLineSeries({ color: cfg.color, lineWidth: cfg.width, priceLineVisible: false, lastValueVisible: false });
                const structLow = chart.addLineSeries({ color: cfg.color, lineWidth: cfg.width, priceLineVisible: false, lastValueVisible: false });
                structHigh.setData(candles.map((c,i)=>({ time: c.time, value: highLine[i] })).filter(p=>p.value!=null));
                structLow.setData(candles.map((c,i)=>({ time: c.time, value: lowLine[i] })).filter(p=>p.value!=null));
                st.lines.structHigh = structHigh;
                st.lines.structLow = structLow;
            }
        }

        // 5) HTF EMA1 (auto) + HTF2 (fixed 4H)
        try {
            const h1Cfg = indicatorSettings.htf1;
            if (h1Cfg.visible) {
                let htf1Candles = null;
                if (interval === '1h') htf1Candles = await fetchHTF('1day');
                else if (interval === '4h') htf1Candles = await fetchHTF('1week');
                else if (interval === '1day') htf1Candles = aggregatePeriod(candles, 'month');
                else if (interval === '1week') htf1Candles = aggregatePeriod(candles, 'year');
                if (htf1Candles && htf1Candles.length > 5) {
                    const htf1Line = buildHTFLine(candles, htf1Candles, h1Cfg.period, h1Cfg.smooth);
                    const lastVal = htf1Line.slice().reverse().find(v=>v!=null);
                    st.lastValues.htf1 = lastVal!=null ? lastVal : null;
                    const s1 = chart.addLineSeries({ color: h1Cfg.color, lineWidth: h1Cfg.width, priceLineVisible: false, lastValueVisible: false });
                    s1.setData(candles.map((c,i)=>({ time: c.time, value: htf1Line[i] })).filter(p=>p.value!=null));
                    st.lines.htf1 = s1;
                }
            }
            const h2Cfg = indicatorSettings.htf2;
            if (h2Cfg.visible) {
                const htf2Candles = interval === '4h' ? candles : await fetchHTF('4h');
                if (htf2Candles && htf2Candles.length > 5) {
                    const htf2Line = buildHTFLine(candles, htf2Candles, h2Cfg.period, h2Cfg.smooth);
                    const lastVal = htf2Line.slice().reverse().find(v=>v!=null);
                    st.lastValues.htf2 = lastVal!=null ? lastVal : null;
                    const s2 = chart.addLineSeries({ color: h2Cfg.color, lineWidth: h2Cfg.width, priceLineVisible: false, lastValueVisible: false });
                    s2.setData(candles.map((c,i)=>({ time: c.time, value: htf2Line[i] })).filter(p=>p.value!=null));
                    st.lines.htf2 = s2;
                }
            }
        } catch (e) { console.warn('[ICIIndicator] HTF EMA error:', e.message); }

        // 6) Watermark + ATR text overlay
        const lastClose = closes[closes.length-1];
        const lastEma20 = bigEma20[bigEma20.length-1];
        const marketBull = lastEma20!=null && lastClose > lastEma20;
        const marketBear = lastEma20!=null && lastClose < lastEma20;
        const wmColor = marketBull ? '#00FF7F' : marketBear ? '#FF4444' : '#CFD8DC';
        const wmBg = marketBull ? 'rgba(0,51,0,0.6)' : marketBear ? 'rgba(45,0,0,0.6)' : 'rgba(10,14,26,0.6)';

        const wmDiv = document.createElement('div');
        wmDiv.className = 'ici-overlay-label';
        wmDiv.textContent = '◈ ICI BY Muhammad Aamir ◈';
        wmDiv.style.cssText = `position:absolute;bottom:6px;left:50%;transform:translateX(-50%);background:${wmBg};color:${wmColor};border:1px solid ${wmColor};padding:2px 10px;font-size:13px;font-weight:600;border-radius:3px;pointer-events:none;z-index:5;white-space:nowrap;`;
        container.appendChild(wmDiv);

        const atrDiv = document.createElement('div');
        atrDiv.className = 'ici-overlay-label';
        atrDiv.textContent = `◈ ATR (${interval}) : ${lastAtr!=null ? lastAtr.toFixed(5) : '-'} ◈`;
        atrDiv.style.cssText = `position:absolute;bottom:6px;right:6px;background:${wmBg};color:${wmColor};border:1px solid ${wmColor};padding:2px 8px;font-size:11px;font-weight:600;border-radius:3px;pointer-events:none;z-index:5;white-space:nowrap;`;
        container.appendChild(atrDiv);
    }

    async function render(opts) {
        const { chart, series, container, candles, interval, fetchHTF } = opts;
        if (!candles || candles.length < 5) return;

        if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
        if (!container.id) container.id = 'ici-anon-' + Math.random().toString(36).slice(2,9);
        const containerId = container.id;

        chartStates[containerId] = { chart, series, container, candles, interval, fetchHTF, lines: {}, lastValues: {} };

        await drawIndicatorSeries(chartStates[containerId]);
        buildLegend(containerId);
    }

    return {
        render,
        _toggleVisible: toggleIndicatorVisible,
        _toggleCollapse: toggleLegendCollapse,
        _openSettings: openIndicatorSettings,
        _closeSettings: closeSettings,
        _saveSettings: saveIndicatorSettings,
        _switchTab: switchSettingsTab,
        _resetDefaults: resetIndicatorDefaults
    };
})();
