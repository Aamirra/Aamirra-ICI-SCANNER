(function () {
  if (window.__iciWlCols) return;
  window.__iciWlCols = 1;
  var KEY = 'ici_wl_cols_' + location.pathname;
  var SHORT = { change_200: '200C', change_10: '10C', change_1h: '1H', vol_7d: 'Vol7D', dollar_vol: '$Vol', price: 'Price', tf_alignment: 'TF', sentiment: 'Sent' };
  var cols = [], pop = null;

  function types() { try { return COLUMN_TYPES; } catch (e) { return null; } }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function defaults() {
    var T = types() || {}, d = [];
    if (T.price) d.push({ id: 'w1', type: 'price', label: 'Last' });
    if (T.change_200) d.push({ id: 'w2', type: 'change_200', label: '200C', style: 'colored' });
    if (!d.length) { var k = Object.keys(T)[0]; if (k) d.push({ id: 'w1', type: k, label: '' }); }
    return d;
  }
  function load() {
    var T = types() || {};
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var p = JSON.parse(raw);
        if (Array.isArray(p)) return p.filter(function (c) { return c && T[c.type]; });
      }
    } catch (e) {}
    return defaults();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(cols)); } catch (e) {} }
  function rerender() { renderHdr(); try { if (window.__wlRender) window.__wlRender(); } catch (e) {} }

  var css = document.createElement('style');
  css.textContent = [
    '#wlTableWrap .wl-header-row span.wl-hc{padding-right:0 !important;flex:1 1 0 !important;min-width:0;text-align:center;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#wlTableWrap .wl-header-row span.wl-hs{flex:1.4 !important;text-align:left !important;padding-right:0 !important}',
    '#wlTableWrap .wl-header-row .wl-hadd{display:inline-block;margin-left:4px;padding:0 5px;border:1px solid var(--border);border-radius:4px;cursor:pointer;color:var(--acc);font-size:11px;line-height:14px}',
    '.wl-row .col-cell{flex:1 1 0 !important;min-width:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;text-align:center;overflow:hidden;padding:0 2px !important}',
    '.wl-row .col-cell.dots-container{justify-content:center;gap:2px}',
    '.wl-row .col-cell.dots-container .trend-dot{flex:0 0 8px !important;width:8px !important;min-width:8px;height:8px;border-radius:50%}',
    '.wl-row .col-cell .sentiment-progress{width:100%;min-width:44px;font-size:9px}',
    '.wl-row .col-cell.change-val{justify-content:center}',
    '#iciWlColPop{position:fixed;z-index:3005;background:var(--surface,#fff);color:var(--txt,#0f172a);border:1px solid var(--border,#e2e8f0);border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.28);padding:10px;width:210px;font-family:Inter,sans-serif}',
    '#iciWlColPop select,#iciWlColPop input{width:100%;margin:3px 0 8px;padding:6px 8px;font-size:12px;border:1px solid var(--border,#e2e8f0);border-radius:6px;background:var(--pill-bg,#f1f5f9);color:var(--txt,#0f172a);box-sizing:border-box}',
    '#iciWlColPop .wlp-l{font-size:10px;font-weight:700;color:var(--muted,#64748b);text-transform:uppercase}',
    '#iciWlColPop .wlp-b{display:flex;gap:6px}',
    '#iciWlColPop button{flex:1;padding:6px 0;font-size:12px;font-weight:700;border-radius:6px;border:1px solid var(--border,#e2e8f0);background:var(--pill-bg,#f1f5f9);color:var(--txt,#0f172a);cursor:pointer}',
    '#iciWlColPop button.pri{background:var(--acc,#0062ff);color:#fff;border-color:var(--acc,#0062ff)}',
    '#iciWlColPop button.del{color:var(--red,#ef4444)}'
  ].join('\n');
  document.head.appendChild(css);

  function hdr() { return document.querySelector('#wlTableWrap .wl-header-row'); }
  function renderHdr() {
    var h = hdr(); if (!h) return;
    var T = types() || {};
    var s = '<span class="wl-hs">Symbol' + (cols.length < 4 ? ' <b class="wl-hadd" data-id="">+</b>' : '') + '</span>';
    cols.forEach(function (c) {
      var t = T[c.type];
      s += '<span class="wl-hc" data-id="' + esc(c.id) + '">' + esc(c.label || SHORT[c.type] || (t && t.label) || c.type) + '</span>';
    });
    h.innerHTML = s;
  }

  function closePop() { if (pop && pop.parentNode) pop.parentNode.removeChild(pop); pop = null; }
  function openPop(id, anchor) {
    closePop();
    var T = types(); if (!T) return;
    var col = null;
    for (var i = 0; i < cols.length; i++) if (cols[i].id === id) col = cols[i];
    pop = document.createElement('div');
    pop.id = 'iciWlColPop';
    var opts = Object.keys(T).map(function (k) { return '<option value="' + k + '"' + (col && col.type === k ? ' selected' : '') + '>' + esc(T[k].label) + '</option>'; }).join('');
    pop.innerHTML = '<div class="wlp-l">Column</div><select id="wlpType">' + opts + '</select>' +
      '<div class="wlp-l">Label (optional)</div><input id="wlpLabel" placeholder="auto" value="' + esc(col ? (col.label || '') : '') + '">' +
      '<div class="wlp-b"><button class="pri" id="wlpSave">Save</button>' + (col ? '<button class="del" id="wlpDel">Remove</button>' : '') + '<button id="wlpCancel">Cancel</button></div>';
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(6, Math.min(r.left, window.innerWidth - 220)) + 'px';
    pop.style.top = Math.min(r.bottom + 4, window.innerHeight - 190) + 'px';
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    document.getElementById('wlpCancel').onclick = closePop;
    document.getElementById('wlpSave').onclick = function () {
      var type = document.getElementById('wlpType').value;
      var label = document.getElementById('wlpLabel').value.trim();
      if (col) { col.type = type; col.label = label; if (T[type].kind === 'pct' && !col.style) col.style = 'colored'; }
      else cols.push({ id: 'w' + Date.now(), type: type, label: label, style: 'colored' });
      save(); closePop(); rerender();
    };
    var d = document.getElementById('wlpDel');
    if (d) d.onclick = function () { cols = cols.filter(function (c) { return c.id !== id; }); save(); closePop(); rerender(); };
  }
  document.addEventListener('click', closePop);

  window.__wlRowHtml = function (sym) {
    var s = '<div class="wl-row" data-sym="' + sym + '" onclick="openChartFromWatchlist(\'' + sym + '\')" style="cursor:pointer;"><span>' + sym + '</span>';
    cols.forEach(function (c) {
      try { s += renderColumnCell(sym, c); } catch (e) { s += '<div class="col-cell" style="color:var(--muted)">--</div>'; }
    });
    return s + '</div>';
  };

  cols = load();
  var h = hdr();
  if (h) {
    h.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('.wl-hc, .wl-hadd');
      if (!el) return;
      e.stopPropagation();
      openPop(el.getAttribute('data-id') || '', el);
    });
  }
  rerender();
})();
