const fs = require('fs');
const file = 'ici-server.js';
let content = fs.readFileSync(file, 'utf8');

const anchor = `    if (req.method === 'GET' && safePath === '/api/chat-msg/list') {`;

const clearRoute = `    if (req.method === 'POST' && safePath === '/api/chat-msg/clear') {
        admin.database().ref('chatMessages').remove().then(() => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
        }).catch(err => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
        });
        return;
    }
`;

if (content.includes(anchor)) {
    content = content.split(anchor).join(clearRoute + anchor);
    fs.writeFileSync(file, content, 'utf8');
    console.log('OK: clear route added');
} else {
    console.log('WARNING: anchor not found');
}
