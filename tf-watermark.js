/* tf-watermark.js - shows the open timeframe at the top-right inside each chart */
(function () {
  if (window.__tfwLoaded) return;
  window.__tfwLoaded = true;

  var st = document.createElement('style');
  st.textContent =
    '.tfw-label{position:absolute;top:6px;right:76px;z-index:5;pointer-events:none;user-select:none;' +
    'font-size:24px;font-weight:800;letter-spacing:.5px;color:rgba(120,123,134,.85);' +
    'background:transparent;padding:2px 8px;white-space:nowrap}' +
    'body.is-mobile .tfw-label{font-size:20px;right:62px}';
  document.head.appendChild(st);

  function pretty(iv) {
    if (iv == null) return '';
    var s = String(iv).trim();
    if (s === '60') return '1H';
    if (s === '240') return '4H';
    if (/^d(ay)?$/i.test(s) || s === '1day') return '1D';
    if (/^w(eek)?$/i.test(s) || s === '1week') return '1W';
    if (/^\d+$/.test(s)) {                       /* plain number = minutes */
      var n = parseInt(s, 10);
      if (n >= 60 && n % 60 === 0) return (n / 60) + 'H';
      return n + 'm';
    }
    var m = /^(\d+)\s*(m|h|d|w)/i.exec(s);       /* 5m, 2h, 3d, 1week ... */
    if (m) {
      var u = m[2].toLowerCase();
      return m[1] + (u === 'm' ? 'm' : u.toUpperCase());
    }
    return s.toUpperCase();
  }

  function tick() {
    var ivs;
    try { ivs = chartIntervals; } catch (e) { return; }   /* app's own source of truth */
    if (!ivs) return;
    for (var slot = 1; slot <= 4; slot++) {
      var c = document.getElementById('tv_chart_' + slot);
      if (!c) continue;
      var lab = null;
      for (var k = 0; k < c.children.length; k++) {
        if (c.children[k].classList && c.children[k].classList.contains('tfw-label')) { lab = c.children[k]; break; }
      }
      if (!lab) {
        if (getComputedStyle(c).position === 'static') c.style.position = 'relative';
        lab = document.createElement('div');
        lab.className = 'tfw-label';
        c.appendChild(lab);
      }
      var t = pretty(ivs[slot - 1]);
      if (lab.textContent !== t) lab.textContent = t;
    }
  }

  setInterval(tick, 400);
  tick();
})();
