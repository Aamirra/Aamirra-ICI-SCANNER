const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldRender = `var senderName = m.from === 'dashboard' ? 'You' : 'Telegram';`;
const newRender = `var senderName = m.from === 'dashboard' ? 'You' : (m.senderName || 'Telegram');`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(oldRender)) {
    content = content.split(oldRender).join(newRender);
    fs.writeFileSync(file, content, 'utf8');
    console.log(file + ': OK');
  } else {
    console.log(file + ': WARNING pattern not found');
  }
});
