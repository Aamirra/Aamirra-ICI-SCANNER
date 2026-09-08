const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];
const oldStr = "openChartForPair\\\\('([^']+)'\\\\)";
const newStr = "openChartForPair\\('([^']+)'\\)";

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  const count = content.split(oldStr).length - 1;
  if (count > 0) {
    content = content.split(oldStr).join(newStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': fixed ' + count + ' occurrence(s)');
  } else {
    console.log(file + ': WARNING - pattern not found (already fixed or different)');
  }
});
