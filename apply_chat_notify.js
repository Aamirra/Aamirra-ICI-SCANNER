// apply_chat_notify.js
// Trade Talk: (1) panel default closed on load, (2) unread badge + browser notification on new message
const fs = require('fs');

const FILES = ['index.html', 'stocks.html', 'crypto.html'];

const REPLACEMENTS = [
  {
    label: 'toggleChatPanel - clear badge on open',
    old: `    window.toggleChatPanel = function() {
        document.body.classList.toggle('chat-hidden');
        var icon = document.querySelector('#chatToggleBtn i');
        if (icon) icon.className = document.body.classList.contains('chat-hidden') ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
    };`,
    new: `    window.toggleChatPanel = function() {
        document.body.classList.toggle('chat-hidden');
        var icon = document.querySelector('#chatToggleBtn i');
        if (icon) icon.className = document.body.classList.contains('chat-hidden') ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
        if (!document.body.classList.contains('chat-hidden') && typeof clearChatBadge === 'function') {
            clearChatBadge();
        }
    };`
  },
  {
    label: 'renderMessages - detect fresh messages',
    old: `        if (allMatch) return;
        renderedIds = newIds;`,
    new: `        if (allMatch) return;
        var freshMsgs = list.filter(function(m){ return !renderedIds[m.id]; });
        renderedIds = newIds;`
  },
  {
    label: 'renderMessages - trigger badge + notification, add helper functions',
    old: `        wrap.innerHTML = html;
        wrap.scrollTop = wrap.scrollHeight;
    }
    function fetchMessages() {`,
    new: `        wrap.innerHTML = html;
        wrap.scrollTop = wrap.scrollHeight;
        if (freshMsgs.length && document.body.classList.contains('chat-hidden')) {
            var myName = localStorage.getItem(DASH_NAME_KEY);
            var incoming = freshMsgs.filter(function(m){ return !(m.from === 'dashboard' && m.senderName === myName); });
            if (incoming.length) {
                showChatBadge(incoming.length);
                showChatNotification(incoming[incoming.length - 1]);
            }
        }
    }
    var chatUnreadCount = 0;
    function showChatBadge(count) {
        chatUnreadCount += count;
        var btn = document.getElementById('chatToggleBtn');
        if (!btn) return;
        var badge = btn.querySelector('.chat-unread-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'chat-unread-badge';
            btn.appendChild(badge);
        }
        badge.textContent = chatUnreadCount > 9 ? '9+' : String(chatUnreadCount);
        badge.style.display = 'flex';
    }
    function clearChatBadge() {
        chatUnreadCount = 0;
        var btn = document.getElementById('chatToggleBtn');
        if (!btn) return;
        var badge = btn.querySelector('.chat-unread-badge');
        if (badge) badge.style.display = 'none';
    }
    function showChatNotification(m) {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        var body = m.type === 'image' ? '📷 Photo' : (m.type === 'voice' ? '🎤 Voice message' : (m.text || 'New message'));
        try { new Notification((m.senderName || 'Trade Talk') + ' — Trade Talk', { body: body }); } catch (e) {}
    }
    function fetchMessages() {`
  },
  {
    label: 'initChat - request notification permission',
    old: `    function initChat() {
        var input = document.getElementById('chatInput');`,
    new: `    function initChat() {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
        var input = document.getElementById('chatInput');`
  },
  {
    label: 'CSS - unread badge style',
    old: `        .chat-panel { width:300px; flex:0 0 300px; height:100vh; background:var(--surface); border-left:1px solid var(--border); display:flex; flex-direction:column; }`,
    new: `        .chat-unread-badge { position:absolute; top:-4px; right:-4px; background:#ef4444; color:#fff; font-size:10px; font-weight:700; min-width:16px; height:16px; border-radius:8px; display:none; align-items:center; justify-content:center; padding:0 3px; line-height:1; z-index:5; }
        .chat-panel { width:300px; flex:0 0 300px; height:100vh; background:var(--surface); border-left:1px solid var(--border); display:flex; flex-direction:column; }`
  }
];

FILES.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`⚠️  ${file} not found, skipping.`);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const bodyRegex = /<body class="([^"]*)">/;
  if (bodyRegex.test(content)) {
    content = content.replace(bodyRegex, (match, cls) => {
      if (cls.split(' ').includes('chat-hidden')) return match;
      changed = true;
      return `<body class="${cls} chat-hidden">`;
    });
  } else {
    console.log(`⚠️  ${file}: <body class="..."> pattern not found — check manually.`);
  }

  REPLACEMENTS.forEach(r => {
    if (content.includes(r.old)) {
      content = content.replace(r.old, r.new);
      changed = true;
    } else {
      console.log(`⚠️  ${file}: pattern not found -> "${r.label}" (skipped)`);
    }
  });

  if (changed) {
    fs.writeFileSync(file + '.bak_notify', fs.readFileSync(file));
    fs.writeFileSync(file, content);
    console.log(`✅ ${file} updated (backup saved as ${file}.bak_notify)`);
  } else {
    console.log(`ℹ️  ${file}: no changes made.`);
  }
});
