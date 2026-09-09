const fs = require('fs');
const file = 'ici-server.js';
let content = fs.readFileSync(file, 'utf8');
let log = [];

// 1. Replace whole poller function to also handle photo/voice/audio
const pollerStart = `async function pollTelegram() {`;
const pollerEnd = `loadTgOffset().then(() => { setInterval(pollTelegram, 3000); });`;

const newPoller = `async function downloadTelegramFile(token, fileId, destPath) {
    const fileInfoRes = await fetch(\`https://api.telegram.org/bot\${token}/getFile?file_id=\${fileId}\`);
    const fileInfo = await fileInfoRes.json();
    if (!fileInfo.ok) throw new Error('getFile failed');
    const fileRes = await fetch(\`https://api.telegram.org/file/bot\${token}/\${fileInfo.result.file_path}\`);
    const buffer = Buffer.from(await fileRes.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
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
        const mediaDir = path.join(__dirname, 'chat_media');
        if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
        for (const update of data.result) {
            tgPollOffset = update.update_id;
            const msg = update.message;
            if (!msg) continue;
            if (String(msg.chat.id) !== String(chatId)) continue;
            var senderName = 'Telegram';
            if (msg.from) {
                senderName = msg.from.first_name || msg.from.username || 'Telegram';
                if (msg.from.last_name) senderName += ' ' + msg.from.last_name;
            }
            const baseMsg = {
                from: 'telegram',
                senderName: senderName,
                senderId: msg.from ? msg.from.id : null,
                timestamp: (msg.date || Math.floor(Date.now()/1000)) * 1000
            };
            if (msg.text) {
                await admin.database().ref('chatMessages').push(Object.assign({}, baseMsg, { type: 'text', text: msg.text }));
            } else if (msg.photo && msg.photo.length) {
                try {
                    const largest = msg.photo[msg.photo.length - 1];
                    const filename = 'img_' + Date.now() + '_' + largest.file_id.slice(-8) + '.jpg';
                    await downloadTelegramFile(token, largest.file_id, path.join(mediaDir, filename));
                    await admin.database().ref('chatMessages').push(Object.assign({}, baseMsg, { type: 'image', mediaUrl: '/api/chat-msg/media/' + filename, text: msg.caption || '' }));
                } catch (e) { console.error('photo download error:', e.message); }
            } else if (msg.voice) {
                try {
                    const filename = 'voice_' + Date.now() + '_' + msg.voice.file_id.slice(-8) + '.oga';
                    await downloadTelegramFile(token, msg.voice.file_id, path.join(mediaDir, filename));
                    await admin.database().ref('chatMessages').push(Object.assign({}, baseMsg, { type: 'voice', mediaUrl: '/api/chat-msg/media/' + filename }));
                } catch (e) { console.error('voice download error:', e.message); }
            } else if (msg.audio) {
                try {
                    const filename = 'audio_' + Date.now() + '_' + msg.audio.file_id.slice(-8) + '.mp3';
                    await downloadTelegramFile(token, msg.audio.file_id, path.join(mediaDir, filename));
                    await admin.database().ref('chatMessages').push(Object.assign({}, baseMsg, { type: 'voice', mediaUrl: '/api/chat-msg/media/' + filename }));
                } catch (e) { console.error('audio download error:', e.message); }
            }
        }
        if (data.result.length) {
            await admin.database().ref('chatMeta/lastUpdateId').set(tgPollOffset);
        }
    } catch (e) {
        console.error('TG poll error:', e.message);
    }
}
loadTgOffset().then(() => { setInterval(pollTelegram, 3000); });`;

const startIdx = content.indexOf(pollerStart);
if (startIdx === -1) {
    log.push('WARNING: poller start anchor not found');
} else {
    const endIdx = content.indexOf(pollerEnd, startIdx);
    if (endIdx === -1) {
        log.push('WARNING: poller end anchor not found');
    } else {
        content = content.slice(0, startIdx) + newPoller + content.slice(endIdx + pollerEnd.length);
        log.push('poller updated with photo/voice support OK');
    }
}

// 2. Insert new routes (media serve, send-image, send-voice) before the existing text-send route
const routeAnchor = `    if (req.method === 'POST' && safePath === '/api/chat-msg/send') {`;

const newRoutes = `    if (req.method === 'GET' && safePath.startsWith('/api/chat-msg/media/')) {
        const filename = safePath.split('/').pop().replace(/[^a-zA-Z0-9_.-]/g, '');
        const filePath = path.join(__dirname, 'chat_media', filename);
        if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
        const ext = path.extname(filePath).toLowerCase();
        const types = { '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.oga':'audio/ogg', '.ogg':'audio/ogg', '.mp3':'audio/mpeg', '.webm':'audio/webm' };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=86400' });
        fs.createReadStream(filePath).pipe(res);
        return;
    }
    if (req.method === 'POST' && safePath === '/api/chat-msg/send-image') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { imageBase64, mimeType } = JSON.parse(body);
                if (!imageBase64) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'imageBase64 required'})); return; }
                const mediaDir = path.join(__dirname, 'chat_media');
                if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
                const ext = (mimeType && mimeType.includes('png')) ? '.png' : '.jpg';
                const filename = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + ext;
                const buffer = Buffer.from(imageBase64, 'base64');
                fs.writeFileSync(path.join(mediaDir, filename), buffer);
                const token = process.env.BOT_TOKEN;
                const chatId = process.env.CHAT_ID;
                let tgOk = false;
                if (token && chatId) {
                    try {
                        const form = new FormData();
                        form.append('chat_id', chatId);
                        form.append('photo', new Blob([buffer], { type: mimeType || 'image/jpeg' }), filename);
                        const tgRes = await fetch(\`https://api.telegram.org/bot\${token}/sendPhoto\`, { method: 'POST', body: form });
                        const tgData = await tgRes.json();
                        tgOk = !!tgData.ok;
                    } catch (e) { console.error('send-image telegram error:', e.message); }
                }
                const ref = admin.database().ref('chatMessages').push();
                const timestamp = Date.now();
                await ref.set({ type: 'image', mediaUrl: '/api/chat-msg/media/' + filename, from: 'dashboard', timestamp });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, telegramSent: tgOk }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }
    if (req.method === 'POST' && safePath === '/api/chat-msg/send-voice') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const { audioBase64, mimeType } = JSON.parse(body);
                if (!audioBase64) { res.writeHead(400, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'audioBase64 required'})); return; }
                const mediaDir = path.join(__dirname, 'chat_media');
                if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);
                const filename = 'voice_' + Date.now() + '_' + Math.random().toString(36).slice(2,8) + '.webm';
                const buffer = Buffer.from(audioBase64, 'base64');
                fs.writeFileSync(path.join(mediaDir, filename), buffer);
                const token = process.env.BOT_TOKEN;
                const chatId = process.env.CHAT_ID;
                let tgOk = false;
                if (token && chatId) {
                    try {
                        const form = new FormData();
                        form.append('chat_id', chatId);
                        form.append('audio', new Blob([buffer], { type: mimeType || 'audio/webm' }), filename);
                        form.append('title', 'Voice message');
                        const tgRes = await fetch(\`https://api.telegram.org/bot\${token}/sendAudio\`, { method: 'POST', body: form });
                        const tgData = await tgRes.json();
                        tgOk = !!tgData.ok;
                    } catch (e) { console.error('send-voice telegram error:', e.message); }
                }
                const ref = admin.database().ref('chatMessages').push();
                const timestamp = Date.now();
                await ref.set({ type: 'voice', mediaUrl: '/api/chat-msg/media/' + filename, from: 'dashboard', timestamp });
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, telegramSent: tgOk }));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }
`;

const routeIdx = content.indexOf(routeAnchor);
if (routeIdx === -1) {
    log.push('WARNING: route anchor not found');
} else {
    content = content.slice(0, routeIdx) + newRoutes + content.slice(routeIdx);
    log.push('new media routes inserted OK');
}

fs.writeFileSync(file, content, 'utf8');
log.forEach(l => console.log(l));
