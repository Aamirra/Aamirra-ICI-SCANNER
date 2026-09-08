const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldDelay = `}, 320);`;
const newDelay = `}, 150);`;

const oldCSS = `        .wl-table-wrap { overflow-y:auto; position:relative; height:140px; }`;
const newCSS = `        .wl-table-wrap { overflow-y:auto; overflow-x:hidden; position:relative; height:140px; scrollbar-width:none; -ms-overflow-style:none; }
        .wl-table-wrap::-webkit-scrollbar { display:none; width:0; height:0; }`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  const delayCount = content.split(oldDelay).length - 1;
  if (delayCount > 0) { content = content.split(oldDelay).join(newDelay); log.push('hold delay reduced (' + delayCount + ' occurrence(s))'); }
  else log.push('WARNING: delay pattern not found');

  if (content.includes(oldCSS)) { content = content.split(oldCSS).join(newCSS); log.push('scrollbar hidden OK'); }
  else log.push('WARNING: scrollbar CSS pattern not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
