const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldCSS = `        .chat-msg.from-dashboard { align-self:flex-end; background:var(--acc); color:#fff; border-bottom-right-radius:2px; }`;
const newCSS = `        .chat-msg.from-dashboard { align-self:flex-end; background:var(--pill-bg); color:var(--txt); border-bottom-right-radius:2px; }`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(oldCSS)) {
    content = content.split(oldCSS).join(newCSS);
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': OK');
  } else {
    console.log(file + ': WARNING pattern not found');
  }
});
