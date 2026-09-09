const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

// 1. Add sender name CSS
const oldCSS = `        .chat-msg-time { font-size:9px; opacity:0.65; margin-top:3px; display:block; }`;
const newCSS = `        .chat-msg-time { font-size:9px; opacity:0.65; margin-top:3px; display:block; }
        .chat-msg-sender { font-size:9px; font-weight:700; opacity:0.75; margin-bottom:3px; display:block; }`;

// 2. Update render function to include sender name
const oldRender = `html += '<div class="chat-msg ' + cls + '">' + escapeHtml(m.text) + '<span class="chat-msg-time">' + fmtTime(m.timestamp) + '</span></div>';`;
const newRender = `var senderName = m.from === 'dashboard' ? 'You' : 'Telegram';
            html += '<div class="chat-msg ' + cls + '"><span class="chat-msg-sender">' + senderName + '</span>' + escapeHtml(m.text) + '<span class="chat-msg-time">' + fmtTime(m.timestamp) + '</span></div>';`;

// 3. Add resize handle JS + width persistence, and update panel width CSS to be settable
const oldChatCSS = `        .chat-panel { width:300px; flex:0 0 300px; height:100vh; background:var(--surface); border-left:1px solid var(--border); display:flex; flex-direction:column; }`;
const newChatCSS = `        .chat-panel { width:300px; flex:0 0 300px; height:100vh; background:var(--surface); border-left:1px solid var(--border); display:flex; flex-direction:column; }
        .chat-toggle-btn { cursor:ew-resize; }`;

const jsAnchor = `    function initChat() {
        var input = document.getElementById('chatInput');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
            });
        }
        fetchMessages();
        setInterval(fetchMessages, 3000);
    }`;

const newJsAnchor = `    var CHAT_WIDTH_KEY = 'ici_chat_width';
    function loadChatWidth() {
        var panel = document.getElementById('chatPanel');
        if (!panel) return;
        var saved = localStorage.getItem(CHAT_WIDTH_KEY);
        if (saved) { panel.style.width = saved + 'px'; panel.style.flexBasis = saved + 'px'; }
    }
    function saveChatWidth(px) { localStorage.setItem(CHAT_WIDTH_KEY, String(px)); }
    function updateChatHandlePosition() {
        var btn = document.getElementById('chatToggleBtn');
        var panel = document.getElementById('chatPanel');
        if (!btn || !panel) return;
        if (document.body.classList.contains('chat-hidden')) { btn.style.right = '0px'; return; }
        var r = panel.getBoundingClientRect();
        btn.style.right = (window.innerWidth - r.left) + 'px';
    }
    function initChatResize() {
        var btn = document.getElementById('chatToggleBtn');
        var panel = document.getElementById('chatPanel');
        if (!btn || !panel) return;
        loadChatWidth();
        updateChatHandlePosition();
        window.addEventListener('resize', updateChatHandlePosition);
        var dragging = false, moved = false, startX = 0, startWidth = 0;
        btn.addEventListener('pointerdown', function(e) {
            dragging = true; moved = false;
            startX = e.clientX;
            startWidth = panel.getBoundingClientRect().width;
            e.preventDefault();
        });
        document.addEventListener('pointermove', function(e) {
            if (!dragging) return;
            var dx = startX - e.clientX;
            if (Math.abs(dx) > 6) moved = true;
            if (moved) {
                var newWidth = startWidth + dx;
                var minW = 220, maxW = Math.round(window.innerWidth * 0.6);
                newWidth = Math.max(minW, Math.min(maxW, newWidth));
                panel.style.width = newWidth + 'px';
                panel.style.flexBasis = newWidth + 'px';
                updateChatHandlePosition();
            }
        });
        document.addEventListener('pointerup', function() {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                saveChatWidth(Math.round(panel.getBoundingClientRect().width));
            } else if (typeof toggleChatPanel === 'function') {
                toggleChatPanel();
                setTimeout(updateChatHandlePosition, 0);
            }
        });
    }
    function initChat() {
        var input = document.getElementById('chatInput');
        if (input) {
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); }
            });
        }
        fetchMessages();
        setInterval(fetchMessages, 3000);
        initChatResize();
    }`;

const oldToggleBtn = `<button class="chat-toggle-btn" id="chatToggleBtn" onclick="toggleChatPanel()"><i class="fas fa-chevron-right"></i></button>`;
const newToggleBtn = `<button class="chat-toggle-btn" id="chatToggleBtn"><i class="fas fa-chevron-right"></i></button>`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldCSS)) { content = content.split(oldCSS).join(newCSS); log.push('sender CSS added OK'); }
  else log.push('WARNING: sender CSS anchor not found');

  if (content.includes(oldRender)) { content = content.split(oldRender).join(newRender); log.push('sender name in render OK'); }
  else log.push('WARNING: render pattern not found');

  if (content.includes(oldChatCSS)) { content = content.split(oldChatCSS).join(newChatCSS); log.push('resize cursor CSS OK'); }
  else log.push('WARNING: chat-panel CSS anchor not found');

  if (content.includes(oldToggleBtn)) { content = content.split(oldToggleBtn).join(newToggleBtn); log.push('toggle btn onclick removed OK'); }
  else log.push('WARNING: toggle btn pattern not found');

  if (content.includes(jsAnchor)) { content = content.split(jsAnchor).join(newJsAnchor); log.push('resize JS added OK'); }
  else log.push('WARNING: JS anchor not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
