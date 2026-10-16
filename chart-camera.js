/* chart-camera.js - header camera button: screenshot (save / send to chat) + copy link */
(function () {
  if (window.__camLoaded) return;
  window.__camLoaded = true;

  var menu = null, modal = null, btn = null, lastShot = null;

  var st = document.createElement('style');
  st.textContent =
    '#iciCamBtn{background:none;border:none;font-size:15px;padding:5px;margin-left:4px;color:var(--txt,#131722);cursor:pointer}' +
    '.cam-menu{position:fixed;z-index:3200;min-width:170px;background:var(--surface,#fff);color:var(--txt,#131722);border:1px solid var(--border,#d1d4dc);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3);overflow:hidden;font-size:13px;font-weight:600}' +
    '.cam-item{padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:8px}' +
    '.cam-item:hover{background:var(--pill-bg,#f0f3fa)}' +
    '.cam-modal{position:fixed;inset:0;z-index:3300;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:12px}' +
    '.cam-card{background:var(--surface,#fff);color:var(--txt,#131722);border-radius:10px;padding:12px;max-width:94vw;max-height:94vh;display:flex;flex-direction:column;gap:10px;box-shadow:0 8px 30px rgba(0,0,0,.5);overflow:auto}' +
    '.cam-card img{max-width:100%;max-height:56vh;object-fit:contain;border:1px solid var(--border,#d1d4dc);border-radius:6px;align-self:center}' +
    '.cam-row{display:flex;gap:8px;flex-wrap:wrap}' +
    '.cam-b{flex:1;min-width:130px;padding:9px 12px;border-radius:6px;border:1px solid var(--border,#d1d4dc);background:var(--pill-bg,#f0f3fa);color:inherit;font-size:13px;font-weight:700;cursor:pointer}' +
    '.cam-b.cam-pri{background:var(--acc,#2962ff);color:#fff;border-color:var(--acc,#2962ff)}' +
    '.cam-b:disabled{opacity:.6;cursor:default}' +
    '.cam-in{width:100%;box-sizing:border-box;padding:9px 10px;font-size:14px;border:1px solid var(--border,#d1d4dc);border-radius:6px;background:var(--pill-bg,#f0f3fa);color:inherit;outline:none}' +
    '.cam-toast{position:fixed;z-index:3400;left:50%;bottom:60px;transform:translateX(-50%);background:#131722;color:#fff;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:600}';
  document.head.appendChild(st);

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'cam-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }

  function curSlot() { try { return activeChartSlot; } catch (e) { return 1; } }
  function curSymbol() {
    try { if (activeChartPair) return String(activeChartPair); } catch (e) {}
    var el = document.getElementById('chartPairName');
    return el ? el.textContent.trim() : 'chart';
  }
  function curTF() {
    try { return chartIntervals[curSlot() - 1]; } catch (e) { return ''; }
  }

  /* ---------- screenshot ---------- */
  function capture() {
    var slot = curSlot(), chart = null;
    try { chart = lwCharts[slot]; } catch (e) {}
    var container = document.getElementById('tv_chart_' + slot);
    if (!chart || !container || typeof chart.takeScreenshot !== 'function') return null;
    var shot = chart.takeScreenshot();
    var out = document.createElement('canvas');
    out.width = shot.width; out.height = shot.height;
    var ctx = out.getContext('2d');
    ctx.drawImage(shot, 0, 0);
    var cw = container.clientWidth || 1, ch = container.clientHeight || 1;
    var sx = out.width / cw, sy = out.height / ch;
    var cr = container.getBoundingClientRect();

    /* drawing tools canvas */
    var dc = container.querySelectorAll('canvas.ici-draw-canvas');
    for (var i = 0; i < dc.length; i++) { try { ctx.drawImage(dc[i], 0, 0, out.width, out.height); } catch (e) {} }

    /* alert lines */
    var pw = 56;
    try { pw = chart.priceScale('right').width(); } catch (e) {}
    var al = container.querySelectorAll('.ici-al-line');
    ctx.save();
    ctx.strokeStyle = '#f7931a'; ctx.lineWidth = Math.max(1, sx);
    ctx.setLineDash([4 * sx, 4 * sx]);
    for (var j = 0; j < al.length; j++) {
      if (al[j].style.display === 'none') continue;
      var y = parseFloat(al[j].style.top);
      if (isNaN(y)) continue;
      ctx.beginPath(); ctx.moveTo(0, y * sy); ctx.lineTo((cw - pw) * sx, y * sy); ctx.stroke();
    }
    ctx.restore();

    /* text labels (watermark, ATR, timeframe) */
    var lb = container.querySelectorAll('.ici-overlay-label, .tfw-label');
    for (var k = 0; k < lb.length; k++) {
      var r = lb[k].getBoundingClientRect();
      if (!r.width || !r.height) continue;
      var cs = getComputedStyle(lb[k]);
      ctx.font = cs.fontWeight + ' ' + (parseFloat(cs.fontSize) * sx) + 'px ' + cs.fontFamily;
      ctx.fillStyle = cs.color;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(lb[k].textContent, (r.left - cr.left + r.width / 2) * sx, (r.top - cr.top + r.height / 2) * sy);
    }
    return out;
  }

  /* ---------- helpers ---------- */
  function fileName() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    var base = (curSymbol() + '_' + curTF()).replace(/[^A-Za-z0-9_\-]/g, '');
    return 'ICI_' + base + '_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()) + '.png';
  }

  function chatName() {
    try { if (typeof window.getDashUserName === 'function') return window.getDashUserName(); } catch (e) {}
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/dash/i.test(k) && /name/i.test(k)) { var v = localStorage.getItem(k); if (v) return v; }
      }
    } catch (e) {}
    return undefined;
  }

  function openChatPanel() {
    document.body.classList.remove('chat-hidden');
    var m = document.getElementById('chatMessages');
    if (m) setTimeout(function () { m.scrollTop = m.scrollHeight; }, 80);
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 0);
  }

  function copyText(t) {
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
      ta.remove(); toast(ok ? 'Link copied' : 'Copy failed');
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(t).then(function () { toast('Link copied'); }, fallback);
    } else fallback();
  }

  function copyLink() {
    var u = new URL(location.href);
    u.hash = '';
    u.searchParams.set('pair', curSymbol());
    var tf = curTF(); if (tf) u.searchParams.set('tf', tf);
    copyText(u.toString());
  }

  /* ---------- UI ---------- */
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function closeModal() { if (modal) { modal.remove(); modal = null; } }

  function openMenu() {
    closeMenu();
    menu = document.createElement('div');
    menu.className = 'cam-menu';
    menu.innerHTML = '<div class="cam-item" data-a="shot"><i class="fas fa-camera"></i> Take screenshot</div>' +
                     '<div class="cam-item" data-a="link"><i class="fas fa-link"></i> Copy link</div>';
    document.body.appendChild(menu);
    var r = btn.getBoundingClientRect();
    var left = Math.min(r.left, window.innerWidth - menu.offsetWidth - 6);
    menu.style.left = Math.max(6, left) + 'px';
    menu.style.top = (r.bottom + 4) + 'px';
  }

  function showPreview() {
    var cv;
    try { cv = capture(); } catch (e) { console.error('screenshot error', e); cv = null; }
    if (!cv) { toast('Screenshot not available (chart not ready)'); return; }
    lastShot = cv.toDataURL('image/png');
    closeModal();
    modal = document.createElement('div');
    modal.className = 'cam-modal';
    modal.innerHTML = '<div class="cam-card"><img alt="screenshot">' +
      '<div class="cam-row" data-view="main">' +
      '<button class="cam-b" data-a="save">Save to internal storage</button>' +
      '<button class="cam-b cam-pri" data-a="chat">Send to chat</button>' +
      '<button class="cam-b" data-a="close">Close</button></div>' +
      '<div class="cam-row" data-view="msg" style="display:none;flex-direction:column">' +
      '<input class="cam-in" type="text" placeholder="Write a message (optional)..." autocomplete="off">' +
      '<div class="cam-row"><button class="cam-b cam-pri" data-a="send">Send</button>' +
      '<button class="cam-b" data-a="back">Back</button></div></div></div>';
    modal.querySelector('img').src = lastShot;
    document.body.appendChild(modal);
  }

  function sendToChat() {
    var inp = modal.querySelector('.cam-in');
    var sendBtn = modal.querySelector('[data-a="send"]');
    var text = inp.value.trim();
    sendBtn.disabled = true; sendBtn.textContent = 'Sending...';
    fetch('/api/chat-msg/send-image', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: lastShot.split(',')[1], mimeType: 'image/png' })
    }).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.error) throw new Error(d.error);
      if (!text) return;
      return fetch('/api/chat-msg/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text, senderName: chatName() })
      }).then(function (r) { return r.json(); });
    }).then(function () {
      closeModal(); toast('Sent to chat'); openChatPanel();
    }).catch(function (e) {
      console.error('send to chat error', e);
      sendBtn.disabled = false; sendBtn.textContent = 'Send'; toast('Send failed');
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (btn && t.closest('#iciCamBtn')) { e.stopPropagation(); if (menu) closeMenu(); else openMenu(); return; }
    var it = t.closest('.cam-item');
    if (it) {
      var a = it.getAttribute('data-a'); closeMenu();
      if (a === 'shot') showPreview(); else if (a === 'link') copyLink();
      return;
    }
    if (menu && !t.closest('.cam-menu')) closeMenu();
    if (modal) {
      var b = t.closest('[data-a]');
      if (!b && t === modal) { closeModal(); return; }
      if (!b) return;
      var act = b.getAttribute('data-a');
      if (act === 'close') closeModal();
      else if (act === 'save') {
        var l = document.createElement('a');
        l.href = lastShot; l.download = fileName();
        document.body.appendChild(l); l.click(); l.remove();
        toast('Saved');
      } else if (act === 'chat') {
        modal.querySelector('[data-view="main"]').style.display = 'none';
        modal.querySelector('[data-view="msg"]').style.display = 'flex';
        modal.querySelector('.cam-in').focus();
      } else if (act === 'back') {
        modal.querySelector('[data-view="msg"]').style.display = 'none';
        modal.querySelector('[data-view="main"]').style.display = 'flex';
      } else if (act === 'send') sendToChat();
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal) { closeModal(); e.stopImmediatePropagation(); }
      else if (menu) closeMenu();
    } else if (e.key === 'Enter' && modal && e.target && e.target.classList && e.target.classList.contains('cam-in')) {
      e.preventDefault(); sendToChat();
    }
  }, true);

  /* fallback only if the app has no toggleChatPanel (desktop chat button needs it) */
  if (typeof window.toggleChatPanel !== 'function') {
    window.toggleChatPanel = function () {
      var hidden = document.body.classList.toggle('chat-hidden');
      var m = document.getElementById('chatMessages');
      if (!hidden && m) setTimeout(function () { m.scrollTop = m.scrollHeight; }, 50);
      window.dispatchEvent(new Event('resize'));
    };
  }

  /* ---------- header button ---------- */
  var tries = 0;
  function mount() {
    if (document.getElementById('iciCamBtn')) return;
    var anchor = document.querySelector('#chartOverlay button[title="Set Alert"]');
    if (!anchor || !anchor.parentNode) { if (tries++ < 40) setTimeout(mount, 500); return; }
    btn = document.createElement('button');
    btn.id = 'iciCamBtn';
    btn.title = 'Screenshot / link';
    btn.innerHTML = '<i class="fas fa-camera"></i>';
    anchor.parentNode.insertBefore(btn, anchor);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();

  /* ---------- open chart from ?pair=&tf= ---------- */
  (function () {
    var p = new URLSearchParams(location.search), pair = p.get('pair'), tf = p.get('tf');
    if (!pair) return;
    var n = 0;
    var t = setInterval(function () {
      if (++n > 60) { clearInterval(t); return; }
      try {
        if (typeof openChartForPair !== 'function' || typeof changeChartInterval !== 'function') return;
        var list = (typeof currentDisplayPairs !== 'undefined' && currentDisplayPairs.length) ? currentDisplayPairs :
                   (typeof PAIRS !== 'undefined' ? PAIRS.map(function (x) { return x.n; }) : []);
        if (!list.length) return;
        clearInterval(t);
        if (list.indexOf(pair) < 0) return;
        openChartForPair(pair);
        if (tf) changeChartInterval(tf, null);
      } catch (e) {}
    }, 500);
  })();
})();
