const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const anchor = `        .layout-4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }`;

const newCSS = `        .layout-4 { grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; }
        .chart-grid.layout-1 #tv_chart_2:empty, .chart-grid.layout-1 #tv_chart_3:empty, .chart-grid.layout-1 #tv_chart_4:empty { display:none !important; }
        .chart-grid.layout-2 #tv_chart_3:empty, .chart-grid.layout-2 #tv_chart_4:empty { display:none !important; }
        .chart-grid.layout-3 #tv_chart_4:empty { display:none !important; }`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(anchor)) {
    content = content.split(anchor).join(newCSS);
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': OK - hide rules added');
  } else {
    console.log(file + ': WARNING anchor not found');
  }
});
