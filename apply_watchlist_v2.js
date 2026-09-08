const fs = require('fs');

const targets = [
  { file: 'index.html', key: 'ici_watchlists' },
  { file: 'crypto.html', key: 'ici_crypto_watchlists' },
  { file: 'stocks.html', key: 'ici_stocks_watchlists' },
];

const htmlBlock = `    <style>
        .watchlist-bar { display:flex; align-items:center; gap:6px; margin-bottom:6px; padding:4px 6px; border-radius:8px; transition:background 0.15s,outline 0.15s; flex-wrap:wrap; }
        .wl-new-btn, .wl-del-btn { padding:3px 8px; font-size:12px; font-weight:600; border:1px solid var(--border); background:var(--pill-bg); border-radius:6px; cursor:pointer; color:var(--txt); }
        .wl-del-btn { color:var(--red); }
        .watchlist-bar.drag-target { outline:2px dashed var(--acc); outline-offset:2px; background:rgba(0,98,255,0.08); }
        .wl-dragging { opacity:0.4; }
        .watchlist-hint { font-size:10px; color:var(--muted); margin:0 0 6px 2px; }
    </style>
    <div class="watchlist-bar" id="watchlistBar">
        <span style="font-size:11px;font-weight:600;color:var(--muted);">Watchlist:</span>
        <select class="layout-select" id="watchlistSelect" onchange="onWatchlistChange(this.value)">
            <option value="__all__">All Pairs</option>
        </select>
        <button class="wl-new-btn" onclick="createNewWatchlist()"><i class="fas fa-plus"></i> New</button>
        <button class="wl-del-btn" id="wlDeleteBtn" onclick="deleteCurrentWatchlist()" style="display:none;"><i class="fas fa-trash"></i></button>
    </div>
    <div class="watchlist-hint">Press &amp; hold a pair, then drag up here to add</div>
`;

function buildJS(wlKey) {
  return `<script>
(function(){
    var WL_KEY = '${wlKey}';
    var watchlists = {};
    var activeWatchlist = '__all__';
    function loadWatchlists() {
        try { watchlists = JSON.parse(localStorage.getItem(WL_KEY)) || {}; } catch(e) { watchlists = {}; }
        renderWatchlistOptions();
    }
    function saveWatchlists() { localStorage.setItem(WL_KEY, JSON.stringify(watchlists)); }
    function renderWatchlistOptions() {
        var sel = document.getElementById('watchlistSelect');
        if (!sel) return;
        var keep = watchlists[activeWatchlist] ? activeWatchlist : '__all__';
        var opts = '<option value="__all__">All Pairs</option>';
        Object.keys(watchlists).forEach(function(name){
            opts += '<option value="'+name.replace(/"/g,'&quot;')+'">'+name+' ('+watchlists[name].length+')</option>';
        });
        sel.innerHTML = opts;
        sel.value = keep;
        activeWatchlist = keep;
        var delBtn = document.getElementById('wlDeleteBtn');
        if (delBtn) delBtn.style.display = activeWatchlist === '__all__' ? 'none' : 'inline-block';
    }
    window.onWatchlistChange = function(name) {
        activeWatchlist = name;
        var delBtn = document.getElementById('wlDeleteBtn');
        if (delBtn) delBtn.style.display = activeWatchlist === '__all__' ? 'none' : 'inline-block';
        if (typeof render === 'function') render();
    };
    window.createNewWatchlist = function() {
        var name = prompt('New watchlist name:');
        if (!name) return;
        var trimmed = name.trim();
        if (!trimmed) return;
        if (!watchlists[trimmed]) watchlists[trimmed] = [];
        saveWatchlists();
        activeWatchlist = trimmed;
        renderWatchlistOptions();
        if (typeof render === 'function') render();
    };
    window.deleteCurrentWatchlist = function() {
        if (activeWatchlist === '__all__') return;
        if (!confirm('Delete watchlist "' + activeWatchlist + '"?')) return;
        delete watchlists[activeWatchlist];
        saveWatchlists();
        activeWatchlist = '__all__';
        renderWatchlistOptions();
        if (typeof render === 'function') render();
    };
    function addSymbolToActiveWatchlist(sym) {
        if (activeWatchlist === '__all__') { alert('Select or create a watchlist first.'); return; }
        if (!watchlists[activeWatchlist]) watchlists[activeWatchlist] = [];
        if (watchlists[activeWatchlist].indexOf(sym) === -1) {
            watchlists[activeWatchlist].push(sym);
            saveWatchlists();
            renderWatchlistOptions();
        }
    }
    function applyWatchlistFilter() {
        if (activeWatchlist === '__all__') return;
        var allowed = {};
        (watchlists[activeWatchlist] || []).forEach(function(s){ allowed[s] = true; });
        var visibleSyms = [];
        var rows = document.querySelectorAll('#pairsContainer .item-row');
        for (var i=0; i<rows.length; i++) {
            var row = rows[i];
            var main = row.querySelector('.item-main');
            var onclickAttr = main ? (main.getAttribute('onclick')||'') : '';
            var m = onclickAttr.match(/openChartForPair\\('([^']+)'\\)/);
            var sym = m ? m[1] : null;
            var show = sym && allowed[sym];
            row.style.display = show ? '' : 'none';
            if (show) visibleSyms.push(sym);
        }
        if (typeof currentDisplayPairs !== 'undefined') currentDisplayPairs = visibleSyms;
        if (typeof chartPairs !== 'undefined') chartPairs = visibleSyms.slice();
    }
    var _wlInterval = setInterval(function(){
        if (typeof render === 'function') {
            clearInterval(_wlInterval);
            var _origRender = render;
            render = function() { _origRender(); applyWatchlistFilter(); };
        }
    }, 100);
    var dragSym = null, dragStartX = 0, dragStartY = 0, dragTimer = null, isDraggingWL = false, suppressNextClick = false;
    document.addEventListener('pointerdown', function(e) {
        var main = e.target.closest && e.target.closest('#pairsContainer .item-main');
        if (!main) return;
        var m = (main.getAttribute('onclick')||'').match(/openChartForPair\\('([^']+)'\\)/);
        if (!m) return;
        dragSym = m[1];
        dragStartX = e.clientX; dragStartY = e.clientY;
        isDraggingWL = false;
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
            var bar = document.getElementById('watchlistBar');
            if (!bar) return;
            var r = bar.getBoundingClientRect();
            var over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
            bar.classList.toggle('drag-target', over);
        }
    }, {passive:true});
    document.addEventListener('pointerup', function(e) {
        clearTimeout(dragTimer);
        if (isDraggingWL && dragSym) {
            var bar = document.getElementById('watchlistBar');
            if (bar) {
                var r = bar.getBoundingClientRect();
                var over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
                bar.classList.remove('drag-target');
                if (over) addSymbolToActiveWatchlist(dragSym);
            }
            var dragging = document.querySelectorAll('.wl-dragging');
            for (var j=0;j<dragging.length;j++) dragging[j].classList.remove('wl-dragging');
            suppressNextClick = true;
            setTimeout(function(){ suppressNextClick = false; }, 50);
        }
        dragSym = null; isDraggingWL = false;
    });
    document.addEventListener('click', function(e) {
        if (suppressNextClick) {
            var main = e.target.closest && e.target.closest('#pairsContainer .item-main');
            if (main) { e.stopPropagation(); e.preventDefault(); }
        }
    }, true);
    loadWatchlists();
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
    log.push('watchlist HTML inserted OK');
  }

  const bodyCloseIdx = content.lastIndexOf('</body>');
  if (bodyCloseIdx === -1) {
    log.push('WARNING: </body> not found - JS NOT inserted');
  } else {
    content = content.slice(0, bodyCloseIdx) + buildJS(key) + '\n' + content.slice(bodyCloseIdx);
    log.push('watchlist JS inserted OK (before </body>)');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
