const fs = require('fs');
const MARK = '/* PAIRS-SCROLL-FIX */';
const css = `<style>
${MARK}
body.desktop-mode .phone-container { display:flex; flex-direction:column; overflow:hidden; }
body.desktop-mode .phone-container > * { flex-shrink:0; }
body.desktop-mode .phone-container > #pairsContainer {
  flex:1 1 auto; min-height:0; overflow-y:auto; overflow-x:hidden;
  overscroll-behavior:contain; scrollbar-width:none; -ms-overflow-style:none;
}
body.desktop-mode .phone-container > #pairsContainer::-webkit-scrollbar { display:none; }
</style>
`;
for (const f of ['index.html', 'stocks.html', 'crypto.html']) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes(MARK)) { console.log(f, 'already patched'); continue; }
  if (!s.includes('id="pairsContainer"')) { console.log(f, 'NO pairsContainer found, skipped'); continue; }
  if (!s.includes('</head>')) { console.log(f, 'NO </head>, skipped'); continue; }
  fs.copyFileSync(f, f + '.bak-scrollfix2');
  s = s.replace('</head>', css + '</head>');
  fs.writeFileSync(f, s);
  console.log(f, 'patched');
}
