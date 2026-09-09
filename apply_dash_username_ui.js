const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

// 1. sendChatMessage: include senderName
const oldSend = `        fetch(CHAT_SEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        }).then(function(r){ return r.json(); }).then(function(){`;
const newSend = `        fetch(CHAT_SEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, senderName: getDashUserName() })
        }).then(function(r){ return r.json(); }).then(function(){`;

// 2. Add getDashUserName function + display-name logic, right before sendChatMessage definition
const anchor = `    window.sendChatMessage = function() {`;
const newAnchor = `    var DASH_NAME_KEY = 'ici_dash_username';
    function getDashUserName() {
        var name = localStorage.getItem(DASH_NAME_KEY);
        if (!name) {
            name = prompt('Enter your name for chat:');
            if (!name || !name.trim()) name = 'Guest';
            name = name.trim();
            localStorage.setItem(DASH_NAME_KEY, name);
        }
        return name;
    }
    window.sendChatMessage = function() {`;

// 3. render: use m.senderName for dashboard messages too, but show "You" if it's this browser's own name
const oldRenderName = `var senderName = m.from === 'dashboard' ? 'You' : (m.senderName || 'Telegram');`;
const newRenderName = `var myName = localStorage.getItem(DASH_NAME_KEY);
            var senderName = m.from === 'dashboard' ? (m.senderName && m.senderName !== myName ? m.senderName : 'You') : (m.senderName || 'Telegram');`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldSend)) { content = content.split(oldSend).join(newSend); log.push('senderName in send request OK'); }
  else log.push('WARNING: send fetch anchor not found');

  if (content.includes(anchor)) { content = content.split(anchor).join(newAnchor); log.push('getDashUserName added OK'); }
  else log.push('WARNING: sendChatMessage anchor not found');

  if (content.includes(oldRenderName)) { content = content.split(oldRenderName).join(newRenderName); log.push('render name logic updated OK'); }
  else log.push('WARNING: render name pattern not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
