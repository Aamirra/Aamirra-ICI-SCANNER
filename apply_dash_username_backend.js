const fs = require('fs');
const file = 'ici-server.js';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `            try {
                const { text } = JSON.parse(body);
                if (!text) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'text required'})); return; }
                const token = process.env.BOT_TOKEN;
                const chatId = process.env.CHAT_ID;
                let tgOk = false;
                if (token && chatId) {
                    try {
                        const tgRes = await fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, text })
                        });
                        const tgData = await tgRes.json();
                        tgOk = !!tgData.ok;
                    } catch (e) { console.error('chat send_telegram error:', e.message); }
                }
                const ref = admin.database().ref('chatMessages').push();
                const timestamp = Date.now();
                await ref.set({ text, from: 'dashboard', timestamp });`;

const newCode = `            try {
                const { text, senderName } = JSON.parse(body);
                if (!text) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'text required'})); return; }
                const token = process.env.BOT_TOKEN;
                const chatId = process.env.CHAT_ID;
                let tgOk = false;
                if (token && chatId) {
                    try {
                        const tgText = senderName ? (senderName + ': ' + text) : text;
                        const tgRes = await fetch(\`https://api.telegram.org/bot\${token}/sendMessage\`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ chat_id: chatId, text: tgText })
                        });
                        const tgData = await tgRes.json();
                        tgOk = !!tgData.ok;
                    } catch (e) { console.error('chat send_telegram error:', e.message); }
                }
                const ref = admin.database().ref('chatMessages').push();
                const timestamp = Date.now();
                await ref.set({ text, from: 'dashboard', senderName: senderName || 'You', timestamp });`;

if (content.includes(oldCode)) {
    content = content.split(oldCode).join(newCode);
    fs.writeFileSync(file, content, 'utf8');
    console.log('OK: senderName support added to send endpoint');
} else {
    console.log('WARNING: pattern not found');
}
