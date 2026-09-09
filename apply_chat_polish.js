const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

// 1. Header: change text + add clear button
const oldHeader = `    <div class="chat-header"><i class="fas fa-paper-plane" style="margin-right:6px;color:var(--acc);"></i>Telegram Chat</div>`;
const newHeader = `    <div class="chat-header" style="display:flex;align-items:center;justify-content:space-between;">
        <span><i class="fas fa-comments" style="margin-right:6px;color:var(--acc);"></i>Trade Talk</span>
        <i class="fas fa-trash-alt" style="cursor:pointer;color:var(--muted);font-size:12px;" onclick="clearChat()" title="Clear chat"></i>
    </div>`;

// 2. Send button icon
const oldSendBtn = `<button class="chat-send-btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>`;
const newSendBtn = `<button class="chat-send-btn" onclick="sendChatMessage()"><i class="fas fa-arrow-up"></i></button>`;

// 3. CSS: round send button + resize overflow fix
const oldCSS = `        .chat-send-btn { padding:8px 12px; border-radius:8px; background:var(--acc); color:#fff; border:none; cursor:pointer; font-size:13px; }`;
const newCSS = `        .chat-send-btn { width:34px; height:34px; flex-shrink:0; border-radius:50%; background:var(--acc); color:#fff; border:none; cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center; padding:0; }
        .chat-panel { min-width:0; box-sizing:border-box; }
        .chat-messages { min-width:0; overflow-x:hidden; box-sizing:border-box; }
        .chat-msg-row { box-sizing:border-box; min-width:0; }
        .chat-msg { min-width:0; box-sizing:border-box; overflow-wrap:break-word; word-break:break-word; }
        .chat-input-row { flex-wrap:nowrap; box-sizing:border-box; min-width:0; }
        .chat-input { min-width:0; flex:1 1 auto; box-sizing:border-box; }
        .chat-media-btn { flex-shrink:0; }`;

// 4. JS: clearChat function
const jsAnchor = `    window.toggleChatPanel = function() {`;
const newJsAnchor = `    window.clearChat = function() {
        if (!confirm('Clear all chat messages? This cannot be undone.')) return;
        fetch('/api/chat-msg/clear', { method: 'POST' }).then(function(r){ return r.json(); }).then(function(){
            renderedIds = {};
            var wrap = document.getElementById('chatMessages');
            if (wrap) wrap.innerHTML = '';
        }).catch(function(e){ console.error('clear chat error', e); });
    };
    window.toggleChatPanel = function() {`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldHeader)) { content = content.split(oldHeader).join(newHeader); log.push('header updated OK'); }
  else log.push('WARNING: header anchor not found');

  if (content.includes(oldSendBtn)) { content = content.split(oldSendBtn).join(newSendBtn); log.push('send button icon updated OK'); }
  else log.push('WARNING: send button anchor not found');

  if (content.includes(oldCSS)) { content = content.split(oldCSS).join(newCSS); log.push('CSS updated OK'); }
  else log.push('WARNING: CSS anchor not found');

  if (content.includes(jsAnchor)) { content = content.split(jsAnchor).join(newJsAnchor); log.push('clearChat JS added OK'); }
  else log.push('WARNING: JS anchor not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
