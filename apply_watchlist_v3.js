const fs = require('fs');

const targets = [
  { file: 'index.html', key: 'ici_wl_tabs' },
  { file: 'crypto.html', key: 'ici_crypto_wl_tabs' },
  { file: 'stocks.html', key: 'ici_stocks_wl_tabs' },
];

const htmlBlock = `    <style>
        .wl-widget { margin-bottom:8px; border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--surface); }
        .wl-tabs-row { display:flex; align-items:center; gap:4px; padding:4px 6px; border-bottom:1px solid var(--border); }
        .wl-tab { padding:2px 10px; font-size:11px; font-weight:700; border-radius:5px; background:var(--pill-bg); color:var(--txt); cursor:pointer; border:1px solid var(--border); }
        .wl-tab.active { background:var(--acc); color:#fff; border-color:var(--acc); }
        .wl-add-tab-btn { width:20px; height:20px; border-radius:5px; border:1px solid var(--border); background:var(--pill-bg); color:var(--txt); font-size:13px; font-weight:700; cursor:pointer; line-height:1; }
        .wl-table-wrap { overflow-y:auto; position:relative; height:140px; }
        .wl-table-wrap.wl-drop-target { outline:2px dashed var(--acc); outline-offset:-2px; background:rgba(0,98,255,0.08); }
        .wl-header-row { display:flex; padding:4px 8px; font-size:9px; font-weight:700; color:var(--muted); text-transform:uppercase; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--surface); }
        .wl-header-row span:nth-child(1){flex:1.4;} .wl-header-row span:nth-child(2){flex:1;text-align:right;} .wl-header-row span:nth-child(3){flex:1;text-align:right;padding-right:16px;}
        .wl-row { display:flex; align-items:center; padding:5px 8px; font-size:12px; border-bottom:1px solid var(--border); position:relative; }
        .wl-row span:nth-child(1){flex:1.4;font-weight:600;} .wl-row span:nth-child(2){flex:1;text-align:right;}
        .wl-chg{flex:1;text-align:right;padding-right:16px;font-weight:600;}
        .wl-chg.up{color:var(--green);} .wl-chg.down{color:var(--red);}
        .wl-row-remove { position:absolute; right:2px; top:50%; transform:translateY(-50%); color:var(--red); font-size:11px; cursor:pointer; padding:2px 6px; }
        .wl-empty-hint { padding:14px 8px; text-align:center; font-size:11px; color:var(--muted); }
        .wl-resize-handle { height:8px; cursor:ns-resize; display:flex; align-items:center; justify-content:center; background:var(--pill-bg); }
        .wl-resize-handle::after { content:''; width:30px; height:3px; border-radius:2px; background:var(--border); }
        .wl-dragging { opacity:0.4; }
    </style>
    <div class="wl-widget" id="wlWidget">
        <div class="wl-tabs-row">
            <div class="wl-tabs" id="wlTabs"></div>
            <button class="wl-add-tab-btn" onclick="wlAddTab()">+</button>
        </div>
        <div class="wl-table-wrap" id="wlTableWrap">
            <div class="wl-header-row"><span>Symbol</span><span>Last</span><span>Chg%</span></div>
            <div class="wl-rows" id="wlRows"></div>
        </div>
        <div class="wl-resize-handle" id="wlResizeHandle"></div>
    </div>
`;

function buildJS(wlKey) {
  return `<script>
(function(){
    var WL_KEY = '${wlKey}';
    var wlData = null;
    var suppressNextClick = false;

    function wlLoad() {
        try { wlData = JSON.parse(localStorage.getItem(WL_KEY)); } catch(e) { wlData = null; }
        if (!wlData || !wlData.tabs || !wlData.tabs.length) {
            wlData = { tabs: [{ id: 1, symbols: [] }], active: 1, height: 140 };
        }
    }
    function wlSave() { localStorage.setItem(WL_KEY, JSON.stringify(wlData)); }
    function wlGetActiveTab() {
        var t = wlData.tabs.filter(function(x){ return x.id === wlData.active; })[0];
        return t || wlData.tabs[0];
    }
    function wlRenderTabs() {
        var tabsEl = document.getElementById('wlTabs');
        if (!tabsEl) return;
        tabsEl.innerHTML = '';
        wlData.tabs.forEach(function(tab) {
            var btn = document.createElement('button');
            btn.className = 'wl-tab' + (tab.id === wlData.active ? ' active' : '');
            btn.textContent = tab.id;
            btn.onclick = function(){ wlData.active = tab.id; wlSave(); wlRenderTabs(); wlRenderRows(); };
            var pressTimer = null;
            btn.addEventListener('pointerdown', function(){
                pressTimer = setTimeout(function(){
                    if (wlData.tabs.length <= 1) { alert('At least one watchlist tab is required.'); return; }
                    if (confirm('Delete watchlist ' + tab.id + '?')) {
                        wlData.tabs = wlData.tabs.filter(function(x){ return x.id !== tab.id; });
                        if (wlData.active === tab.id) wlData.active = wlData.tabs[0].id;
                        wlSave(); wlRenderTabs(); wlRenderRows();
                    }
                }, 600);
            });
            btn.addEventListener('pointerup', function(){ clearTimeout(pressTimer); });
            btn.addEventListener('pointerleave', function(){ clearTimeout(pressTimer); });
            tabsEl.appendChild(btn);
        });
    }
    window.wlAddTab = function() {
        var maxId = 0;
        wlData.tabs.forEach(function(t){ if (t.id > maxId) maxId = t.id; });
        var newTab = { id: maxId + 1, symbols: [] };
        wlData.tabs.push(newTab);
        wlData.active = newTab.id;
        wlSave(); wlRenderTabs(); wlRenderRows();
    };
    window.wlRemoveSymbol = function(sym) {
        var tab = wlGetActiveTab();
        var idx = tab.symbols.indexOf(sym);
        if (idx > -1) { tab.symbols.splice(idx, 1); wlSave(); wlRenderTabs(); wlRenderRows(); }
    };
    function wlAddSymbol(sym) {
        var tab = wlGetActiveTab();
        if (tab.symbols.indexOf(sym) === -1) {
            tab.symbols.push(sym);
            wlSave(); wlRenderTabs(); wlRenderRows();
        }
    }
    function wlGetPriceChange(sym) {
        var m = (typeof MARKET_DATA !== 'undefined' && MARKET_DATA[sym]) || {};
        var lm = (typeof liveMarketData !== 'undefined' && liveMarketData[sym]) || {};
        var t = (typeof techMetrics !== 'undefined' && techMetrics[sym]) || {};
        var price = lm.price || lm.currentPrice || m.price || m.currentPrice || null;
        var chg = (t.longTermTrend != null) ? t.longTermTrend : (m.longTermTrend != null ? m.longTermTrend : null);
        return { price: price, chg: chg };
    }
    function wlRenderRows() {
        var tab = wlGetActiveTab();
        var rowsEl = document.getElementById('wlRows');
        if (!rowsEl) return;
        if (!tab || !tab.symbols.length) {
            rowsEl.innerHTML = '<div class="wl-empty-hint">Press &amp; hold a pair below, then drag up here to add</div>';
            return;
        }
        var html = '';
        tab.symbols.forEach(function(sym) {
            var pc = wlGetPriceChange(sym);
            var priceStr = pc.price != null ? Number(pc.price).toFixed(2) : '--';
            var chgStr = pc.chg != null ? (pc.chg > 0 ? '+' : '') + Number(pc.chg).toFixed(2) + '%' : '--';
            var chgCls = pc.chg != null ? (pc.chg >= 0 ? 'up' : 'down') : '';
            html += '<div class="wl-row"><span>' + sym + '</span><span>' + priceStr + '</span><span class="wl-chg ' + chgCls + '">' + chgStr + '</span><span class="wl-row-remove" onclick="wlRemoveSymbol(\\'' + sym + '\\')"><i class="fas fa-times"></i></span></div>';
        });
        rowsEl.innerHTML = html;
    }

    wlLoad();
    wlRenderTabs();
    wlRenderRows();
    setInterval(wlRenderRows, 3000);

    var wrap = document.getElementById('wlTableWrap');
    var handle = document.getElementById('wlResizeHandle');
    if (wrap) wrap.style.height = (wlData.height || 140) + 'px';
    var resizing = false, startY = 0, startH = 0;
    if (handle) {
        handle.addEventListener('pointerdown', function(e) { resizing = true; startY = e.clientY; startH = wrap.offsetHeight; e.preventDefault(); });
    }
    document.addEventListener('pointermove', function(e) {
        if (!resizing) return;
        var dy = e.clientY - startY;
        var newH = Math.max(60, Math.min(400, startH + dy));
        wrap.style.height = newH + 'px';
    });
    document.addEventListener('pointerup', function() {
        if (resizing) { resizing = false; wlData.height = wrap.offsetHeight; wlSave(); }
    });

    var dragSym = null, dragStartX = 0, dragStartY = 0, dragTimer = null, isDraggingWL = false;
    document.addEventListener('pointerdown', function(e) {
        var main = e.target.closest && e.target.closest('#pairsContainer .item-main');
        if (!main) return;
        var m = (main.getAttribute('onclick') || '').match(/openChartForPair\\\\('([^']+)'\\\\)/);
        if (!m) return;
        dragSym = m[1]; dragStartX = e.clientX; dragStartY = e.clientY; isDraggingWL = false;
        clearTimeout(dragTimer);
        dragTimer = setTimeout(function() {
            if (!dragSym) return;
            isDraggingWL = true;
            main.classList.add('wl-dragging');
        }, 320);
    });
    document.addEventListener('pointermove', function(e) {
        if (!dragSym) return;
        var dx = Math.abs(e.clientX - dragStartX), dy = Math.abs(e.clientY - dragStartY);
        if (!isDraggingWL && (dx > 12 || dy > 12)) { clearTimeout(dragTimer); dragSym = null; return; }
        if (isDraggingWL) {
            var w = document.getElementById('wlTableWrap');
            if (!w) return;
            var r = w.getBoundingClientRect();
            var over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
            w.classList.toggle('wl-drop-target', over);
        }
    }, { passive: true });
    document.addEventListener('pointerup', function(e) {
        clearTimeout(dragTimer);
        if (isDraggingWL && dragSym) {
            var w = document.getElementById('wlTableWrap');
            if (w) {
                var r = w.getBoundingClientRect();
                var over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
                w.classList.remove('wl-drop-target');
                if (over) wlAddSymbol(dragSym);
            }
            var dragging = document.querySelectorAll('.wl-dragging');
            for (var j = 0; j < dragging.length; j++) dragging[j].classList.remove('wl-dragging');
            suppressNextClick = true;
            setTimeout(function() { suppressNextClick = false; }, 50);
        }
        dragSym = null; isDraggingWL = false;
    });
    document.addEventListener('click', function(e) {
        if (suppressNextClick) {
            var main = e.target.closest && e.target.closest('#pairsContainer .item-main');
            if (main) { e.stopPropagation(); e.preventDefault(); }
        }
    }, true);
})();
<\/script>
`;
}

targets.forEach(({file, key}) => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  const htmlAnchorStr = '<div class="dir-slevel-bar"';
  const anchorIdx = content.indexOf(htmlAnchorStr);
  if (anchorIdx === -1) {
    log.push('WARNING: dir-slevel-bar anchor not found - HTML NOT inserted');
  } else {
    let insertAt = content.lastIndexOf('\n', anchorIdx) + 1;
    content = content.slice(0, insertAt) + htmlBlock + content.slice(insertAt);
    log.push('watchlist widget HTML inserted OK');
  }

  const bodyCloseIdx = content.lastIndexOf('</body>');
  if (bodyCloseIdx === -1) {
    log.push('WARNING: </body> not found - JS NOT inserted');
  } else {
    content = content.slice(0, bodyCloseIdx) + buildJS(key) + '\n' + content.slice(bodyCloseIdx);
    log.push('watchlist widget JS inserted OK (before </body>)');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
