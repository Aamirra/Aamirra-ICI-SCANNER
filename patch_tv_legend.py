import re, shutil, datetime

FILES = ["index.html", "crypto.html", "stocks.html"]
TS = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
CSS_MARKER = "/* TV-LEGEND-CSS */"
JS_MARKER = "// TV-LEGEND-JS"

CSS_BLOCK = CSS_MARKER + """
.tv-legend{position:absolute;top:8px;left:8px;z-index:10;font-family:-apple-system,BlinkMacSystemFont,'Trebuchet MS',Roboto,Ubuntu,sans-serif;font-size:12px;user-select:none;}
.tv-legend-row{display:flex;align-items:center;gap:4px;background:rgba(255,255,255,.82);padding:2px 4px;border-radius:2px;margin-bottom:1px;white-space:nowrap;}
.tv-legend-row:hover{background:rgba(240,243,250,.95);}
.tv-legend-row:hover .tv-legend-actions{display:flex;}
.tv-legend-name{font-weight:400;}
.tv-legend-actions{display:none;align-items:center;gap:2px;margin-left:2px;}
.tv-legend-icon{width:16px;height:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#787b86;border-radius:2px;}
.tv-legend-icon:hover{background:rgba(0,0,0,.06);color:#131722;}
.tv-legend-icon svg{width:14px;height:14px;}
.tv-legend-collapse{cursor:pointer;color:#787b86;display:flex;align-items:center;gap:2px;padding:2px 4px;}
.tv-legend-collapse:hover{color:#131722;}
.tv-legend-collapse svg{width:10px;height:10px;transition:transform .15s;}
.tv-legend.collapsed .tv-legend-row{display:none;}
.tv-legend.collapsed .tv-legend-collapse svg{transform:rotate(-90deg);}
.tv-settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,.1);z-index:999;display:flex;align-items:center;justify-content:center;}
.tv-settings-panel{width:420px;max-width:92vw;background:#fff;border-radius:6px;box-shadow:0 2px 12px rgba(0,0,0,.25);font-family:-apple-system,BlinkMacSystemFont,'Trebuchet MS',Roboto,Ubuntu,sans-serif;overflow:hidden;}
.tv-settings-header{padding:14px 16px 0;font-size:16px;font-weight:590;color:#131722;}
.tv-settings-tabs{display:flex;gap:16px;padding:12px 16px 0;border-bottom:1px solid #e0e3eb;}
.tv-settings-tab{font-size:14px;color:#787b86;padding:6px 2px 10px;cursor:pointer;border-bottom:2px solid transparent;}
.tv-settings-tab.active{color:#131722;border-bottom-color:#2962ff;font-weight:590;}
.tv-settings-body{padding:16px;min-height:140px;}
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
"""

JS_BLOCK = JS_MARKER + """
<script>
let indicatorSettings = {
    ema10: {label:'EMA', period:10, color:'#0062ff', width:1, visible:true, calc:'ema'},
    ema20: {label:'EMA', period:20, color:'#ef4444', width:1, visible:true, calc:'ema'},
    sma50: {label:'SMA', period:50, color:'#cbd5e1', width:1, visible:true, calc:'sma'},
    atr:   {label:'ATR', period:14, color:'#8b5cf6', width:1, visible:true, calc:'atr'}
};
const seriesRefs = {};
let lastLoadedCandles = [];
let legendCollapsed = false;
let activeSettingsTab = 'inputs';
const DEFAULTS = JSON.parse(JSON.stringify(indicatorSettings));

function calcByType(type, data, p){
    if(type==='ema') return calcEMA(data,p);
    if(type==='sma') return calcSMA(data,p);
    if(type==='atr') return calcATR(data,p);
    return [];
}

function applyIndicatorData(){
    if(!lastLoadedCandles.length) return;
    Object.keys(indicatorSettings).forEach(id=>{
        const cfg = indicatorSettings[id];
        const s = seriesRefs[id];
        if(!s) return;
        s.setData(cfg.visible ? calcByType(cfg.calc, lastLoadedCandles, cfg.period) : []);
        s.applyOptions({color:cfg.color, lineWidth:cfg.width, visible:cfg.visible});
    });
}

function iconEye(open){
    return open
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0112 19c-7 0-11-7-11-7a21.6 21.6 0 015.06-6.06M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 7 11 7a21.6 21.6 0 01-3.22 4.44"/><path d="M1 1l22 22"/><path d="M14.12 14.12a3 3 0 11-4.24-4.24"/></svg>';
}
const iconGear = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>';
const iconChevron = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';

function buildLegend(){
    const chartEl = document.getElementById('chart');
    if(getComputedStyle(chartEl).position === 'static') chartEl.style.position = 'relative';
    let legend = document.getElementById('tv-legend');
    if(legend) legend.remove();
    legend = document.createElement('div');
    legend.id = 'tv-legend';
    legend.className = 'tv-legend';
    chartEl.appendChild(legend);
    renderLegend();
}

function renderLegend(){
    const legend = document.getElementById('tv-legend');
    if(!legend) return;
    legend.classList.toggle('collapsed', legendCollapsed);
    let html = '<div class="tv-legend-collapse" onclick="toggleLegendCollapse()">' + iconChevron + '<span>Indicators</span></div>';
    Object.keys(indicatorSettings).forEach(id=>{
        const cfg = indicatorSettings[id];
        html += '<div class="tv-legend-row"><span class="tv-legend-name" style="color:' + (cfg.visible?cfg.color:'#9598a1') + '">' + cfg.label + ' ' + cfg.period + '</span><span class="tv-legend-actions"><span class="tv-legend-icon" onclick="toggleIndicatorVisible(\\'' + id + '\\')" title="Show/Hide">' + iconEye(cfg.visible) + '</span><span class="tv-legend-icon" onclick="openIndicatorSettings(\\'' + id + '\\')" title="Settings">' + iconGear + '</span></span></div>';
    });
    legend.innerHTML = html;
}

function toggleLegendCollapse(){ legendCollapsed = !legendCollapsed; renderLegend(); }

function toggleIndicatorVisible(id){
    indicatorSettings[id].visible = !indicatorSettings[id].visible;
    applyIndicatorData();
    renderLegend();
}

function openIndicatorSettings(id){
    const cfg = indicatorSettings[id];
    activeSettingsTab = 'inputs';
    window.__tvSettingsId = id;
    const overlay = document.createElement('div');
    overlay.className = 'tv-settings-overlay';
    overlay.id = 'tv-settings-overlay';
    overlay.onclick = function(e){ if(e.target===overlay) closeSettings(); };
    overlay.innerHTML = '<div class="tv-settings-panel"><div class="tv-settings-header">' + cfg.label + ' — Settings</div><div class="tv-settings-tabs"><div class="tv-settings-tab active" data-tab="inputs" onclick="switchSettingsTab(\\'inputs\\')">Inputs</div><div class="tv-settings-tab" data-tab="style" onclick="switchSettingsTab(\\'style\\')">Style</div></div><div class="tv-settings-body" id="tv-settings-body"></div><div class="tv-settings-footer"><button class="tv-btn tv-btn-default" onclick="resetIndicatorDefaults(\\'' + id + '\\')">Defaults</button><div><button class="tv-btn tv-btn-cancel" onclick="closeSettings()">Cancel</button><button class="tv-btn tv-btn-primary" onclick="saveIndicatorSettings(\\'' + id + '\\')">Ok</button></div></div></div>';
    document.body.appendChild(overlay);
    renderSettingsBody(id);
}

function switchSettingsTab(tab){
    activeSettingsTab = tab;
    document.querySelectorAll('.tv-settings-tab').forEach(function(t){ t.classList.toggle('active', t.dataset.tab===tab); });
    renderSettingsBody(window.__tvSettingsId);
}

function renderSettingsBody(id){
    const cfg = indicatorSettings[id];
    const body = document.getElementById('tv-settings-body');
    if(activeSettingsTab === 'inputs'){
        body.innerHTML = '<div class="tv-settings-field"><span>Length</span><input type="number" id="tv-set-period" min="1" value="' + cfg.period + '"></div>';
    } else {
        body.innerHTML = '<div class="tv-settings-field"><span>Color</span><input type="color" id="tv-set-color" value="' + cfg.color + '"></div><div class="tv-settings-field"><span>Line width</span><input type="number" id="tv-set-width" min="1" max="4" value="' + cfg.width + '"></div><div class="tv-settings-field"><span>Visible</span><input type="checkbox" id="tv-set-visible" ' + (cfg.visible?'checked':'') + '></div>';
    }
}

function saveIndicatorSettings(id){
    const cfg = indicatorSettings[id];
    const periodEl = document.getElementById('tv-set-period');
    const colorEl = document.getElementById('tv-set-color');
    const widthEl = document.getElementById('tv-set-width');
    const visEl = document.getElementById('tv-set-visible');
    if(periodEl) cfg.period = Math.max(1, parseInt(periodEl.value)||cfg.period);
    if(colorEl) cfg.color = colorEl.value;
    if(widthEl) cfg.width = Math.max(1, parseInt(widthEl.value)||cfg.width);
    if(visEl) cfg.visible = visEl.checked;
    applyIndicatorData();
    renderLegend();
    closeSettings();
}

function resetIndicatorDefaults(id){
    indicatorSettings[id] = JSON.parse(JSON.stringify(DEFAULTS[id]));
    applyIndicatorData();
    renderLegend();
    closeSettings();
}

function closeSettings(){
    const overlay = document.getElementById('tv-settings-overlay');
    if(overlay) overlay.remove();
}
</script>
"""

INIT_INSERT = "\nseriesRefs.ema10 = ema10Series;\nseriesRefs.ema20 = ema20Series;\nseriesRefs.sma50 = sma50Series;\nseriesRefs.atr = atrSeries;\nbuildLegend();\n"

OLD_SETDATA = re.compile(
    r"candleSeries\.setData\(candles\);\s*"
    r"ema10Series\.setData\(calcEMA\(candles,10\)\);\s*"
    r"ema20Series\.setData\(calcEMA\(candles,20\)\);\s*"
    r"sma50Series\.setData\(calcSMA\(candles,50\)\);\s*"
    r"atrSeries\.setData\(calcATR\(candles,14\)\);"
)
NEW_SETDATA = "candleSeries.setData(candles);\nlastLoadedCandles = candles;\napplyIndicatorData();"

ATR_SCALE = re.compile(r"chart\.priceScale\('atr'\)\.applyOptions\(.*?\}\);")

for fname in FILES:
    try:
        with open(fname, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print("[SKIP] " + fname + " not found")
        continue

    shutil.copy(fname, fname + ".bak." + TS)

    if CSS_MARKER in content:
        print("[SKIP] " + fname + " already patched")
        continue

    if "</style>" in content:
        content = content.replace("</style>", CSS_BLOCK + "\n</style>", 1)
    else:
        print("[WARN] " + fname + ": </style> not found")

    m2 = ATR_SCALE.search(content)
    if m2:
        pos = m2.end()
        content = content[:pos] + INIT_INSERT + content[pos:]
    else:
        print("[WARN] " + fname + ": ATR priceScale line not found, seriesRefs hookup skipped")

    if OLD_SETDATA.search(content):
        content = OLD_SETDATA.sub(NEW_SETDATA, content)
    else:
        print("[WARN] " + fname + ": setData block pattern not found, skipped")

    m3 = re.search(r"(async\s+function\s+loadChart|function\s+loadChart)", content)
    if m3:
        idx = m3.start()
        content = content[:idx] + JS_BLOCK + "\n" + content[idx:]
    else:
        print("[WARN] " + fname + ": loadChart function not found, JS not inserted")

    with open(fname, "w", encoding="utf-8") as f:
        f.write(content)

    print("[DONE] " + fname + " patched. Backup: " + fname + ".bak." + TS)

print("\nRestore agar issue ho: cp <file>.bak." + TS + " <file>")
