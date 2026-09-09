const fs = require('fs');
const file = 'ici-server.js';
let content = fs.readFileSync(file, 'utf8');
let log = [];

const endpointsCode = `    if (req.method === 'POST' && safePath === '/api/chat-msg/send') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
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
                await ref.set({ text, from: 'dashboard', timestamp });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, telegramSent: tgOk, id: ref.key, timestamp }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }
    if (req.method === 'GET' && safePath === '/api/chat-msg/list') {
        admin.database().ref('chatMessages').limitToLast(100).once('value').then(snap => {
            const val = snap.val() || {};
            const list = Object.keys(val).map(k => Object.assign({ id: k }, val[k])).sort((a,b) => a.timestamp - b.timestamp);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(list));
        }).catch(err => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });
        return;
    }
`;

const endpointAnchor = `    const relativePath = safePath === '/' ? 'index.html' : safePath.replace(/^\\/+/, '');`;
const idx = content.indexOf(endpointAnchor);
if (idx === -1) {
    log.push('WARNING: endpoint anchor not found');
} else {
    content = content.slice(0, idx) + endpointsCode + content.slice(idx);
    log.push('chat endpoints inserted OK');
}

const pollerCode = `
// ── Telegram Chat Poller ──
let tgPollOffset = 0;
async function loadTgOffset() {
    try {
        const snap = await admin.database().ref('chatMeta/lastUpdateId').once('value');
        const val = snap.val();
        if (val) tgPollOffset = val;
    } catch (e) { console.error('TG offset load error:', e.message); }
}
async function pollTelegram() {
    const token = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;
    if (!token || !chatId) return;
    try {
        const url = \`https://api.telegram.org/bot\${token}/getUpdates?offset=\${tgPollOffset + 1}&timeout=0\`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.ok) return;
        for (const update of data.result) {
            tgPollOffset = update.update_id;
            const msg = update.message;
            if (!msg) continue;
            if (String(msg.chat.id) !== String(chatId)) continue;
            if (!msg.text) continue;
            await admin.database().ref('chatMessages').push({
                text: msg.text,
                from: 'telegram',
                timestamp: (msg.date || Math.floor(Date.now()/1000)) * 1000
            });
        }
        if (data.result.length) {
            await admin.database().ref('chatMeta/lastUpdateId').set(tgPollOffset);
        }
    } catch (e) {
        console.error('TG poll error:', e.message);
    }
}
loadTgOffset().then(() => { setInterval(pollTelegram, 3000); });
`;

const pollerAnchor = `scannerModule = require('./core/scanner');`;
const idx2 = content.indexOf(pollerAnchor);
if (idx2 === -1) {
    log.push('WARNING: poller anchor not found');
} else {
    content = content.slice(0, idx2) + pollerCode + '\n' + content.slice(idx2);
    log.push('telegram poller inserted OK');
}

fs.writeFileSync(file, content, 'utf8');
log.forEach(l => console.log(l));
