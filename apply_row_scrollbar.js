const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldPad = `        .item-main {
            display:flex;
            align-items:center;
            padding:12px 0 6px 0;
            cursor:pointer;
            -webkit-user-select:none;
            user-select:none;
            touch-action:pan-y;
            width:100%;
        }`;

const newPad = `        .item-main {
            display:flex;
            align-items:center;
            padding:8px 0 4px 0;
            cursor:pointer;
            -webkit-user-select:none;
            user-select:none;
            touch-action:pan-y;
            width:100%;
        }`;

const anchor = `        .phone-container { width:100%; max-width:450px; background:var(--surface); border-radius:24px; box-shadow:0 10px 30px rgba(0,0,0,0.05); padding:16px; border:1px solid var(--border); }`;

const newAnchor = anchor + `
        .phone-container { scrollbar-width:none; -ms-overflow-style:none; }
        .phone-container::-webkit-scrollbar { display:none; width:0; height:0; }`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldPad)) { content = content.split(oldPad).join(newPad); log.push('row height reduced OK'); }
  else log.push('WARNING: item-main pattern not found');

  if (content.includes(anchor)) { content = content.split(anchor).join(newAnchor); log.push('scrollbar hidden OK'); }
  else log.push('WARNING: phone-container anchor not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
