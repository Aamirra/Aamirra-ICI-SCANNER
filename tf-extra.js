(function () {
  'use strict';
  if (window.__iciExtraTF) return;
  window.__iciExtraTF = 1;
  var anchor = document.getElementById('countdownDisplay');
  if (!anchor || !anchor.parentNode) return;
  var box = anchor.parentNode;
  var KEY = 'ici_extraTF_' + location.pathname.replace(/[^a-z0-9]/gi, '_');
  var QUICK = ['1m', '5m', '15m', '30m', '2h', '6h', '12h', '3d'];

  function norm(v) {
    var m = /^\s*(\d{1,3})\s*([mhdw])\s*$/i.exec(v || '');
    if (!m) return null;
    var n = parseInt(m[1], 10);
    if (!n) return null;
    var u = m[2].toLowerCase();
    return { val: n + u, label: n + (u === 'm' ? 'm' : u.toUpperCase()) };
  }
  function load() {
    try { var a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(KEY, JSON.stringify(a)); } catch (e) {} }
  var list = load().filter(function (x) { return norm(x); });

  var css = document.createElement('style');
  css.textContent =
    '#iciAddTFBtn{font-weight:700}' +
    '#iciAddTFPop{position:fixed;z-index:100000;display:none;min-width:170px;padding:8px;border-radius:8px;background:#fff;border:1px solid #e0e3eb;box-shadow:0 6px 24px rgba(0,0,0,.18);font:13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;color:#131722}' +
    '#iciAddTFPop.open{display:block}' +
    '#iciAddTFPop input{width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #e0e3eb;border-radius:6px;font:inherit;color:#131722;background:#fff;outline:none}' +
    '#iciAddTFPop input:focus{border-color:#1a73e8}' +
    '#iciAddTFPop input.bad{border-color:#e5484d}' +
    '#iciAddTFPop .it{padding:6px 8px;border-radius:6px;cursor:pointer}' +
    '#iciAddTFPop .it:hover{background:#1a73e8;color:#fff}' +
    '#iciAddTFPop .lst{margin-top:6px;display:flex;flex-direction:column}';
  document.head.appendChild(css);

  var plus = document.createElement('button');
  plus.className = 'chart-interval-btn';
  plus.id = 'iciAddTFBtn';
  plus.type = 'button';
  plus.title = 'Add timeframe';
  plus.textContent = '+';
  box.insertBefore(plus, anchor);

  var pop = document.createElement('div');
  pop.id = 'iciAddTFPop';
  pop.innerHTML = '<input type="text" placeholder="e.g. 6h, 15m, 2d" autocomplete="off"><div class="lst"></div>';
  document.body.appendChild(pop);
  var input = pop.querySelector('input');
  var lst = pop.querySelector('.lst');

  function addBtn(val) {
    var p = norm(val);
    var b = document.createElement('button');
    b.className = 'chart-interval-btn ici-tf-extra';
    b.type = 'button';
    b.dataset.interval = p.val;
    b.textContent = p.label;
    b.title = 'Right-click to remove';
    b.addEventListener('click', function () { window.changeChartInterval(b.dataset.interval, b); });
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); removeTF(b.dataset.interval); });
    box.insertBefore(b, plus);
  }
  function removeTF(val) {
    list = list.filter(function (x) { return x !== val; });
    save(list);
    var els = box.querySelectorAll('.ici-tf-extra');
    for (var i = 0; i < els.length; i++) if (els[i].dataset.interval === val) els[i].remove();
  }
  function add(raw) {
    var p = norm(raw);
    if (!p) return false;
    if (list.indexOf(p.val) === -1) { list.push(p.val); save(list); addBtn(p.val); }
    window.changeChartInterval(p.val, null);
    return true;
  }
  function openPop() {
    var r = plus.getBoundingClientRect();
    pop.classList.add('open');
    pop.style.top = (r.bottom + 6) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
    input.value = '';
    input.classList.remove('bad');
    input.focus();
  }
  function closePop() { pop.classList.remove('open'); }

  QUICK.forEach(function (q) {
    var d = document.createElement('div');
    d.className = 'it';
    d.textContent = norm(q).label;
    d.addEventListener('click', function () { add(q); closePop(); });
    lst.appendChild(d);
  });
  plus.addEventListener('click', function (e) {
    e.stopPropagation();
    if (pop.classList.contains('open')) closePop(); else openPop();
  });
  document.addEventListener('click', function (e) { if (!pop.contains(e.target)) closePop(); });
  input.addEventListener('keydown', function (e) {
    e.stopPropagation();
    if (e.key === 'Enter') { if (add(input.value)) closePop(); else input.classList.add('bad'); }
    else if (e.key === 'Escape') closePop();
    else input.classList.remove('bad');
  });

  list.forEach(addBtn);
})();
