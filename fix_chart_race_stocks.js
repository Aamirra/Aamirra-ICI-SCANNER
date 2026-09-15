const fs = require('fs');
const path = 'stocks.html';
let html = fs.readFileSync(path, 'utf8');
let ok = true;

function safeReplace(from, to, label) {
    if (!html.includes(from)) { console.log('SKIP (not found): ' + label); ok = false; return; }
    html = html.replace(from, to);
    console.log('OK: ' + label);
}

safeReplace(
"let lwCharts = [null,null,null,null];\nlet lwSeries = [null,null,null,null];\nfunction lwIntervalMap(tvInterval) {",
"let lwCharts = [null,null,null,null];\nlet lwSeries = [null,null,null,null];\nlet chartGeneration = [0,0,0,0,0];\nfunction lwIntervalMap(tvInterval) {",
"add generation counter"
);

safeReplace(
"async function softRefreshChart(slot) {\n    if (!lwCharts[slot] || !lwSeries[slot]) { drawChart(slot); return; }\n    const idx = chartIndices[slot-1];\n    if (!chartPairs[idx]) return;\n    const sym = chartPairs[idx];",
"async function softRefreshChart(slot) {\n    if (!lwCharts[slot] || !lwSeries[slot]) { drawChart(slot); return; }\n    const genAtStart = chartGeneration[slot];\n    const idx = chartIndices[slot-1];\n    if (!chartPairs[idx]) return;\n    const sym = chartPairs[idx];",
"capture generation at softRefresh start"
);

safeReplace(
`        const res = await fetch(\`/api/stock-chart?symbol=\${encodeURIComponent(sym)}&market=\${market}&interval=\${interval}&limit=15000\`);
        const data = await res.json();
        if (data.candles && data.candles.length) {
            lwSeries[slot].setData(data.candles);
            await window.ICIIndicator.render({
                chart: lwCharts[slot], series: lwSeries[slot], container: document.getElementById('tv_chart_'+slot),
                candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(sym, tfKey)
            });
            startCandleTimer(slot, data.candles, chartIntervals[slot-1]);
        }`,
`        const res = await fetch(\`/api/stock-chart?symbol=\${encodeURIComponent(sym)}&market=\${market}&interval=\${interval}&limit=15000\`);
        const data = await res.json();
        if (chartGeneration[slot] !== genAtStart) return;
        if (data.candles && data.candles.length) {
            lwSeries[slot].setData(data.candles);
            await window.ICIIndicator.render({
                chart: lwCharts[slot], series: lwSeries[slot], container: document.getElementById('tv_chart_'+slot),
                candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(sym, tfKey)
            });
            if (chartGeneration[slot] !== genAtStart) return;
            startCandleTimer(slot, data.candles, chartIntervals[slot-1]);
        }`,
"guard softRefreshChart against stale data"
);

safeReplace(
"async function drawChart(slot) {\n    const container = document.getElementById('tv_chart_'+slot);\n    container.innerHTML = '';\n    const idx = chartIndices[slot-1];\n    if (!chartPairs[idx]) return;\n    const sym = chartPairs[idx];\n    const isPSX = currentMarket === 'psx';",
"async function drawChart(slot) {\n    const myGen = ++chartGeneration[slot];\n    const container = document.getElementById('tv_chart_'+slot);\n    container.innerHTML = '';\n    const idx = chartIndices[slot-1];\n    if (!chartPairs[idx]) return;\n    const sym = chartPairs[idx];\n    const isPSX = currentMarket === 'psx';",
"tag drawChart with generation"
);

safeReplace(
`        const res = await fetch(\`/api/stock-chart?symbol=\${encodeURIComponent(sym)}&market=\${market}&interval=\${interval}&limit=15000\`);
        const data = await res.json();
        if (data.candles && data.candles.length) {
            await window.ICIIndicator.render({
                chart, series, container, candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(sym, tfKey)
            });
            chart.timeScale().fitContent();

            if (window.iciReplay && window.iciReplay[slot]) { try { window.iciReplay[slot].destroy(); } catch(e){} }`,
`        const res = await fetch(\`/api/stock-chart?symbol=\${encodeURIComponent(sym)}&market=\${market}&interval=\${interval}&limit=15000\`);
        const data = await res.json();
        if (chartGeneration[slot] !== myGen) return;
        if (data.candles && data.candles.length) {
            await window.ICIIndicator.render({
                chart, series, container, candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(sym, tfKey)
            });
            if (chartGeneration[slot] !== myGen) return;
            chart.timeScale().fitContent();

            if (window.iciReplay && window.iciReplay[slot]) { try { window.iciReplay[slot].destroy(); } catch(e){} }`,
"guard drawChart against stale data"
);

if (ok) {
    fs.writeFileSync(path, html, 'utf8');
    console.log('\n✅ stocks.html successfully patched.');
} else {
    console.log('\n❌ Kuch patterns match nahi hue — file change NAHI ki gayi.');
}
