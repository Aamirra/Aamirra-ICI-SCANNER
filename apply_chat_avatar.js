const fs = require('fs');
const file = 'ici-server.js';
let content = fs.readFileSync(file, 'utf8');
let log = [];

// 1. Add senderId to the pushed message object
const oldPush = `            await admin.database().ref('chatMessages').push({
                text: msg.text,
                from: 'telegram',
                senderName: senderName,
                timestamp: (msg.date || Math.floor(Date.now()/1000)) * 1000
            });`;
const newPush = `            await admin.database().ref('chatMessages').push({
                text: msg.text,
                from: 'telegram',
                senderName: senderName,
                senderId: msg.from ? msg.from.id : null,
                timestamp: (msg.date || Math.floor(Date.now()/1000)) * 1000
            });`;

if (content.includes(oldPush)) { content = content.split(oldPush).join(newPush); log.push('senderId added to poller OK'); }
else log.push('WARNING: poller push pattern not found');

// 2. Add avatar route right after the /api/chat-msg/list block
const anchor = `    if (req.method === 'GET' && safePath === '/api/chat-msg/list') {
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

const avatarRoute = `    if (req.method === 'GET' && safePath.startsWith('/api/chat-msg/avatar/')) {
        (async () => {
            try {
                const userId = safePath.split('/').pop().replace(/[^0-9]/g, '');
                if (!userId) { res.writeHead(400); res.end(); return; }
                const avatarDir = path.join(__dirname, 'chat_avatars');
                if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir);
                const jpgPath = path.join(avatarDir, userId + '.jpg');
                const nonePath = path.join(avatarDir, userId + '.none');
                if (fs.existsSync(jpgPath)) {
                    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
                    fs.createReadStream(jpgPath).pipe(res);
                    return;
                }
                if (fs.existsSync(nonePath)) { res.writeHead(404); res.end(); return; }
                const token = process.env.BOT_TOKEN;
                const photosRes = await fetch(\`https://api.telegram.org/bot\${token}/getUserProfilePhotos?user_id=\${userId}&limit=1\`);
                const photosData = await photosRes.json();
                if (!photosData.ok || !photosData.result.photos.length) {
                    fs.writeFileSync(nonePath, '');
                    res.writeHead(404); res.end(); return;
                }
                const sizes = photosData.result.photos[0];
                const fileId = sizes[sizes.length - 1].file_id;
                const fileInfoRes = await fetch(\`https://api.telegram.org/bot\${token}/getFile?file_id=\${fileId}\`);
                const fileInfo = await fileInfoRes.json();
                if (!fileInfo.ok) { fs.writeFileSync(nonePath, ''); res.writeHead(404); res.end(); return; }
                const imgRes = await fetch(\`https://api.telegram.org/file/bot\${token}/\${fileInfo.result.file_path}\`);
                const buffer = Buffer.from(await imgRes.arrayBuffer());
                fs.writeFileSync(jpgPath, buffer);
                res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' });
                res.end(buffer);
            } catch (e) {
                console.error('avatar fetch error:', e.message);
                res.writeHead(500); res.end();
            }
        })();
        return;
    }
`;

const idx = content.indexOf(anchor);
if (idx === -1) {
    log.push('WARNING: /api/chat-msg/list anchor not found - avatar route NOT added');
} else {
    const insertPos = idx + anchor.length;
    content = content.slice(0, insertPos) + avatarRoute + content.slice(insertPos);
    log.push('avatar route added OK');
}

fs.writeFileSync(file, content, 'utf8');
log.forEach(l => console.log(l));
