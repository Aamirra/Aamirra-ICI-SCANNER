const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const jsAnchor = `if (typeof getBellHtml !== 'function') window.getBellHtml = p=>'';`;

const newJS = `<script>
(function(){
    var POS_KEY = 'ici_dash_toggle_pos';
    function applyPos(top, left) {
        var btn = document.getElementById('dashToggleBtn');
        if (!btn) return;
        btn.style.top = top + 'px';
        btn.style.left = left + 'px';
        btn.style.transform = 'none';
    }
    function loadPos() {
        try {
            var raw = localStorage.getItem(POS_KEY);
            if (raw) {
                var p = JSON.parse(raw);
                applyPos(p.top, p.left);
            }
        } catch(e) {}
    }
    function savePos(top, left) {
        localStorage.setItem(POS_KEY, JSON.stringify({top: top, left: left}));
    }
    function initDrag() {
        var btn = document.getElementById('dashToggleBtn');
        if (!btn) return;
        loadPos();
        var dragging = false, moved = false, startX = 0, startY = 0, startTop = 0, startLeft = 0;
        btn.addEventListener('pointerdown', function(e) {
            dragging = true; moved = false;
            startX = e.clientX; startY = e.clientY;
            var r = btn.getBoundingClientRect();
            startTop = r.top; startLeft = r.left;
            e.preventDefault();
        });
        document.addEventListener('pointermove', function(e) {
            if (!dragging) return;
            var dx = e.clientX - startX, dy = e.clientY - startY;
            if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;
            if (moved) {
                var newTop = startTop + dy, newLeft = startLeft + dx;
                var maxTop = window.innerHeight - btn.offsetHeight;
                var maxLeft = window.innerWidth - btn.offsetWidth;
                newTop = Math.max(0, Math.min(maxTop, newTop));
                newLeft = Math.max(0, Math.min(maxLeft, newLeft));
                applyPos(newTop, newLeft);
            }
        });
        document.addEventListener('pointerup', function(e) {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                var r = btn.getBoundingClientRect();
                savePos(r.top, r.left);
            } else {
                toggleDashboard();
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDrag);
    else initDrag();
})();
<\/script>
if (typeof getBellHtml !== 'function') window.getBellHtml = p=>'';`;

const oldBtn = `<button class="dash-toggle-btn" id="dashToggleBtn" onclick="toggleDashboard()"><i class="fas fa-chevron-left"></i></button>`;
const newBtn = `<button class="dash-toggle-btn" id="dashToggleBtn"><i class="fas fa-chevron-left"></i></button>`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldBtn)) { content = content.split(oldBtn).join(newBtn); log.push('onclick removed from button OK'); }
  else log.push('WARNING: dash-toggle-btn pattern not found');

  if (content.includes(jsAnchor)) { content = content.replace(jsAnchor, newJS); log.push('drag JS inserted OK'); }
  else log.push('WARNING: JS anchor not found');

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
