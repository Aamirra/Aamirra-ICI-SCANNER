const fs = require('fs');
const MARK = 'PAIRS-FIT-FIX';
const block = `<style>
/* ${MARK} */
body.desktop-mode #pairsContainer { overflow-y:auto; overflow-x:hidden; overscroll-behavior:contain; scrollbar-width:none; -ms-overflow-style:none; }
body.desktop-mode #pairsContainer::-webkit-scrollbar { display:none; }
</style>
<script>
/* ${MARK} */
(function(){
  function fit(){
    var el = document.getElementById('pairsContainer');
    var box = document.querySelector('.phone-container');
    if (!el || !box || !document.body.classList.contains('desktop-mode')) { if (el) el.style.height=''; return; }
    var top = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
    var h = box.clientHeight - top - 8;
    if (h > 100) el.style.height = h + 'px';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  setInterval(fit, 500);
  fit();
})();
</script>
`;
for (const f of ['index.html', 'stocks.html', 'crypto.html']) {
  let s = fs.readFileSync(f, 'utf8');
  if (s.includes(MARK)) { console.log(f, 'already patched'); continue; }
  if (!s.includes('</body>')) { console.log(f, 'NO </body>, skipped'); continue; }
  fs.copyFileSync(f, f + '.bak-scrollfix3');
  s = s.replace('</body>', block + '</body>');
  fs.writeFileSync(f, s);
  console.log(f, 'patched');
}
