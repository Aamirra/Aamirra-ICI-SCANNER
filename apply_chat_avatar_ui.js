const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

// 1. CSS for avatar
const oldCSS = `        .chat-msg-sender { font-size:9px; font-weight:700; opacity:0.75; margin-bottom:3px; display:block; }`;
const newCSS = `        .chat-msg-sender { font-size:9px; font-weight:700; opacity:0.75; margin-bottom:3px; display:block; }
        .chat-msg-row { display:flex; gap:6px; align-items:flex-end; max-width:90%; }
        .chat-msg-row.from-dashboard { align-self:flex-end; flex-direction:row-reverse; }
        .chat-msg-row.from-telegram { align-self:flex-start; }
        .chat-avatar { width:24px; height:24px; border-radius:50%; flex-shrink:0; object-fit:cover; background:var(--pill-bg); }
        .chat-avatar-fallback { width:24px; height:24px; border-radius:50%; flex-shrink:0; background:var(--acc); color:#fff; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }`;

// 2. Update render function to wrap in avatar row
const oldRender = `        list.forEach(function(m) {
            var cls = m.from === 'dashboard' ? 'from-dashboard' : 'from-telegram';
            var senderName = m.from === 'dashboard' ? 'You' : (m.senderName || 'Telegram');
            html += '<div class="chat-msg ' + cls + '"><span class="chat-msg-sender">' + senderName + '</span>' + escapeHtml(m.text) + '<span class="chat-msg-time">' + fmtTime(m.timestamp) + '</span></div>';
        });`;

const newRender = `        list.forEach(function(m) {
            var cls = m.from === 'dashboard' ? 'from-dashboard' : 'from-telegram';
            var senderName = m.from === 'dashboard' ? 'You' : (m.senderName || 'Telegram');
            var avatarHtml;
            if (m.from === 'telegram' && m.senderId) {
                avatarHtml = '<img class="chat-avatar" src="/api/chat-msg/avatar/' + m.senderId + '" onerror="this.outerHTML=\\'<div class=&quot;chat-avatar-fallback&quot;>' + escapeHtml(senderName.charAt(0).toUpperCase()) + '</div>\\'">';
            } else if (m.from === 'telegram') {
                avatarHtml = '<div class="chat-avatar-fallback">' + escapeHtml(senderName.charAt(0).toUpperCase()) + '</div>';
            } else {
                avatarHtml = '<div class="chat-avatar-fallback"><i class="fas fa-user"></i></div>';
            }
            html += '<div class="chat-msg-row ' + cls + '">' + avatarHtml + '<div class="chat-msg ' + cls + '"><span class="chat-msg-sender">' + senderName + '</span>' + escapeHtml(m.text) + '<span class="chat-msg-time">' + fmtTime(m.timestamp) + '</span></div></div>';
        });`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldCSS)) { content = content.split(oldCSS).join(newCSS); log.push('avatar CSS added OK'); }
  else log.push('WARNING: CSS anchor not found');

  if (content.includes(oldRender)) { content = content.split(oldRender).join(newRender); log.push('avatar render logic added OK'); }
  else log.push('WARNING: render pattern not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
