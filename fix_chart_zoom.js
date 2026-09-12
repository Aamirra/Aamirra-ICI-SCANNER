const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/index.html';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_zoomfix', content);

const old1 = `            await window.ICIIndicator.render({
                chart, series, container, candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(symbol, tfKey)
            });
            chart.timeScale().fitContent();`;
const new1 = `            await window.ICIIndicator.render({
                chart, series, container, candles: data.candles, interval,
                fetchHTF: (tfKey) => fetchHTFCandles(symbol, tfKey)
            });
            const totalBars = data.candles.length;
            const VISIBLE_BARS = 150;
            if (totalBars > VISIBLE_BARS) {
                chart.timeScale().setVisibleLogicalRange({ from: totalBars - VISIBLE_BARS, to: totalBars + 2 });
            } else {
                chart.timeScale().fitContent();
            }`;
const ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

fs.writeFileSync(path, content);
console.log('Patch applied:', ok1);
