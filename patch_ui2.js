const fs = require('fs');

const FILES = [
  { path: '/home/ubuntu/ICI-SCANNER/crypto.html', searchPlaceholder: 'Search crypto...' },
  { path: '/home/ubuntu/ICI-SCANNER/stocks.html', searchPlaceholder: 'Search stocks...' }
];

for (const f of FILES) {
  let html = fs.readFileSync(f.path, 'utf8');
  console.log('--- ' + f.path + ' ---');

  // 1. H/M/L preset buttons + ids on the 4 existing interval buttons
  const oldIntervalBlock = `    <div class="chart-interval-selector" style="padding:8px;justify-content:center;">
        <button class="chart-interval-btn active" data-interval="60" onclick="changeChartInterval('60', this)">1H</button>
        <button class="chart-interval-btn" data-interval="240" onclick="changeChartInterval('240', this)">4H</button>
        <button class="chart-interval-btn" data-interval="D" onclick="changeChartInterval('D', this)">1D</button>
        <button class="chart-interval-btn" data-interval="W" onclick="changeChartInterval('W', this)">1W</button>
        <span id="countdownDisplay" class="countdown-display"></span>
    </div>`;

  const newIntervalBlock = `    <div class="tf-preset-selector" style="padding:6px 8px 0;display:flex;justify-content:center;gap:6px;">
        <button class="tf-preset-btn active" id="tfPresetH" onclick="setTFPreset('H')">H</button>
        <button class="tf-preset-btn" id="tfPresetM" onclick="setTFPreset('M')">M</button>
        <button class="tf-preset-btn" id="tfPresetL" onclick="setTFPreset('L')">L</button>
    </div>
    <div class="chart-interval-selector" style="padding:8px;justify-content:center;">
        <button class="chart-interval-btn active" id="chartIntBtn1" data-interval="60" onclick="changeChartInterval('60', this)">1H</button>
        <button class="chart-interval-btn" id="chartIntBtn2" data-interval="240" onclick="changeChartInterval('240', this)">4H</button>
        <button class="chart-interval-btn" id="chartIntBtn3" data-interval="D" onclick="changeChartInterval('D', this)">1D</button>
        <button class="chart-interval-btn" id="chartIntBtn4" data-interval="W" onclick="changeChartInterval('W', this)">1W</button>
        <span id="countdownDisplay" class="countdown-display"></span>
    </div>`;

  if (!html.includes(oldIntervalBlock)) { console.error('FAILED part 1: interval block not found'); }
  else { html = html.replace(oldIntervalBlock, newIntervalBlock); console.log('OK part 1'); }

  // 2. Long/Short toggle + S01-S05 row, right above the search bar
  const oldSearch = `    <div class="search-container"><input type="text" class="search-bar" placeholder="${f.searchPlaceholder}" oninput="filterPairs(this.value)"></div>`;

  const newSearch = `    <div class="dir-slevel-bar" style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">
        <span id="dirToggleBtn" class="dir-toggle-btn long" onclick="toggleDirection()">LONG</span>
        <span id="dirDot" class="dir-dot" onclick="toggleDirection()"></span>
        <button class="slevel-btn active" id="sLevelBtn1" onclick="setSLevelFilter(1)">S01</button>
        <button class="slevel-btn" id="sLevelBtn2" onclick="setSLevelFilter(2)">S02</button>
        <button class="slevel-btn" id="sLevelBtn3" onclick="setSLevelFilter(3)">S03</button>
        <button class="slevel-btn" id="sLevelBtn4" onclick="setSLevelFilter(4)">S04</button>
        <button class="slevel-btn" id="sLevelBtn5" onclick="setSLevelFilter(5)">S05</button>
    </div>
    <div class="search-container"><input type="text" class="search-bar" placeholder="${f.searchPlaceholder}" oninput="filterPairs(this.value)"></div>`;

  if (!html.includes(oldSearch)) { console.error('FAILED part 2: search bar block not found'); }
  else { html = html.replace(oldSearch, newSearch); console.log('OK part 2'); }

  // 3. CSS for the new elements
  const oldCss = `        .search-bar { width:100%; padding:10px 14px; border:1px solid var(--border); border-radius:12px; font-size:14px; outline:none; background:var(--pill-bg); color:var(--txt); }`;

  const newCss = oldCss + `
        .tf-preset-btn { padding:4px 14px; border:1px solid var(--border); border-radius:8px; font-size:12px; font-weight:700; background:var(--pill-bg); color:var(--muted); cursor:pointer; }
        .tf-preset-btn.active { background:var(--acc); color:#fff; border-color:var(--acc); }
        .dir-toggle-btn { padding:5px 12px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; color:#fff; }
        .dir-toggle-btn.long { background:var(--green); }
        .dir-toggle-btn.short { background:var(--red); }
        .dir-dot { width:16px; height:16px; border-radius:50%; background:var(--green); cursor:pointer; display:inline-block; }
        .slevel-btn { padding:4px 10px; border:1px solid var(--border); border-radius:8px; font-size:11px; font-weight:700; background:var(--pill-bg); color:var(--muted); cursor:pointer; }
        .slevel-btn.active { background:var(--gold); color:#000; border-color:var(--gold); }`;

  if (!html.includes(oldCss)) { console.error('FAILED part 3: CSS anchor not found'); }
  else { html = html.replace(oldCss, newCss); console.log('OK part 3'); }

  // 4. JS state + functions
  const oldJsAnchor = `let chartIntervals = ['60','60','60','60'];`;

  const newJs = oldJsAnchor + `
let currentTFPreset = 'H';
let currentHTF = 'W'; // 1W / 4H / 1H — feeds S01-S05 structure calc
let currentDirection = 'long';
let currentSLevel = 1;
const TF_PRESET_MAP = {
    H: { intervals: ['W','D','240','60'], labels: ['1W','1D','4H','1H'], htf: 'W' },
    M: { intervals: ['D','240','60','5'], labels: ['1D','4H','1H','M5'], htf: '240' },
    L: { intervals: ['240','60','5','1'], labels: ['4H','1H','M5','M1'], htf: '60' }
};

function setTFPreset(preset) {
    currentTFPreset = preset;
    currentHTF = TF_PRESET_MAP[preset].htf;
    document.querySelectorAll('.tf-preset-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tfPreset' + preset).classList.add('active');
    const ivals = TF_PRESET_MAP[preset].intervals;
    const labels = TF_PRESET_MAP[preset].labels;
    for (let i = 0; i < 4; i++) {
        const btn = document.getElementById('chartIntBtn' + (i + 1));
        btn.dataset.interval = ivals[i];
        btn.textContent = labels[i];
    }
    chartIntervals[activeChartSlot-1] = ivals[0];
    document.querySelectorAll('.chart-interval-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('chartIntBtn1').classList.add('active');
    localStorage.setItem('tfPreset', preset);
    if (typeof drawChart === 'function') drawChart(activeChartSlot);
    if (typeof refreshSLevels === 'function') refreshSLevels();
}

function toggleDirection() {
    currentDirection = currentDirection === 'long' ? 'short' : 'long';
    const btn = document.getElementById('dirToggleBtn');
    btn.textContent = currentDirection.toUpperCase();
    btn.classList.toggle('long', currentDirection === 'long');
    btn.classList.toggle('short', currentDirection === 'short');
    document.getElementById('dirDot').style.background = currentDirection === 'long' ? 'var(--green)' : 'var(--red)';
    if (typeof refreshSLevels === 'function') refreshSLevels();
}

function setSLevelFilter(level) {
    currentSLevel = level;
    document.querySelectorAll('.slevel-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('sLevelBtn' + level).classList.add('active');
    if (typeof refreshSLevels === 'function') refreshSLevels();
}

// Structure engine (Choch/BOS) pending fractal N — wired here once ready.
function refreshSLevels() {
    // placeholder
}`;

  if (!html.includes(oldJsAnchor)) { console.error('FAILED part 4: JS anchor not found'); }
  else { html = html.replace(oldJsAnchor, newJs); console.log('OK part 4'); }

  fs.writeFileSync(f.path, html, 'utf8');
}
console.log('Done.');
