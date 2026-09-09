const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const cssAnchor = `body.desktop-mode.dash-hidden .dash-toggle-btn { left:0; border-radius:0 8px 8px 0; }`;
const newCSS = `body.desktop-mode.dash-hidden .dash-toggle-btn { left:0; border-radius:0 8px 8px 0; }
        .chat-panel { width:300px; flex:0 0 300px; height:100vh; background:var(--surface); border-left:1px solid var(--border); display:flex; flex-direction:column; }
        body.chat-hidden .chat-panel { display:none; }
        .chat-header { padding:10px 12px; border-bottom:1px solid var(--border); font-weight:700; font-size:13px; color:var(--txt); }
        .chat-messages { flex:1; overflow-y:auto; padding:10px; display:flex; flex-direction:column; gap:8px; scrollbar-width:none; -ms-overflow-style:none; }
        .chat-messages::-webkit-scrollbar { display:none; width:0; height:0; }
        .chat-msg { max-width:85%; padding:8px 10px; border-radius:10px; font-size:12px; line-height:1.4; word-wrap:break-word; position:relative; }
        .chat-msg.from-dashboard { align-self:flex-end; background:var(--acc); color:#fff; border-bottom-right-radius:2px; }
        .chat-msg.from-telegram { align-self:flex-start; background:var(--pill-bg); color:var(--txt); border-bottom-left-radius:2px; }
        .chat-msg-time { font-size:9px; opacity:0.65; margin-top:3px; display:block; }
        .chat-input-row { display:flex; gap:6px; padding:8px; border-top:1px solid var(--border); }
        .chat-input { flex:1; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:var(--pill-bg); color:var(--txt); font-size:12px; outline:none; }
        .chat-send-btn { padding:8px 12px; border-radius:8px; background:var(--acc); color:#fff; border:none; cursor:pointer; font-size:13px; }
        .chat-toggle-btn { display:none; }
        body.desktop-mode .chat-toggle-btn { display:flex; position:fixed; top:50%; right:300px; transform:translateY(-50%); z-index:1001; width:20px; height:50px; border-radius:8px 0 0 8px; background:var(--surface); border:1px solid var(--border); border-right:none; color:var(--txt); align-items:center; justify-content:center; cursor:pointer; font-size:12px; box-shadow:-2px 0 6px rgba(0,0,0,0.1); }
        body.desktop-mode.chat-hidden .chat-toggle-btn { right:0; border-radius:8px 0 0 8px; }`;

const htmlAnchor = `<div class="modal" id="targetModal" onclick="this.classList.remove('open')">`;
const newHTML = `<button class="chat-toggle-btn" id="chatToggleBtn" onclick="toggleChatPanel()"><i class="fas fa-chevron-right"></i></button>
<div class="chat-panel" id="chatPanel">
    <div class="chat-header"><i class="fas fa-paper-plane" style="margin-right:6px;color:var(--acc);"></i>Telegram Chat</div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-row">
        <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
        <button class="chat-send-btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
    </div>
</div>
<div class="modal" id="targetModal" onclick="this.classList.remove('open')">`;

const newJS = `<script>
(function(){
    var CHAT_LIST_URL = '/api/chat-msg/list';
    var CHAT_SEND_URL = '/api/chat-msg/send';
    var renderedIds = {};
    function fmtTime(ts) {
        var d = new Date(ts);
        return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    }
    function escapeHtml(t) {
        return (t || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
    function renderMessages(list) {
        var wrap = document.getElementById('chatMessages');
        if (!wrap) return;
        var newIds = {};
        list.forEach(function(m){ newIds[m.id] = true; });
        var sameCount = Object.keys(newIds).length === Object.keys(renderedIds).length;
        var allMatch = sameCount && Object.keys(newIds).every(function(id){ return renderedIds[id]; });
        if (allMatch) return;
        renderedIds = newIds;
        var html = '';
        list.forEach(function(m) {
            var cls = m.from === 'dashboard' ? 'from-dashboard' : 'from-telegram';
            html += '<div class="chat-msg ' + cls + '">' + escapeHtml(m.text) + '<span class="chat-msg-time">' + fmtTime(m.timestamp) + '</span></div>';
        });
        wrap.innerHTML = html;
        wrap.scrollTop = wrap.scrollHeight;
    }
    function fetchMessages() {
        fetch(CHAT_LIST_URL).then(function(r){ return r.json(); }).then(renderMessages).catch(function(e){ console.error('chat fetch error', e); });
    }
    window.sendChatMessage = function() {
        var input = document.getElementById('chatInput');
        if (!input) return;
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        input.disabled = true;
        fetch(CHAT_SEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        }).then(function(r){ return r.json(); }).then(function(){
            input.disabled = false;
            input.focus();
            fetchMessages();
        }).catch(function(e){
            console.error('chat send error', e);
            input.disabled = false;
        });
    };
    window.toggleChatPanel = function() {
        document.body.classList.toggle('chat-hidden');
        var icon = document.querySelector('#chatToggleBtn i');
        if (icon) icon.className = document.body.classList.contains('chat-hidden') ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
    };
    function initChat() {
        var input = document.getElementById('chatInput');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
            });
        }
        fetchMessages();
        setInterval(fetchMessages, 3000);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initChat);
    else initChat();
})();
<\/script>
`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(cssAnchor)) { content = content.split(cssAnchor).join(newCSS); log.push('CSS added OK'); }
  else log.push('WARNING: CSS anchor not found');

  if (content.includes(htmlAnchor)) { content = content.split(htmlAnchor).join(newHTML); log.push('HTML panel added OK'); }
  else log.push('WARNING: HTML anchor (targetModal) not found');

  const bodyCloseIdx = content.lastIndexOf('</body>');
  if (bodyCloseIdx === -1) {
    log.push('WARNING: </body> not found - JS NOT inserted');
  } else {
    content = content.slice(0, bodyCloseIdx) + newJS + content.slice(bodyCloseIdx);
    log.push('JS inserted OK');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
