const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

// 1. CSS additions
const oldCSS = `        .chat-send-btn { padding:8px 12px; border-radius:8px; background:var(--acc); color:#fff; border:none; cursor:pointer; font-size:13px; }`;
const newCSS = `        .chat-send-btn { padding:8px 12px; border-radius:8px; background:var(--acc); color:#fff; border:none; cursor:pointer; font-size:13px; }
        .chat-media-btn { padding:8px 10px; border-radius:8px; background:var(--pill-bg); color:var(--txt); border:1px solid var(--border); cursor:pointer; font-size:13px; }
        .chat-media-btn.recording { background:var(--red); color:#fff; border-color:var(--red); }
        .chat-img-bubble { max-width:180px; border-radius:8px; display:block; cursor:pointer; }
        .chat-voice-bubble { display:flex; align-items:center; gap:6px; }
        .chat-voice-bubble audio { max-width:180px; height:32px; }`;

// 2. Input row: add photo + mic buttons
const oldInputRow = `    <div class="chat-input-row">
        <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
        <button class="chat-send-btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
    </div>`;
const newInputRow = `    <div class="chat-input-row">
        <input type="file" id="chatImageInput" accept="image/*" style="display:none;">
        <button class="chat-media-btn" onclick="document.getElementById('chatImageInput').click()"><i class="fas fa-image"></i></button>
        <button class="chat-media-btn" id="chatVoiceBtn"><i class="fas fa-microphone"></i></button>
        <input type="text" class="chat-input" id="chatInput" placeholder="Type a message...">
        <button class="chat-send-btn" onclick="sendChatMessage()"><i class="fas fa-paper-plane"></i></button>
    </div>`;

// 3. Update renderMessages to support image/voice types
const oldRenderBody = `            html += '<div class="chat-msg-row ' + cls + '">' + avatarHtml + '<div class="chat-msg ' + cls + '"><span class="chat-msg-sender">' + senderName + '</span>' + escapeHtml(m.text) + '<span class="chat-msg-time">' + fmtTime(m.timestamp) + '</span></div></div>';`;
const newRenderBody = `            var bodyHtml;
            if (m.type === 'image' && m.mediaUrl) {
                bodyHtml = '<img class="chat-img-bubble" src="' + m.mediaUrl + '" onclick="window.open(this.src,\\'_blank\\')">' + (m.text ? '<div style="margin-top:4px;">' + escapeHtml(m.text) + '</div>' : '');
            } else if (m.type === 'voice' && m.mediaUrl) {
                bodyHtml = '<div class="chat-voice-bubble"><audio controls src="' + m.mediaUrl + '"></audio></div>';
            } else {
                bodyHtml = escapeHtml(m.text || '');
            }
            html += '<div class="chat-msg-row ' + cls + '">' + avatarHtml + '<div class="chat-msg ' + cls + '"><span class="chat-msg-sender">' + senderName + '</span>' + bodyHtml + '<span class="chat-msg-time">' + fmtTime(m.timestamp) + '</span></div></div>';`;

// 4. Add JS for image upload + voice recording, inserted right after sendChatMessage definition
const jsAnchor = `    window.toggleChatPanel = function() {`;
const newJsAnchor = `    var chatImageInput = null;
    function initChatMedia() {
        chatImageInput = document.getElementById('chatImageInput');
        if (chatImageInput) {
            chatImageInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function() {
                    var base64 = reader.result.split(',')[1];
                    fetch('/api/chat-msg/send-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
                    }).then(function(r){ return r.json(); }).then(function(){ fetchMessages(); }).catch(function(e){ console.error('image send error', e); });
                };
                reader.readAsDataURL(file);
                chatImageInput.value = '';
            });
        }
        var voiceBtn = document.getElementById('chatVoiceBtn');
        if (!voiceBtn) return;
        var mediaRecorder = null, audioChunks = [], recording = false;
        voiceBtn.addEventListener('click', function() {
            if (!recording) {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    alert('Voice recording needs a secure (HTTPS) connection. Not available on plain HTTP.');
                    return;
                }
                navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
                    audioChunks = [];
                    mediaRecorder = new MediaRecorder(stream);
                    mediaRecorder.ondataavailable = function(e) { audioChunks.push(e.data); };
                    mediaRecorder.onstop = function() {
                        stream.getTracks().forEach(function(t){ t.stop(); });
                        var blob = new Blob(audioChunks, { type: 'audio/webm' });
                        var reader = new FileReader();
                        reader.onload = function() {
                            var base64 = reader.result.split(',')[1];
                            fetch('/api/chat-msg/send-voice', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ audioBase64: base64, mimeType: 'audio/webm' })
                            }).then(function(r){ return r.json(); }).then(function(){ fetchMessages(); }).catch(function(e){ console.error('voice send error', e); });
                        };
                        reader.readAsDataURL(blob);
                    };
                    mediaRecorder.start();
                    recording = true;
                    voiceBtn.classList.add('recording');
                }).catch(function(e) {
                    alert('Microphone access denied or unavailable: ' + e.message);
                });
            } else {
                if (mediaRecorder) mediaRecorder.stop();
                recording = false;
                voiceBtn.classList.remove('recording');
            }
        });
    }
    window.toggleChatPanel = function() {`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldCSS)) { content = content.split(oldCSS).join(newCSS); log.push('media CSS added OK'); }
  else log.push('WARNING: CSS anchor not found');

  if (content.includes(oldInputRow)) { content = content.split(oldInputRow).join(newInputRow); log.push('input row buttons added OK'); }
  else log.push('WARNING: input row anchor not found');

  if (content.includes(oldRenderBody)) { content = content.split(oldRenderBody).join(newRenderBody); log.push('render image/voice logic added OK'); }
  else log.push('WARNING: render body anchor not found');

  if (content.includes(jsAnchor)) { content = content.split(jsAnchor).join(newJsAnchor); log.push('media JS inserted OK'); }
  else log.push('WARNING: JS anchor not found');

  // hook initChatMedia into initChat
  const initChatAnchor = `        fetchMessages();
        setInterval(fetchMessages, 3000);
        initChatResize();
    }`;
  const newInitChatAnchor = `        fetchMessages();
        setInterval(fetchMessages, 3000);
        initChatResize();
        initChatMedia();
    }`;
  if (content.includes(initChatAnchor)) { content = content.split(initChatAnchor).join(newInitChatAnchor); log.push('initChatMedia hooked OK'); }
  else log.push('WARNING: initChat anchor not found - initChatMedia NOT called automatically');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
