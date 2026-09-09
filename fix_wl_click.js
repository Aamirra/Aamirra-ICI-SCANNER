const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldRow = `html += '<div class="wl-row" data-sym="' + sym + '"><span>' + sym + '</span><span>' + priceStr + '</span><span class="wl-chg ' + chgCls + '">' + chgStr + '</span></div>';`;
const newRow = `html += '<div class="wl-row" data-sym="' + sym + '" onclick="if(typeof openChartForPair===\\'function\\') openChartForPair(\\'' + sym + '\\')" style="cursor:pointer;"><span>' + sym + '</span><span>' + priceStr + '</span><span class="wl-chg ' + chgCls + '">' + chgStr + '</span></div>';`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(oldRow)) {
    content = content.split(oldRow).join(newRow);
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': OK');
  } else {
    console.log(file + ': WARNING pattern not found');
  }
});
