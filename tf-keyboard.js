/* tf-keyboard.js - TradingView style "type to change interval" */
(function () {
  if (window.__tfKbLoaded) return;
  window.__tfKbLoaded = true;

  var box = null, input = null, hint = null;

  var st = document.createElement('style');
  st.textContent =
    '.tfk-box{position:fixed;z-index:3100;left:50%;top:38%;transform:translateX(-50%);width:230px;padding:12px 14px;background:var(--surface,#fff);color:var(--txt,#131722);border:1px solid var(--border,#d1d4dc);border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);font-family:inherit}' +
    '.tfk-title{font-size:12px;font-weight:700;margin-bottom:8px;color:var(--muted,#787b86)}' +
    '.tfk-input{width:100%;box-sizing:border-box;padding:8px 10px;font-size:15px;font-weight:700;border:1px solid var(--border,#d1d4dc);border-radius:6px;background:var(--pill-bg,#f0f3fa);color:inherit;outline:none}' +
    '.tfk-input:focus{border-color:var(--acc,#2962ff)}' +
    '.tfk-input.tfk-bad{border-color:#f23645}' +
    '.tfk-hint{font-size:11px;margin-top:7px;min-height:14px;color:var(--muted,#787b86)}' +
    '.tfk-hint.tfk-bad{color:#f23645}';
  document.head.appendChild(st);

  function minutesToTF(n) {
    if (n <= 0) return null;
    if (n === 1440) return 'D';
    if (n >= 60 && n % 60 === 0) return hoursToTF(n / 60);
    return n + 'm';
  }
  function hoursToTF(h) {
    if (h <= 0) return null;
    return h === 1 ? '60' : (h === 4 ? '240' : h + 'h');
  }

  /* returns the interval string the app understands, or null */
  function parse(raw) {
    var s = String(raw || '').trim();
    if (!s) return null;
    if (/^\d+$/.test(s)) return minutesToTF(parseInt(s, 10));
    var m = /^(\d*)\s*([a-zA-Z])$/.exec(s);
    if (!m) return null;
    var n = m[1] ? parseInt(m[1], 10) : 1;
    if (n <= 0) return null;
    var u = m[2];
    if (u === 'm') return minutesToTF(n);          /* lowercase m = minutes (app format) */
    if (u === 'h' || u === 'H') return hoursToTF(n);
    if (u === 'd' || u === 'D') return n === 1 ? 'D' : n + 'd';
    if (u === 'w' || u === 'W') return n === 1 ? 'W' : n + 'w';
    return null;                                    /* month/seconds not supported by app */
  }

  function describe(tf) {
    if (tf === '60') return '1 hour';
    if (tf === '240') return '4 hours';
    if (tf === 'D') return '1 day';
    if (tf === 'W') return '1 week';
    var m = /^(\d+)([mhdw])$/.exec(tf);
    if (!m) return tf;
    var names = { m: 'minute', h: 'hour', d: 'day', w: 'week' };
    return m[1] + ' ' + names[m[2]] + (m[1] === '1' ? '' : 's');
  }

  function chartVisible() {
    var el = document.getElementById('chartOverlay');
    if (!el) return true;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function closeBox() {
    if (box) { box.remove(); box = null; input = null; hint = null; }
  }

  function update() {
    var tf = parse(input.value);
    if (!input.value.trim()) { hint.textContent = ''; hint.className = 'tfk-hint'; input.classList.remove('tfk-bad'); return; }
    if (tf) { hint.textContent = describe(tf); hint.className = 'tfk-hint'; input.classList.remove('tfk-bad'); }
    else { hint.textContent = 'Invalid interval'; hint.className = 'tfk-hint tfk-bad'; input.classList.add('tfk-bad'); }
  }

  function apply() {
    var tf = parse(input.value);
    if (!tf) { input.classList.add('tfk-bad'); return; }
    closeBox();
    if (typeof changeChartInterval === 'function') changeChartInterval(tf, null);
  }

  function openBox(first) {
    closeBox();
    box = document.createElement('div');
    box.className = 'tfk-box';
    box.innerHTML = '<div class="tfk-title">Change interval</div><input class="tfk-input" type="text" autocomplete="off" spellcheck="false"><div class="tfk-hint"></div>';
    input = box.querySelector('input');
    hint = box.querySelector('.tfk-hint');
    document.body.appendChild(box);
    input.value = first;
    input.focus();
    input.setSelectionRange(first.length, first.length);
    update();
    input.addEventListener('input', update);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); apply(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeBox(); }
    });
  }

  var overChart = false;
  function track(e) {
    var c = document.getElementById('chartOverlay');
    overChart = !!(c && e.target && c.contains(e.target));
  }
  ['mousemove', 'mousedown', 'touchstart'].forEach(function (n) {
    document.addEventListener(n, track, true);
  });
  function inChartZone() {
    if (!chartVisible()) return false;
    if (document.body.classList.contains('is-mobile')) return true;
    return overChart;
  }

  window.addEventListener('keydown', function (e) {
    if (e.isComposing) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!e.key || e.key.length !== 1 || !/[0-9a-zA-Z]/.test(e.key)) return;
    var a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT' || a.isContentEditable)) return;
    if (typeof changeChartInterval !== 'function' || !inChartZone()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openBox(e.key);
  }, true);

  document.addEventListener('mousedown', function (e) {
    if (box && !box.contains(e.target)) closeBox();
  }, true);
})();
