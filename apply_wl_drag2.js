const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

// 1. CSS: remove red-x rule, add ghost/menu/generic-droptarget CSS, make drop-target generic
const oldCSS1 = `        .wl-row-remove { position:absolute; right:2px; top:50%; transform:translateY(-50%); color:var(--red); font-size:11px; cursor:pointer; padding:2px 6px; }`;
const newCSS1 = ``;

const oldCSS2 = `        .wl-table-wrap.wl-drop-target { outline:2px dashed var(--acc); outline-offset:-2px; background:rgba(0,98,255,0.08); }`;
const newCSS2 = `        .wl-drop-target { outline:2px dashed var(--acc) !important; outline-offset:-2px; background:rgba(0,98,255,0.08); }`;

const oldCSS3 = `        .wl-dragging { opacity:0.4; }`;
const newCSS3 = `        .wl-dragging { opacity:0.4; }
        .wl-drag-ghost { position:fixed; pointer-events:none; z-index:3000; background:var(--acc); color:#fff; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.3); transform:translate(-50%,-50%); }
        .wl-context-menu { position:fixed; z-index:3001; background:var(--surface); border:1px solid var(--border); border-radius:6px; box-shadow:0 4px 16px rgba(0,0,0,0.25); overflow:hidden; min-width:120px; }
        .wl-context-menu-item { padding:8px 14px; font-size:12px; font-weight:600; color:var(--red); cursor:pointer; }
        .wl-context-menu-item:hover { background:var(--pill-bg); }`;

// 2. Row template: remove red-x span, add data-sym attribute
const oldRow = `html += '<div class="wl-row"><span>' + sym + '</span><span>' + priceStr + '</span><span class="wl-chg ' + chgCls + '">' + chgStr + '</span><span class="wl-row-remove" onclick="wlRemoveSymbol(\\'' + sym + '\\')"><i class="fas fa-times"></i></span></div>';`;
const newRow = `html += '<div class="wl-row" data-sym="' + sym + '"><span>' + sym + '</span><span>' + priceStr + '</span><span class="wl-chg ' + chgCls + '">' + chgStr + '</span></div>';`;

// 3. Full drag block replace (start anchor to end anchor)
const startAnchor = `var dragSym = null, dragStartX = 0, dragStartY = 0, dragTimer = null, isDraggingWL = false;`;
const endAnchor = `})();
</script>`;

const newDragBlock = `var dragSym = null, dragSource = null, dragStartX = 0, dragStartY = 0, dragTimer = null, isDraggingWL = false, ghostEl = null;
    var wlContextMenuEl = null;
    function wlCreateGhost(text) {
        var g = document.createElement('div');
        g.className = 'wl-drag-ghost';
        g.textContent = text;
        document.body.appendChild(g);
        return g;
    }
    function wlMoveGhost(x, y) { if (ghostEl) { ghostEl.style.left = x + 'px'; ghostEl.style.top = y + 'px'; } }
    function wlRemoveGhost() { if (ghostEl) { ghostEl.remove(); ghostEl = null; } }
    function wlCloseContextMenu() { if (wlContextMenuEl) { wlContextMenuEl.remove(); wlContextMenuEl = null; } }
    document.addEventListener('click', function() { wlCloseContextMenu(); });
    document.addEventListener('contextmenu', function(e) {
        var row = e.target.closest && e.target.closest('.wl-row');
        if (!row) return;
        e.preventDefault();
        wlCloseContextMenu();
        var sym = row.getAttribute('data-sym');
        var menu = document.createElement('div');
        menu.className = 'wl-context-menu';
        menu.style.left = e.clientX + 'px';
        menu.style.top = e.clientY + 'px';
        var item = document.createElement('div');
        item.className = 'wl-context-menu-item';
        item.textContent = 'Delete';
        item.onclick = function(ev) { ev.stopPropagation(); wlRemoveSymbol(sym); wlCloseContextMenu(); };
        menu.appendChild(item);
        document.body.appendChild(menu);
        wlContextMenuEl = menu;
    });
    document.addEventListener('pointerdown', function(e) {
        var main = e.target.closest && e.target.closest('#pairsContainer .item-main');
        var wlRow = e.target.closest && e.target.closest('.wl-row');
        if (main) {
            var m = (main.getAttribute('onclick') || '').match(/openChartForPair\\('([^']+)'\\)/);
            if (!m) return;
            dragSym = m[1]; dragSource = 'screener';
        } else if (wlRow) {
            dragSym = wlRow.getAttribute('data-sym'); dragSource = 'watchlist';
        } else {
            return;
        }
        dragStartX = e.clientX; dragStartY = e.clientY; isDraggingWL = false;
        clearTimeout(dragTimer);
        dragTimer = setTimeout(function() {
            if (!dragSym) return;
            isDraggingWL = true;
            if (main) main.classList.add('wl-dragging');
            if (wlRow) wlRow.classList.add('wl-dragging');
            ghostEl = wlCreateGhost(dragSym);
            wlMoveGhost(e.clientX, e.clientY);
        }, 100);
    });
    document.addEventListener('pointermove', function(e) {
        if (!dragSym) return;
        var dx = Math.abs(e.clientX - dragStartX), dy = Math.abs(e.clientY - dragStartY);
        if (!isDraggingWL && (dx > 12 || dy > 12)) { clearTimeout(dragTimer); dragSym = null; dragSource = null; return; }
        if (isDraggingWL) {
            wlMoveGhost(e.clientX, e.clientY);
            if (dragSource === 'screener') {
                var w = document.getElementById('wlTableWrap');
                if (w) {
                    var r = w.getBoundingClientRect();
                    var over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
                    w.classList.toggle('wl-drop-target', over);
                }
            } else if (dragSource === 'watchlist') {
                var chartEl = document.getElementById('chartOverlay');
                if (chartEl) {
                    var r2 = chartEl.getBoundingClientRect();
                    var visible = chartEl.offsetParent !== null;
                    var over2 = visible && e.clientX >= r2.left && e.clientX <= r2.right && e.clientY >= r2.top && e.clientY <= r2.bottom;
                    chartEl.classList.toggle('wl-drop-target', over2);
                }
            }
        }
    }, { passive: true });
    document.addEventListener('pointerup', function(e) {
        clearTimeout(dragTimer);
        if (isDraggingWL && dragSym) {
            if (dragSource === 'screener') {
                var w = document.getElementById('wlTableWrap');
                if (w) {
                    var r = w.getBoundingClientRect();
                    var over = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
                    w.classList.remove('wl-drop-target');
                    if (over) wlAddSymbol(dragSym);
                }
            } else if (dragSource === 'watchlist') {
                var chartEl = document.getElementById('chartOverlay');
                if (chartEl) {
                    var r2 = chartEl.getBoundingClientRect();
                    var visible = chartEl.offsetParent !== null;
                    var over2 = visible && e.clientX >= r2.left && e.clientX <= r2.right && e.clientY >= r2.top && e.clientY <= r2.bottom;
                    chartEl.classList.remove('wl-drop-target');
                    if (over2) wlRemoveSymbol(dragSym);
                }
            }
            var dragging = document.querySelectorAll('.wl-dragging');
            for (var j = 0; j < dragging.length; j++) dragging[j].classList.remove('wl-dragging');
            wlRemoveGhost();
            suppressNextClick = true;
            setTimeout(function() { suppressNextClick = false; }, 50);
        }
        dragSym = null; dragSource = null; isDraggingWL = false;
    });
    document.addEventListener('click', function(e) {
        if (suppressNextClick) {
            var main = e.target.closest && e.target.closest('#pairsContainer .item-main');
            if (main) { e.stopPropagation(); e.preventDefault(); }
        }
    }, true);
})();
</script>`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldCSS1)) { content = content.split(oldCSS1).join(newCSS1); log.push('red-x CSS removed OK'); }
  else log.push('WARNING: red-x CSS not found');

  if (content.includes(oldCSS2)) { content = content.split(oldCSS2).join(newCSS2); log.push('drop-target CSS made generic OK'); }
  else log.push('WARNING: drop-target CSS not found');

  if (content.includes(oldCSS3)) { content = content.split(oldCSS3).join(newCSS3); log.push('ghost/menu CSS added OK'); }
  else log.push('WARNING: wl-dragging CSS anchor not found');

  if (content.includes(oldRow)) { content = content.split(oldRow).join(newRow); log.push('row template updated OK'); }
  else log.push('WARNING: row template pattern not found');

  const startIdx = content.indexOf(startAnchor);
  if (startIdx === -1) {
    log.push('WARNING: drag block start anchor not found');
  } else {
    const endIdx = content.indexOf(endAnchor, startIdx);
    if (endIdx === -1) {
      log.push('WARNING: drag block end anchor not found');
    } else {
      const fullEnd = endIdx + endAnchor.length;
      content = content.slice(0, startIdx) + newDragBlock + content.slice(fullEnd);
      log.push('drag block replaced OK (ghost + context menu + chart-drop-delete)');
    }
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
