const fs = require('fs');
const file = 'index.html';
const original = fs.readFileSync(file, 'utf8');

if (original.includes('new ICIBarReplay(chart, series, container.id')) {
  console.log('Already patched — skipping.');
  process.exit(0);
}

fs.writeFileSync(file + '.before_replay', original);

const anchor = `            if (totalBars > VISIBLE_BARS) {
                chart.timeScale().setVisibleLogicalRange({ from: totalBars - VISIBLE_BARS, to: totalBars + 2 });
            } else {
                chart.timeScale().fitContent();
            }
        } else {`;

if (!original.includes(anchor)) {
  console.error('Anchor not found in ' + file + ' — aborting, no changes made.');
  process.exit(1);
}

const inject = `            if (totalBars > VISIBLE_BARS) {
                chart.timeScale().setVisibleLogicalRange({ from: totalBars - VISIBLE_BARS, to: totalBars + 2 });
            } else {
                chart.timeScale().fitContent();
            }

            if (window.iciReplay && window.iciReplay[slot]) { try { window.iciReplay[slot].destroy(); } catch(e){} }
            window.iciReplay = window.iciReplay || {};
            window.iciReplay[slot] = new ICIBarReplay(chart, series, container.id, data.candles);
        } else {`;

let src = original.replace(anchor, inject);

if (!src.includes('barReplay.js')) {
  src = src.replace('</body>', '<script src="/barReplay.js"></script>\n</body>');
}

fs.writeFileSync(file, src);
console.log('✅ index.html patched. Backup: index.html.before_replay');
