const fs = require('fs');
let content = fs.readFileSync('stocks.html', 'utf8');
let log = [];

const fixes = [
  ['font-size:20px;padding:8px;margin-right:8px;color:var(--txt)', 'font-size:15px;padding:5px;margin-right:8px;color:var(--txt)'],
  ['font-size:20px;padding:8px;margin-left:8px;color:var(--txt)', 'font-size:15px;padding:5px;margin-left:8px;color:var(--txt)'],
];

fixes.forEach(([oldS, newS]) => {
  if (content.includes(oldS)) { content = content.split(oldS).join(newS); log.push('OK: ' + oldS.slice(0,40)); }
  else log.push('WARNING not found: ' + oldS.slice(0,40));
});

fs.writeFileSync('stocks.html', content, 'utf8');
log.forEach(l => console.log(l));
