(function () {
  if (window.__iciWlReorder) return;
  window.__iciWlReorder = 1;
  var dragBlock = 0, dragging = false;

  document.addEventListener('touchmove', function (e) { if (dragging && e.cancelable) e.preventDefault(); }, { passive: false });
  document.addEventListener('click', function (e) {
    if (Date.now() < dragBlock && e.target.closest && e.target.closest('.wl-row')) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  document.addEventListener('pointerdown', function (e) {
    if (e.button !== undefined && e.button !== 0) return;
    var el = e.target.closest && e.target.closest('.wl-row');
    if (!el) return;
    var rowsEl = document.getElementById('wlRows');
    var wrap = document.getElementById('wlTableWrap');
    if (!rowsEl || !wrap || !rowsEl.contains(el)) return;
    if (typeof window.__wlReorder !== 'function') return;
    e.stopPropagation();

    var sy = e.clientY, pid = e.pointerId, isTouch = e.pointerType === 'touch';
    var rows = Array.prototype.slice.call(rowsEl.querySelectorAll('.wl-row'));
    var from = rows.indexOf(el), to = from;
    if (from < 0) return;
    var rects = null, started = false, timer = null, startScroll = wrap.scrollTop, lastY = sy;

    function begin() {
      started = true; dragging = true;
      rects = rows.map(function (r) { return { t: r.offsetTop, h: r.offsetHeight }; });
      /* 3-second auto re-render ko drag ke dauran rok do */
      try { Object.defineProperty(rowsEl, 'innerHTML', { configurable: true, set: function () {}, get: function () { return ''; } }); } catch (x) {}
      el.style.position = 'relative'; el.style.zIndex = 5; el.style.opacity = '0.85';
      el.style.background = 'var(--pill-bg,#f1f5f9)'; el.style.transition = 'none';
      try { el.setPointerCapture(pid); } catch (x) {}
    }
    function layout() {
      var dy = lastY - sy + (wrap.scrollTop - startScroll);
      el.style.transform = 'translateY(' + dy + 'px)';
      var center = rects[from].t + rects[from].h / 2 + dy;
      to = from;
      for (var i = 0; i < rects.length; i++) {
        if (center >= rects[i].t && center <= rects[i].t + rects[i].h) { to = i; break; }
      }
      if (center < rects[0].t) to = 0;
      var last = rects[rects.length - 1];
      if (center > last.t + last.h) to = rects.length - 1;
      for (var j = 0; j < rows.length; j++) {
        if (j === from) continue;
        var sh = 0;
        if (from < to && j > from && j <= to) sh = -rects[from].h;
        else if (from > to && j >= to && j < from) sh = rects[from].h;
        rows[j].style.transition = 'transform .12s';
        rows[j].style.transform = sh ? 'translateY(' + sh + 'px)' : '';
      }
    }
    function onMove(ev) {
      if (ev.pointerId !== pid) return;
      lastY = ev.clientY;
      var dy = ev.clientY - sy;
      if (!started) {
        if (isTouch) { if (Math.abs(dy) > 8) { cleanup(false); } return; }
        if (Math.abs(dy) > 5) begin(); else return;
      }
      var wr = wrap.getBoundingClientRect();
      if (ev.clientY > wr.bottom - 18) wrap.scrollTop += 6;
      else if (ev.clientY < wr.top + 30) wrap.scrollTop -= 6;
      layout();
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
        try { delete rowsEl.innerHTML; } catch (x) {}
        rows.forEach(function (r) { r.style.cssText = ''; });
        if (commit && to !== from) {
          try { window.__wlReorder(rows[from].getAttribute('data-sym'), rows[to].getAttribute('data-sym')); } catch (x) {}
        }
      }
    }
    function onUp(ev) { if (ev.pointerId === pid) cleanup(true); }
    function onCancel(ev) { if (ev.pointerId === pid) cleanup(false); }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
    if (isTouch) timer = setTimeout(begin, 300);
  }, true);
})();
