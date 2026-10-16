/* flags.js - TradingView style symbol flags for watchlist (#wlRows) + pairs list (#pairsContainer) v4 */
(function () {
  if (window.__sfFlagsLoaded) return;
  window.__sfFlagsLoaded = true;

  var KEY = 'symbolFlags';
  var COLORS = ['#f23645', '#2962ff', '#4caf93', '#ff9800', '#9575cd', '#26c6da', '#f06292'];
  var FLAG_SVG = '<svg viewBox="0 0 9 13" width="9" height="13" style="display:block"><path fill="currentColor" d="M0 0H9L6.2 6.5L9 13H0Z"/></svg>';
  var flags = {};
  var pop = null, popSym = null;

  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(KEY));
      flags = (o && typeof o === 'object') ? o : {};
    } catch (e) { flags = {}; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(flags)); } catch (e) {}
  }

  var st = document.createElement('style');
  st.id = 'sf-style';
  st.textContent =
    '#wlRows .wl-row, .wl-header-row { padding-left:16px !important; }' +
    '.sf-flag { position:absolute; left:0; top:50%; transform:translateY(-50%); width:14px; height:26px; display:flex; align-items:center; justify-content:flex-start; cursor:pointer; opacity:0; color:#b2b5be; z-index:2; }' +
    '#pairsContainer .sf-flag { width:14px; height:30px; }' +
    '#pairsContainer .col-pair-fixed { padding-left:14px !important; }' +
    '.col-header-cell.col-pair-fixed { padding-left:18px !important; }' +
    '.sf-flag:hover { opacity:.9; }' +
    '.sf-flag.sf-on { opacity:1 !important; }' +
    '.sf-flag:hover { color:#787b86; }' +
    '.sf-flag.sf-on:hover { filter:brightness(.9); }' +
    '@media (hover:none) { .sf-flag { opacity:.3; } }' +
    '.sf-pop { position:fixed; z-index:3005; display:flex; gap:9px; align-items:center; padding:8px 12px; background:var(--surface,#fff); border:1px solid var(--border,#d1d4dc); border-radius:8px; box-shadow:0 2px 12px rgba(0,0,0,.28); }' +
    '.sf-pop::before { content:""; position:absolute; left:-6px; top:50%; width:10px; height:10px; margin-top:-5px; transform:rotate(45deg); background:var(--surface,#fff); border-left:1px solid var(--border,#d1d4dc); border-bottom:1px solid var(--border,#d1d4dc); }' +
    '.sf-dot { position:relative; width:16px; height:16px; border-radius:50%; cursor:pointer; flex:none; box-sizing:border-box; }' +
    '.sf-dot:hover { transform:scale(1.15); }' +
    '.sf-dot.sf-sel { box-shadow:0 0 0 2px var(--surface,#fff), 0 0 0 3.5px var(--sf-c); }';
  document.head.appendChild(st);

  function paint(el) {
    var c = flags[el.getAttribute('data-sf')];
    if (c) { el.style.color = c; el.classList.add('sf-on'); }
    else { el.style.color = ''; el.classList.remove('sf-on'); }
  }

  function symOf(row) {
    if (row.classList.contains('wl-row')) return row.getAttribute('data-sym') || '';
    var main = row.querySelector('.item-main');
    if (!main) return '';
    var m = (main.getAttribute('onclick') || '').match(/openChartForPair\('([^']+)'\)/);
    return m ? m[1] : '';
  }

  function directFlag(row) {
    for (var k = 0; k < row.children.length; k++) {
      if (row.children[k].classList && row.children[k].classList.contains('sf-flag')) return row.children[k];
    }
    return null;
  }

  function apply() {
    var rows = document.querySelectorAll('#wlRows .wl-row, #pairsContainer .item-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var sym = symOf(row);
      if (!sym) continue;
      var f = directFlag(row);
      if (!f) {
        if (!row.classList.contains('wl-row') && getComputedStyle(row).position === 'static') row.style.position = 'relative';
        f = document.createElement('b');
        f.className = 'sf-flag';
        f.innerHTML = FLAG_SVG;
        row.appendChild(f); /* sibling of .item-main, so chart-open and drag code are untouched */
      }
      if (f.getAttribute('data-sf') !== sym) f.setAttribute('data-sf', sym);
      paint(f);
    }
  }

  var raf = 0;
  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(function () { raf = 0; apply(); });
  }

  function closePop() {
    if (pop) { pop.remove(); pop = null; popSym = null; }
  }

  function openPop(flagEl, sym) {
    closePop();
    popSym = sym;
    pop = document.createElement('div');
    pop.className = 'sf-pop';
    var cur = flags[sym];
    COLORS.forEach(function (c) {
      var d = document.createElement('span');
      d.className = 'sf-dot' + (cur === c ? ' sf-sel' : '');
      d.style.background = c;
      d.style.setProperty('--sf-c', c);
      d.setAttribute('data-c', c);
      pop.appendChild(d);
    });
    document.body.appendChild(pop);
    var r = flagEl.getBoundingClientRect();
    var left = r.right + 10;
    var top = r.top + (r.height - pop.offsetHeight) / 2;
    if (left + pop.offsetWidth > window.innerWidth - 6) left = Math.max(6, window.innerWidth - pop.offsetWidth - 6);
    if (top < 6) top = 6;
    if (top + pop.offsetHeight > window.innerHeight - 6) top = window.innerHeight - pop.offsetHeight - 6;
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
  }

  ['pointerdown', 'mousedown', 'touchstart'].forEach(function (n) {
    window.addEventListener(n, function (e) {
      var t = e.target;
      if (t && t.closest && (t.closest('.sf-flag') || t.closest('.sf-pop'))) e.stopPropagation();
    }, true);
  });

  window.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var dot = t.closest('.sf-dot');
    if (dot) {
      e.stopPropagation(); e.preventDefault();
      var c = dot.getAttribute('data-c');
      if (popSym) { if (flags[popSym] === c) delete flags[popSym]; else flags[popSym] = c; }
      save(); closePop(); apply();
      return;
    }
    var fl = t.closest('.sf-flag');
    if (fl) {
      e.stopPropagation(); e.preventDefault();
      var s = fl.getAttribute('data-sf');
      if (pop && popSym === s) closePop(); else openPop(fl, s);
      return;
    }
    if (pop && !t.closest('.sf-pop')) closePop();
  }, true);

  window.addEventListener('storage', function (e) {
    if (e.key === KEY) { load(); apply(); }
  });

  var watched = {};
  var tries = 0;
  function start() {
    ['wlRows', 'pairsContainer'].forEach(function (id) {
      if (watched[id]) return;
      var el = document.getElementById(id);
      if (!el) return;
      watched[id] = true;
      new MutationObserver(schedule).observe(el, { childList: true, subtree: true });
    });
    load();
    apply();
    if ((!watched.wlRows || !watched.pairsContainer) && tries++ < 40) setTimeout(start, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
