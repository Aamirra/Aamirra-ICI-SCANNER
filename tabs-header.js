(function () {
  function main() {
    if (window.__iciTabsLoaded) return;
    window.__iciTabsLoaded = 1;

    var KEY = 'ici_tabs_v1';
    var H = 28;
    var MK = {
      forex:  { label: 'Forex',  path: '/',                  color: '#2962ff' },
      stocks: { label: 'Stocks', path: '/stocks',            color: '#f59e0b' },
      psx:    { label: 'PSX',    path: '/stocks?market=psx', color: '#a855f7' },
      crypto: { label: 'Crypto', path: '/crypto',            color: '#22c55e' }
    };
    var TFL = { '1m': 'M1', '5m': 'M5', '15m': 'M15', '30m': 'M30', '60': '1H', '240': '4H', 'D': '1D', 'W': '1W' };
    var lock = 0, menu = null;

    function curMarket() {
      var p = (location.pathname || '/').toLowerCase();
      if (p.indexOf('/crypto') === 0) return 'crypto';
      if (p.indexOf('/stocks') === 0) return /[?&]market=psx/i.test(location.search) ? 'psx' : 'stocks';
      return 'forex';
    }
    function uid() { return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    function load() {
      try {
        var s = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (s && s.tabs && s.tabs.length) return s;
      } catch (e) {}
      return null;
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
    function getTab(id) {
      for (var i = 0; i < S.tabs.length; i++) if (S.tabs[i].id === id) return S.tabs[i];
      return null;
    }

    var cm = curMarket();
    var S = load();
    if (!S) { var t0 = { id: uid(), market: cm, symbol: '', tf: '' }; S = { tabs: [t0], active: t0.id }; }
    var act = getTab(S.active);
    if (!act) { act = S.tabs[0]; S.active = act.id; }
    var restore = null;
    if (act.market !== cm) { act.market = cm; act.symbol = ''; act.tf = ''; }
    else if (act.symbol) restore = act;
    save();

    /* ---------- chart state readers (existing page globals) ---------- */
    function isOpen() {
      var ov = document.getElementById('chartOverlay');
      return !!ov && getComputedStyle(ov).display !== 'none';
    }
    function curSlot() { try { return activeChartSlot - 1; } catch (e) { return 0; } }
    function curSym() {
      try {
        var s = chartPairs[chartIndices[curSlot()]];
        if (s && typeof s === 'object' && s.n) s = s.n;
        if (typeof s === 'string' && s) return s;
      } catch (e) {}
      try { if (typeof activeChartPair === 'string') return activeChartPair; } catch (e) {}
      return '';
    }
    function curTF() { try { return String(chartIntervals[curSlot()] || ''); } catch (e) { return ''; } }

    /* ---------- actions ---------- */
    function openSym(sym, tf) {
      if (typeof window.openChartForPair !== 'function') return false;
      window.openChartForPair(sym);
      if (tf && typeof window.changeChartInterval === 'function') {
        setTimeout(function () {
          try { if (curTF() !== tf) window.changeChartInterval(tf, null); } catch (e) {}
        }, 300);
      }
      return true;
    }
    function closeSym() {
      try { if (isOpen() && typeof window.closeChart === 'function') window.closeChart(); } catch (e) {}
    }
    function apply(t) {
      lock = Date.now() + 1500;
      try { if (t.symbol) openSym(t.symbol, t.tf); else closeSym(); } catch (e) {}
    }
    function go(m) { location.href = MK[m].path; }

    function sync() {
      try {
        if (Date.now() < lock) return;
        var t = getTab(S.active);
        if (!t) return;
        var open = isOpen();
        var sym = open ? curSym() : '';
        var tf = open ? curTF() : '';
        if (t.symbol !== sym || t.tf !== tf) { t.symbol = sym; t.tf = tf; save(); render(); }
      } catch (e) {}
    }
    function switchTo(id) {
      sync();
      if (id === S.active) return;
      var t = getTab(id);
      if (!t) return;
      S.active = id; save(); render();
      if (t.market !== cm) go(t.market); else apply(t);
    }
    function newTab(k) {
      sync();
      var t = { id: uid(), market: k, symbol: '', tf: '' };
      S.tabs.push(t); S.active = t.id; save(); render();
      if (k !== cm) go(k); else apply(t);
    }
    function closeTab(id) {
      sync();
      if (S.tabs.length < 2) return;
      var i = -1;
      for (var j = 0; j < S.tabs.length; j++) if (S.tabs[j].id === id) i = j;
      if (i < 0) return;
      var wasActive = (id === S.active);
      S.tabs.splice(i, 1);
      if (wasActive) {
        var n = S.tabs[Math.min(i, S.tabs.length - 1)];
        S.active = n.id; save(); render();
        if (n.market !== cm) go(n.market); else apply(n);
      } else { save(); render(); }
    }

    /* ---------- UI ---------- */
    var css = document.createElement('style');
    css.textContent = [
      'html{padding-top:' + H + 'px !important}',
      'body{min-height:calc(100vh - ' + H + 'px) !important}',
      'body.desktop-mode #chartOverlay{top:0 !important;height:calc(100vh - ' + H + 'px) !important}',
      'body.is-mobile #chartOverlay{top:' + H + 'px !important;height:calc(100% - ' + H + 'px) !important}',
      '#iciTabsBar{position:fixed;top:0;left:0;right:0;height:' + H + 'px;z-index:990;display:flex;align-items:stretch;background:var(--bg,#f8fafc);border-bottom:1px solid var(--border,#e2e8f0);font-family:Inter,sans-serif;color:var(--txt,#0f172a);-webkit-user-select:none;user-select:none}',
      '#iciTabsList{position:relative;display:flex;flex:1;min-width:0;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;align-items:flex-end;padding:4px 6px 0;gap:4px;-webkit-overflow-scrolling:touch}',
      '#iciTabsList::-webkit-scrollbar{display:none;height:0}',
      '.ici-tab{flex:0 0 auto;display:flex;align-items:center;gap:6px;height:24px;padding:0 4px 0 8px;border:1px solid var(--border,#e2e8f0);border-bottom:none;border-radius:8px 8px 0 0;background:var(--pill-bg,#f1f5f9);color:var(--muted,#64748b);font-size:12px;font-weight:600;cursor:pointer;max-width:180px;white-space:nowrap}',
      '.ici-tab.on{background:var(--surface,#fff);color:var(--txt,#0f172a);box-shadow:inset 0 2px 0 var(--acc,#0062ff)}',
      '.ici-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto;display:inline-block}',
      '.ici-txt{overflow:hidden;text-overflow:ellipsis}',
      '.ici-tf{font-size:10px;font-weight:700;color:var(--muted,#64748b);background:var(--pill-bg,#f1f5f9);border-radius:4px;padding:1px 4px}',
      '.ici-x{border:none;background:none;color:inherit;font-size:15px;line-height:1;width:18px;height:18px;border-radius:50%;cursor:pointer;opacity:.6;padding:0}',
      '.ici-x:hover{opacity:1;background:rgba(127,127,127,.25)}',
      '#iciTabsAdd{flex:0 0 auto;width:24px;height:24px;border:none;background:none;color:var(--txt,#0f172a);font-size:18px;line-height:1;cursor:pointer;border-radius:6px}','#iciTabsAdd:hover{background:rgba(127,127,127,.2)}',
      '#iciTabsMenu{position:absolute;top:' + H + 'px;right:6px;display:flex;flex-direction:column;gap:4px;background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:10px;padding:6px;box-shadow:0 4px 12px rgba(0,0,0,.18);min-width:140px}',
      '#iciTabsMenu button{display:flex;align-items:center;gap:8px;border:1px solid var(--border,#e2e8f0);background:var(--pill-bg,#f1f5f9);color:var(--txt,#0f172a);border-radius:8px;padding:7px 10px;font-size:13px;font-weight:600;cursor:pointer;text-align:left}'
    ].join('\n');
    document.head.appendChild(css);
    var cssSmall = document.createElement('style');
    cssSmall.textContent = '@media (max-width:600px){'
      + '#iciTabsList{gap:2px !important}'
      + '.ici-tab{padding:0 5px !important;gap:3px !important;min-width:0 !important}'
      + '.ici-txt{font-size:10px !important;max-width:64px !important}'
      + '.ici-dot{width:5px !important;height:5px !important}'
      + '.ici-x{width:14px !important;height:14px !important;font-size:11px !important;margin-left:0 !important}'
      + '#iciTabsAdd{width:20px !important}'
      + '}';
    document.head.appendChild(cssSmall);

    var bar = document.createElement('div');
    bar.id = 'iciTabsBar';
    bar.innerHTML = '<div id="iciTabsList"></div>';
    document.body.appendChild(bar);
    var list = document.getElementById('iciTabsList');
    var dragBlock = 0, dragging = false;
    document.addEventListener('touchmove', function (e) { if (dragging && e.cancelable) e.preventDefault(); }, { passive: false });

    function attachDrag(el) {
      el.addEventListener('contextmenu', function (e) { if (e.pointerType === 'touch' || dragging) e.preventDefault(); });
      el.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        if (e.target.closest && e.target.closest('.ici-x')) return;
        var sx = e.clientX, pid = e.pointerId, isTouch = e.pointerType === 'touch';
        var tabs = Array.prototype.slice.call(list.querySelectorAll('.ici-tab'));
        var from = tabs.indexOf(el), to = from;
        if (from < 0) return;
        var rects = null, started = false, timer = null, startScroll = list.scrollLeft, GAP = 4;

        function begin() {
          started = true; dragging = true;
          rects = tabs.map(function (t) { return { l: t.offsetLeft, w: t.offsetWidth }; });
          el.style.transition = 'none'; el.style.zIndex = 5; el.style.opacity = '0.85';
          el.style.position = 'relative';
          try { el.setPointerCapture(pid); } catch (x) {}
        }
        function onMove(ev) {
          if (ev.pointerId !== pid) return;
          var dx = ev.clientX - sx;
          if (!started) {
            if (isTouch) { if (Math.abs(dx) > 8) { clearTimeout(timer); cleanup(false); } return; }
            if (Math.abs(dx) > 5) begin(); else return;
          }
          dx += (list.scrollLeft - startScroll);
          el.style.transform = 'translateX(' + dx + 'px)';
          var center = rects[from].l + rects[from].w / 2 + dx;
          to = from;
          for (var i = 0; i < rects.length; i++) {
            if (center >= rects[i].l && center <= rects[i].l + rects[i].w + GAP) { to = i; break; }
          }
          if (center < rects[0].l) to = 0;
          if (center > rects[rects.length - 1].l + rects[rects.length - 1].w) to = rects.length - 1;
          for (var j = 0; j < tabs.length; j++) {
            if (j === from) continue;
            var sh = 0;
            if (from < to && j > from && j <= to) sh = -(rects[from].w + GAP);
            else if (from > to && j >= to && j < from) sh = rects[from].w + GAP;
            tabs[j].style.transition = 'transform .12s';
            tabs[j].style.transform = sh ? 'translateX(' + sh + 'px)' : '';
          }
          var lr = list.getBoundingClientRect();
          if (ev.clientX > lr.right - 30) list.scrollLeft += 8;
          else if (ev.clientX < lr.left + 30) list.scrollLeft -= 8;
        }
        function cleanup(commit) {
          clearTimeout(timer);
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onCancel);
          var was = started;
          started = false; dragging = false;
          try { el.releasePointerCapture(pid); } catch (x) {}
          if (was) {
            dragBlock = Date.now() + 300;
            if (commit && to !== from) {
              var moved = S.tabs.splice(from, 1)[0];
              S.tabs.splice(to, 0, moved);
              save();
            }
            render();
          }
        }
        function onUp(ev) { if (ev.pointerId === pid) cleanup(true); }
        function onCancel(ev) { if (ev.pointerId === pid) cleanup(false); }
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onCancel);
        if (isTouch) timer = setTimeout(begin, 350);
      });
    }

    function render() {
      list.innerHTML = '';
      S.tabs.forEach(function (t) {
        var m = MK[t.market] || MK.forex;
        var d = document.createElement('div');
        d.className = 'ici-tab' + (t.id === S.active ? ' on' : '');
        d.title = m.label + (t.symbol ? ' · ' + t.symbol : '');
        var dot = document.createElement('span');
        dot.className = 'ici-dot'; dot.style.background = m.color;
        var tx = document.createElement('span');
        tx.className = 'ici-txt'; tx.textContent = t.symbol || m.label;
        d.appendChild(dot); d.appendChild(tx);
        if (S.tabs.length > 1) {
          var x = document.createElement('button');
          x.className = 'ici-x'; x.textContent = '\u00d7'; x.title = 'Close tab';
          x.onclick = function (ev) { ev.stopPropagation(); closeTab(t.id); };
          d.appendChild(x);
        }
        d.onclick = function () { if (Date.now() < dragBlock) return; switchTo(t.id); };
        attachDrag(d);
        list.appendChild(d);
      });
      var ab = document.createElement('button'); ab.id = 'iciTabsAdd'; ab.title = 'New tab'; ab.textContent = '+'; ab.onclick = addClick; list.appendChild(ab);
      var on = list.querySelector('.on');
      if (on) {
        if (on.offsetLeft < list.scrollLeft) list.scrollLeft = on.offsetLeft - 6;
        else if (on.offsetLeft + on.offsetWidth > list.scrollLeft + list.clientWidth)
          list.scrollLeft = on.offsetLeft + on.offsetWidth - list.clientWidth + 6;
      }
    }
    render();

    function closeMenu() { if (menu && menu.parentNode) menu.parentNode.removeChild(menu); menu = null; }
    function addClick(e) {
      e.stopPropagation();
      closeMenu(); newTab(cm); return;
      menu = document.createElement('div');
      menu.id = 'iciTabsMenu';
      ['forex', 'stocks', 'psx', 'crypto'].forEach(function (k) {
        var b = document.createElement('button');
        b.innerHTML = '<span class="ici-dot" style="background:' + MK[k].color + '"></span>' + MK[k].label;
        b.onclick = function (ev) { ev.stopPropagation(); closeMenu(); newTab(k); };
        menu.appendChild(b);
      });
      var r = e.currentTarget.getBoundingClientRect(); menu.style.right = 'auto'; menu.style.left = Math.max(4, Math.min(r.left, window.innerWidth - 150)) + 'px';
      bar.appendChild(menu);
    }
    document.addEventListener('click', closeMenu);

    setInterval(sync, 800);

    /* ---------- restore chart after page load / tab switch across pages ---------- */
    if (restore) {
      lock = Date.now() + 30000;
      var tries = 0;
      var tryOpen = function () {
        tries++;
        var ok = false;
        try { ok = openSym(restore.symbol, restore.tf); } catch (e) { ok = false; }
        var cs = '';
        try { cs = curSym(); } catch (e) {}
        if (ok && isOpen() && (cs === restore.symbol || cs === '')) { lock = Date.now() + 800; return; }
        if (tries < 20) setTimeout(tryOpen, 500); else lock = 0;
      };
      window.addEventListener('load', function () { setTimeout(tryOpen, 600); });
    }
  }
  try { main(); } catch (e) { try { console.log('ici-tabs error', e); } catch (x) {} }
})();
