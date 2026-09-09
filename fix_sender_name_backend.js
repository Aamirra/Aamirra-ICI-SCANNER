const fs = require('fs');
const file = 'ici-server.js';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `            await admin.database().ref('chatMessages').push({
                text: msg.text,
                from: 'telegram',
                timestamp: (msg.date || Math.floor(Date.now()/1000)) * 1000
            });`;

const newCode = `            var senderName = 'Telegram';
            if (msg.from) {
                senderName = msg.from.first_name || msg.from.username || 'Telegram';
                if (msg.from.last_name) senderName += ' ' + msg.from.last_name;
            }
            await admin.database().ref('chatMessages').push({
                text: msg.text,
                from: 'telegram',
                senderName: senderName,
                timestamp: (msg.date || Math.floor(Date.now()/1000)) * 1000
            });`;

if (content.includes(oldCode)) {
    content = content.split(oldCode).join(newCode);
    fs.writeFileSync(file, content, 'utf8');
    console.log('OK: senderName added to poller');
} else {
    console.log('WARNING: pattern not found');
}
