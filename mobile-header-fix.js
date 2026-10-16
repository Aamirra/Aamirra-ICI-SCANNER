(function () {
  'use strict';
  if (window.__iciMobHdrFix) return;
  window.__iciMobHdrFix = 1;
  var st = document.createElement('style');
  st.textContent =
    'body.is-mobile.ici-chart-open #alertDropdownWrap{display:none !important}' +
    'body.is-mobile #chartOverlay .chart-interval-selector{order:99 !important;flex:0 0 100% !important;width:100% !important;flex-wrap:wrap !important;justify-content:center !important}' +
    'body.is-mobile #chartOverlay .ici-hdr-row{justify-content:center !important}' +
    'body.is-mobile #chartOverlay .ici-hdr-row > *{margin-left:0 !important}' +
    'body.is-mobile #chartOverlay #chartPairName{order:50 !important;flex:0 0 auto !important;width:auto !important;max-width:none !important;margin:0 6px !important;white-space:nowrap}';
  document.head.appendChild(st);
  var ov = document.getElementById('chartOverlay');
  if (!ov) return;
  function tag() {
    var sel = ov.querySelector('.chart-interval-selector');
    if (sel && sel.parentNode && !sel.parentNode.classList.contains('ici-hdr-row')) sel.parentNode.classList.add('ici-hdr-row');
  }
  function sync() {
    var open = getComputedStyle(ov).display !== 'none';
    document.body.classList.toggle('ici-chart-open', open);
    tag();
  }
  new MutationObserver(sync).observe(ov, { attributes: true, attributeFilter: ['style', 'class'] });
  tag();
  sync();
})();
