(function () {
  var EXACT = { 'tfPreset':1, 'show4H':1, 'stocks_show4H':1, 'crypto_show4H':1, 'ici_stocks_starred':1, 'ici_starred':1, 'ici_crypto_starred':1,
    'ici_stocks_columns':1, 'ici_crypto_columns':1, 'ici_columns':1, 'iciMagnet':1, 'ici-theme':1, 'ici-stocks-theme':1, 'ici-crypto-theme':1,
    'symbolFlags':1, 'ici-indicator-settings':1, 'ici_tabs_v1':1 };
  var PREFIX = ['ici_customTF_', 'ici_extraTF_', 'ici_wl_cols_'];
  function ok(k) {
    if (typeof k !== 'string' || k.length > 120) return false;
    if (EXACT[k] === 1) return true;
    for (var i = 0; i < PREFIX.length; i++) { if (k.indexOf(PREFIX[i]) === 0) return true; }
    return false;
  }
  var ls;
  try { ls = window.localStorage; } catch (e) { return; }
  var oSet = Storage.prototype.setItem, oRem = Storage.prototype.removeItem;
  var pend = { set: {}, del: {} }, timer = null;

  function flush() {
    timer = null;
    var s = pend.set, d = Object.keys(pend.del);
    pend = { set: {}, del: {} };
    if (!Object.keys(s).length && !d.length) return;
    try {
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ set: s, del: d }), keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  function sched() { if (timer) clearTimeout(timer); timer = setTimeout(flush, 800); }

  var server = null;
  try {
    var x = new XMLHttpRequest();
    x.open('GET', '/api/settings', false);
    x.send();
    if (x.status === 200) { var j = JSON.parse(x.responseText); if (j && j.ok) server = j.data || {}; }
  } catch (e) {}

  if (server) {
    Object.keys(server).forEach(function (k) {
      if (ok(k) && typeof server[k] === 'string') { try { oSet.call(ls, k, server[k]); } catch (e) {} }
    });
    var up = {}, n = 0;
    for (var i = 0; i < ls.length; i++) {
      var k = ls.key(i);
      if (ok(k) && !(k in server)) {
        var v = ls.getItem(k);
        if (v !== null && v.length < 100000) { up[k] = v; n++; }
      }
    }
    if (n) { pend.set = up; flush(); }
  }

  Storage.prototype.setItem = function (k, v) {
    oSet.call(this, k, v);
    if (this === ls && server && ok(k)) {
      var s = String(v);
      if (s.length < 100000) { pend.set[k] = s; delete pend.del[k]; sched(); }
    }
  };
  Storage.prototype.removeItem = function (k) {
    oRem.call(this, k);
    if (this === ls && server && ok(k)) { pend.del[k] = 1; delete pend.set[k]; sched(); }
  };
  window.addEventListener('pagehide', flush);
})();
