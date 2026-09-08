const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldCSS = `        .layout-controls { display:flex; gap:6px; padding:6px 10px; align-items:center; justify-content:center; background:var(--surface); border-bottom:1px solid var(--border); }
        .layout-btn { padding:4px 12px; font-size:12px; font-weight:600; border:1px solid var(--border); background:var(--pill-bg); border-radius:6px; cursor:pointer; color:var(--txt); }
        .layout-btn.active { background:var(--acc); color:#fff; border-color:var(--acc); }
        .slot-selector { display:flex; gap:4px; align-items:center; margin:0 10px; }
        .slot-btn { padding:4px 8px; font-size:11px; font-weight:600; border:2px solid transparent; border-radius:4px; background:var(--pill-bg); cursor:pointer; color:var(--txt); }
        .slot-btn.active-slot { border-color:var(--green); color:var(--green); }`;

const newCSS = `        .layout-controls { display:flex; gap:6px; padding:6px 16px 6px 10px; align-items:center; justify-content:flex-end; background:var(--surface); border-bottom:1px solid var(--border); }
        .layout-select { padding:3px 8px; font-size:12px; font-weight:600; border:1px solid var(--border); background:var(--pill-bg); border-radius:6px; cursor:pointer; color:var(--txt); }
        .layout-select:focus { outline:none; border-color:var(--acc); }`;

const oldHTML = `    <div class="layout-controls">
        <span style="font-size:11px;font-weight:600;color:var(--muted);">Layout:</span>
        <button class="layout-btn active" onclick="setChartLayout(1)">1</button>
        <button class="layout-btn" onclick="setChartLayout(2)">2</button>
        <button class="layout-btn" onclick="setChartLayout(3)">3</button>
        <button class="layout-btn" onclick="setChartLayout(4)">4</button>
        <span class="slot-selector">
            <span style="font-size:11px;font-weight:600;color:var(--muted);margin-left:6px;">Slot:</span>
            <button class="slot-btn active-slot" id="slotBtn1" onclick="activateChartSlot(1)">1</button>
            <button class="slot-btn" id="slotBtn2" onclick="activateChartSlot(2)">2</button>
            <button class="slot-btn" id="slotBtn3" onclick="activateChartSlot(3)">3</button>
            <button class="slot-btn" id="slotBtn4" onclick="activateChartSlot(4)">4</button>
        </span>
    </div>`;

const newHTML = `    <div class="layout-controls">
        <span style="font-size:11px;font-weight:600;color:var(--muted);">Layout:</span>
        <select class="layout-select" id="layoutSelect" onchange="setChartLayout(this.value)">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
        </select>
        <span style="font-size:11px;font-weight:600;color:var(--muted);margin-left:10px;">Slot:</span>
        <select class="layout-select" id="slotSelect" onchange="activateChartSlot(this.value)">
            <option value="1">1</option>
        </select>
    </div>`;

const oldActivateSlot = `function activateChartSlot(s) {
    activeChartSlot = s;
    for (let i=1;i<=4;i++) document.getElementById('slotBtn'+i).classList.toggle('active-slot', i===s);
    updateChartPairName();
    highlightIntervalButton(chartIntervals[s-1]);
    startCountdownTimer();
}`;

const newActivateSlot = `function activateChartSlot(s) {
    s = parseInt(s);
    activeChartSlot = s;
    document.getElementById('slotSelect').value = s;
    updateChartPairName();
    highlightIntervalButton(chartIntervals[s-1]);
    startCountdownTimer();
}`;

const oldSetLayout = `async function setChartLayout(count) {
    currentChartLayout = count;
    document.querySelectorAll('.layout-btn').forEach((b,i) => b.classList.toggle('active', i===count-1));
    document.getElementById('chart-grid').className = 'chart-grid layout-'+count;
    for (let i=1;i<=4;i++) document.getElementById('tv_chart_'+i).classList.toggle('active', i<=count);
    for (let i=1;i<=count;i++) { drawChart(i); if (i<count) await new Promise(r=>setTimeout(r,100)); }
    for (let i=1;i<=4;i++) document.getElementById('slotBtn'+i).style.display = i<=count ? 'inline-block' : 'none';
    if (activeChartSlot > count) {
        activeChartSlot = 1;
        document.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('active-slot'));
        document.getElementById('slotBtn1').classList.add('active-slot');
        updateChartPairName();
        highlightIntervalButton(chartIntervals[0]);
    }
    startCountdownTimer();
}`;

const newSetLayout = `async function setChartLayout(count) {
    count = parseInt(count);
    currentChartLayout = count;
    document.getElementById('layoutSelect').value = count;
    document.getElementById('chart-grid').className = 'chart-grid layout-'+count;
    for (let i=1;i<=4;i++) document.getElementById('tv_chart_'+i).classList.toggle('active', i<=count);
    for (let i=1;i<=count;i++) { drawChart(i); if (i<count) await new Promise(r=>setTimeout(r,100)); }
    const slotSel = document.getElementById('slotSelect');
    slotSel.innerHTML = '';
    for (let i=1;i<=count;i++) { const o=document.createElement('option'); o.value=i; o.textContent=i; slotSel.appendChild(o); }
    if (activeChartSlot > count) {
        activeChartSlot = 1;
        slotSel.value = 1;
        updateChartPairName();
        highlightIntervalButton(chartIntervals[0]);
    } else {
        slotSel.value = activeChartSlot;
    }
    startCountdownTimer();
}`;

const replacements = [
  ['CSS', oldCSS, newCSS],
  ['HTML buttons', oldHTML, newHTML],
  ['activateChartSlot function', oldActivateSlot, newActivateSlot],
  ['setChartLayout function', oldSetLayout, newSetLayout],
];

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let changed = 0;
  replacements.forEach(([label, oldStr, newStr]) => {
    if (content.includes(oldStr)) {
      content = content.split(oldStr).join(newStr);
      changed++;
    } else {
      console.log(`WARNING in ${file}: pattern "${label}" not found - skipped for this file`);
    }
  });
  fs.writeFileSync(file, content, 'utf8');
  console.log(`${file}: ${changed}/${replacements.length} patterns applied`);
});
