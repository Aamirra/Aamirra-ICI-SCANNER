const fs = require('fs');
const MARK = 'MOVE-MARKET-BTN';
const block = `<style>
/* ${MARK} */
.wl-tabs-row #marketDropdownWrap { margin-left:auto; flex-shrink:0; }
.wl-tabs-row #marketDropdownPanel { position:fixed; z-index:3002; }
</style>
<script>
/* ${MARK} */
(function(){
  var wrap = document.getElementById('marketDropdownWrap');
  var row = document.querySelector('.wl-tabs-row');
  if (wrap && row) row.appendChild(wrap);
  var orig = window.toggleMarketDropdown;
  if (typeof orig === 'function') {
    window.toggleMarketDropdown = function(e){
      orig.apply(this, arguments);
      var p = document.getElementById('marketDropdownPanel');
      var b = document.getElementById('marketDropdownBtn');
      if (p && b && p.classList.contains('open')) {
        var r = b.getBoundingClientRect();
        p.style.position = 'fixed';
        p.style.top = (r.bottom + 4) + 'px';
        p.style.left = 'auto';
        p.style.right = (window.innerWidth - r.right) + 'px';
      }
    };
  }
})();
</script>
`;
for (const f of ['index.html', 'stocks.html', 'crypto.html']) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes(MARK)) { console.log(f, 'already patched'); continue; }
  if (!s.includes('marketDropdownWrap')) { console.log(f, 'NO marketDropdownWrap, skipped'); continue; }
  if (!s.includes('</body>')) { console.log(f, 'NO </body>, skipped'); continue; }
  fs.copyFileSync(f, f + '.bak-moveBtn2');
  s = s.replace('</body>', block + '</body>');
  fs.writeFileSync(f, s);
  console.log(f, 'patched');
}
