const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldBlock = `    <div style="display:flex;align-items:center;padding:10px;background:var(--surface);border-bottom:1px solid var(--border);">
        <button onclick="movePair(-1)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--txt)"><i class="fas fa-chevron-left"></i></button>
        <span id="chartPairName" style="flex:1;text-align:center;font-weight:700;font-size:16px;color:var(--txt)"></span>
        <button onclick="movePair(1)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--txt)"><i class="fas fa-chevron-right"></i></button>
        <button onclick="openAlertDialog(document.getElementById('chartPairName').textContent)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--gold);cursor:pointer;" title="Set Alert"><i class="fas fa-bell"></i></button>
        <button id="chartCloseBtn" onclick="closeChart()" style="background:none;border:none;font-size:20px;padding:8px;color:var(--red)"><i class="fas fa-times"></i></button>
    </div>
    <div class="tf-preset-selector" style="padding:6px 8px 0;display:flex;justify-content:center;gap:6px;">
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

const newBlock = `    <div style="display:flex;align-items:center;padding:8px 10px;background:var(--surface);border-bottom:1px solid var(--border);gap:6px;flex-wrap:wrap;">
        <button onclick="movePair(-1)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--txt)"><i class="fas fa-chevron-left"></i></button>
        <div class="chart-interval-selector" style="display:flex;gap:6px;align-items:center;">
            <button class="chart-interval-btn active" id="chartIntBtn1" data-interval="60" onclick="changeChartInterval('60', this)">1H</button>
            <button class="chart-interval-btn" id="chartIntBtn2" data-interval="240" onclick="changeChartInterval('240', this)">4H</button>
            <button class="chart-interval-btn" id="chartIntBtn3" data-interval="D" onclick="changeChartInterval('D', this)">1D</button>
            <button class="chart-interval-btn" id="chartIntBtn4" data-interval="W" onclick="changeChartInterval('W', this)">1W</button>
            <span id="countdownDisplay" class="countdown-display"></span>
        </div>
        <span id="chartPairName" style="flex:1;text-align:center;font-weight:700;font-size:16px;color:var(--txt)"></span>
        <div class="tf-preset-selector" style="display:flex;gap:6px;">
            <button class="tf-preset-btn active" id="tfPresetH" onclick="setTFPreset('H')">H</button>
            <button class="tf-preset-btn" id="tfPresetM" onclick="setTFPreset('M')">M</button>
            <button class="tf-preset-btn" id="tfPresetL" onclick="setTFPreset('L')">L</button>
        </div>
        <button onclick="movePair(1)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--txt)"><i class="fas fa-chevron-right"></i></button>
        <button onclick="openAlertDialog(document.getElementById('chartPairName').textContent)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--gold);cursor:pointer;" title="Set Alert"><i class="fas fa-bell"></i></button>
        <button id="chartCloseBtn" onclick="closeChart()" style="background:none;border:none;font-size:20px;padding:8px;color:var(--red)"><i class="fas fa-times"></i></button>
    </div>`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(oldBlock)) {
    content = content.split(oldBlock).join(newBlock);
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': header block updated OK');
  } else {
    console.log('WARNING: pattern not found in ' + file + ' - no change made');
  }
});
