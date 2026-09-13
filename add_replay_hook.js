const fs = require('fs');
const file = 'ici-indicator.js';
const original = fs.readFileSync(file, 'utf8');

if (original.includes('function setReplayCandles')) {
  console.log('Already patched — skipping.');
  process.exit(0);
}

fs.writeFileSync(file + '.before_replay', original);

const anchor1 = '    async function render(opts) {';
if (!original.includes(anchor1)) {
  console.error('Anchor 1 not found in ' + file + ' — aborting, no changes made.');
  process.exit(1);
}
const inject1 = `    async function setReplayCandles(containerId, slicedCandles){
        const st = chartStates[containerId];
        if (!st) return;
        st.candles = slicedCandles;
        await drawIndicatorSeries(st);
    }

`;
let src = original.replace(anchor1, inject1 + anchor1);

const anchor2 = '    return {\n        render,';
if (!src.includes(anchor2)) {
  console.error('Anchor 2 not found in ' + file + ' — aborting, no changes made.');
  process.exit(1);
}
src = src.replace(anchor2, '    return {\n        render,\n        setReplayCandles,');

fs.writeFileSync(file, src);
console.log('✅ ici-indicator.js patched. Backup: ici-indicator.js.before_replay');
