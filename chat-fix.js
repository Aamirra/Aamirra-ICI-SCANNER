/* chat-fix.js - desktop: keep the open chat panel on screen (fixed to right edge) */
(function () {
  if (window.__chatFixLoaded) return;
  window.__chatFixLoaded = true;
  var st = document.createElement('style');
  st.textContent =
    'body:not(.is-mobile):not(.chat-hidden) #chatPanel{display:flex !important;position:fixed !important;top:0;right:0;bottom:0;height:100vh !important;z-index:1000 !important;box-shadow:-4px 0 14px rgba(0,0,0,.18);}';
  document.head.appendChild(st);
  /* keep the toggle handle next to the panel after open/close */
  function fixHandle() {
    var b = document.getElementById('chatToggleBtn'), p = document.getElementById('chatPanel');
    if (!b || !p || document.body.classList.contains('is-mobile')) return;
    if (document.body.classList.contains('chat-hidden')) { b.style.right = '0px'; return; }
    var r = p.getBoundingClientRect();
    if (r.width > 0) b.style.right = (window.innerWidth - r.left) + 'px';
  }
  new MutationObserver(function () { setTimeout(fixHandle, 0); })
    .observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', fixHandle);
})();
