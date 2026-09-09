const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const oldBtn = `<button class="dash-toggle-btn" id="dashToggleBtn" onclick="toggleDashboard()"><i class="fas fa-chevron-left"></i></button>`;
const newBtn = `<button class="dash-toggle-btn" id="dashToggleBtn"><i class="fas fa-chevron-left"></i></button>`;

const newJS = `<script>
(function(){
    var WIDTH_KEY = 'ici_dash_width';
    function getApp() { return document.getElementById('app'); }
    function updateHandlePosition() {
        var btn = document.getElementById('dashToggleBtn');
        var app = getApp();
        if (!btn || !app) return;
        var r = app.getBoundingClientRect();
        btn.style.left = r.right + 'px';
    }
    function loadWidth() {
        var app = getApp();
        if (!app) return;
        var saved = localStorage.getItem(WIDTH_KEY);
        if (saved) app.style.width = saved + 'px';
    }
    function saveWidth(px) { localStorage.setItem(WIDTH_KEY, String(px)); }
    function initHandle() {
        var btn = document.getElementById('dashToggleBtn');
        var app = getApp();
        if (!btn || !app) return;
        loadWidth();
        updateHandlePosition();
        window.addEventListener('resize', updateHandlePosition);
        var dragging = false, moved = false, startX = 0, startWidth = 0;
        btn.addEventListener('pointerdown', function(e) {
            dragging = true; moved = false;
            startX = e.clientX;
            startWidth = app.getBoundingClientRect().width;
            e.preventDefault();
        });
        document.addEventListener('pointermove', function(e) {
            if (!dragging) return;
            var dx = e.clientX - startX;
            if (Math.abs(dx) > 6) moved = true;
            if (moved) {
                var newWidth = startWidth + dx;
                var minW = 180, maxW = Math.round(window.innerWidth * 0.6);
                newWidth = Math.max(minW, Math.min(maxW, newWidth));
                app.style.width = newWidth + 'px';
                updateHandlePosition();
            }
        });
        document.addEventListener('pointerup', function() {
            if (!dragging) return;
            dragging = false;
            if (moved) {
                saveWidth(Math.round(app.getBoundingClientRect().width));
            } else if (typeof toggleDashboard === 'function') {
                toggleDashboard();
                setTimeout(updateHandlePosition, 0);
            }
        });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initHandle);
    else initHandle();
})();
<\/script>
`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  if (content.includes(oldBtn)) { content = content.split(oldBtn).join(newBtn); log.push('onclick removed OK'); }
  else log.push('WARNING: button pattern not found');

  const bodyCloseIdx = content.lastIndexOf('</body>');
  if (bodyCloseIdx === -1) {
    log.push('WARNING: </body> not found - JS NOT inserted');
  } else {
    content = content.slice(0, bodyCloseIdx) + newJS + content.slice(bodyCloseIdx);
    log.push('resize-handle JS inserted OK');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
