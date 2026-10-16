// ICI Chart Alert Button — PC: hover => "+" ; Mobile: press&hold crosshair => "+" at line end, or tap chart => "+"; tap "+" => Alert dialog (price prefilled)
(function () {
    var _instances = {};
    (function () {
        if (document.getElementById('ici-al-z-fix')) return;
        var st = document.createElement('style');
        st.id = 'ici-al-z-fix';
        st.textContent = '.al-overlay{z-index:2000 !important}';
        document.head.appendChild(st);
    })();

    function destroy(slot) {
        var inst = _instances[slot];
        if (!inst) return;
        try {
            var c = inst.container;
            c.removeEventListener('mousemove', inst.onMove);
            c.removeEventListener('mouseleave', inst.onLeave);
            c.removeEventListener('mousedown', inst.onDown, true);
            c.removeEventListener('click', inst.onClick, true);
            c.removeEventListener('touchstart', inst.onTouchStart, true);
            c.removeEventListener('touchmove', inst.onTouchMove, true);
            c.removeEventListener('touchend', inst.onTouchEnd, true);
            c.removeEventListener('touchcancel', inst.onTouchEnd, true);
        } catch (e) {}
        try { if (inst.chart && inst.onChartClick) inst.chart.unsubscribeClick(inst.onChartClick); } catch (e) {}
        try { if (inst.chart && inst.onCrosshair) inst.chart.unsubscribeCrosshairMove(inst.onCrosshair); } catch (e) {}
        try { if (inst.clear) inst.clear(); } catch (e) {}
        if (inst.btn && inst.btn.parentNode) inst.btn.parentNode.removeChild(inst.btn);
        delete _instances[slot];
    }

    function attach(opts) {
        var chart = opts.chart, series = opts.series, container = opts.container,
            symbol = opts.symbol, slot = opts.slot;
        if (!chart || !series || !container) return;

        destroy(slot);

        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        var btn = document.createElement('div');
        btn.style.cssText = 'position:absolute;z-index:40;display:none;align-items:center;justify-content:flex-end;'
            + 'pointer-events:none;user-select:none;-webkit-user-select:none;touch-action:none;';
        btn.title = 'Set Alert';
        var box = document.createElement('div');
        box.textContent = '+';
        box.style.cssText = 'background:#131722;color:#fff;border:1px solid #434651;border-radius:4px;font-weight:700;cursor:pointer;'
            + 'display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);box-sizing:border-box;line-height:1;';
        btn.appendChild(box);
        container.appendChild(btn);

        var hideTimer = null;
        var lastPrice = null;
        var lastTouch = 0;
        var lastFire = 0;
        var touchActive = false;
        var crosshairOn = false;
        var tStart = null;

        function recentTouch(ms) { return Date.now() - lastTouch < ms; }
        function touchMode() { return touchActive || recentTouch(1500); }

        function getPrecision() {
            try {
                var opt = series.options();
                if (opt && opt.priceFormat && typeof opt.priceFormat.precision === 'number') return opt.priceFormat.precision;
            } catch (e) {}
            return 5;
        }

        function scaleWidth() {
            try { return chart.priceScale('right').width(); } catch (e) { return 56; }
        }

        function showBtn(y, touch) {
            var wrap = touch ? 44 : 22;
            var vis = touch ? 26 : 22;
            btn.style.width = wrap + 'px';
            btn.style.height = wrap + 'px';
            box.style.width = vis + 'px';
            box.style.height = vis + 'px';
            box.style.fontSize = (touch ? 18 : 16) + 'px';
            btn.style.pointerEvents = touch ? 'auto' : 'none';
            var w = scaleWidth();
            var left = container.clientWidth - w - wrap;
            btn.style.left = Math.max(0, left) + 'px';
            btn.style.top = Math.max(0, Math.min(y - wrap / 2, container.clientHeight - wrap)) + 'px';
            btn.style.display = 'flex';
        }

        function hideBtn() { btn.style.display = 'none'; }

        function openAlertForPrice() {
            if (lastPrice == null) return;
            var precision = getPrecision();
            var priceVal = parseFloat(lastPrice.toFixed(precision));

            if (typeof openAlertDialog !== 'function') return;
            openAlertDialog(symbol);

            var curPrice = null;
            try {
                if (window.MARKET_DATA && window.MARKET_DATA[symbol]) curPrice = window.MARKET_DATA[symbol].currentPrice;
            } catch (err) {}
            var cond = (curPrice != null && priceVal < curPrice) ? 'PRICE_BELOW_VAL' : 'PRICE_ABOVE_VAL';

            var condEl = document.getElementById('fCondition');
            var priceEl = document.getElementById('fTargetPrice');
            if (condEl) condEl.value = cond;
            if (typeof alOnConditionChange === 'function') alOnConditionChange();
            if (priceEl) priceEl.value = priceVal;
            if (typeof alUpdatePreview === 'function') alUpdatePreview();

            hideBtn();
        }

        function fire() {
            var now = Date.now();
            if (now - lastFire < 600) return;
            lastFire = now;
            openAlertForPrice();
        }

        // "+" button ke apne touch/click events (mobile tap seedha yahan aata hai)
        btn.addEventListener('touchstart', function (e) { e.stopPropagation(); e.preventDefault(); }, { passive: false });
        btn.addEventListener('touchend', function (e) { e.stopPropagation(); e.preventDefault(); fire(); }, { passive: false });
        btn.addEventListener('click', function (e) { e.stopPropagation(); fire(); });
        btn.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
        btn.addEventListener('mouseleave', function () { if (!touchMode()) hideTimer = setTimeout(hideBtn, 150); });

        // ---------- Mouse (PC) ----------
        function onMove(e) {
            if (touchMode()) return;
            var rect = container.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            clearTimeout(hideTimer);
            if (x >= 0 && x <= container.clientWidth && y >= 0 && y <= container.clientHeight) {
                var price = series.coordinateToPrice(y);
                if (price == null) { hideBtn(); return; }
                lastPrice = price;
                showBtn(y, false);
            } else {
                hideTimer = setTimeout(hideBtn, 150);
            }
        }

        function onLeave() {
            if (touchMode()) return;
            hideTimer = setTimeout(hideBtn, 150);
        }

        function inBtn(e) {
            if (btn.style.display === 'none') return false;
            var r = btn.getBoundingClientRect();
            return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        }
        function onDown(e) { if (recentTouch(800)) return; if (inBtn(e)) { e.stopPropagation(); e.preventDefault(); } }
        function onClick(e) { if (recentTouch(800)) return; if (inBtn(e)) { e.stopPropagation(); e.preventDefault(); fire(); } }

        // ---------- Touch (mobile) ----------
        function onTouchStart(e) {
            lastTouch = Date.now();
            touchActive = true;
            var t = e.touches && e.touches[0];
            tStart = t ? { x: t.clientX, y: t.clientY } : null;
        }
        function onTouchMove(e) {
            lastTouch = Date.now();
            if (crosshairOn || !tStart || btn.style.display === 'none') return;
            var t = e.touches && e.touches[0];
            if (t && (Math.abs(t.clientX - tStart.x) > 12 || Math.abs(t.clientY - tStart.y) > 12)) hideBtn();
        }
        function onTouchEnd() { lastTouch = Date.now(); touchActive = false; }

        // Press & hold: crosshair line ke saath "+" line ke end pe
        function onCrosshair(param) {
            if (!param || !param.point || param.point.x < 0 || param.point.y < 0) {
                crosshairOn = false;
                if (touchMode() && btn.style.display !== 'none') {
                    clearTimeout(hideTimer);
                    hideTimer = setTimeout(hideBtn, 6000);
                }
                return;
            }
            if (!touchMode()) return;
            var price = series.coordinateToPrice(param.point.y);
            if (price == null) return;
            crosshairOn = true;
            lastPrice = price;
            clearTimeout(hideTimer);
            showBtn(param.point.y, true);
            hideTimer = setTimeout(hideBtn, 15000);
        }

        // Tap: us jagah naya "+"
        function onChartClick(param) {
            if (!recentTouch(1000)) return;
            if (!param || !param.point) return;
            var py = param.point.y;
            var price = series.coordinateToPrice(py);
            if (price == null) { hideBtn(); return; }
            lastPrice = price;
            showBtn(py, true);
            clearTimeout(hideTimer);
            hideTimer = setTimeout(hideBtn, 6000);
        }

        container.addEventListener('mousedown', onDown, true);
        container.addEventListener('click', onClick, true);
        container.addEventListener('mousemove', onMove);
        container.addEventListener('mouseleave', onLeave);
        container.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
        container.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
        container.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
        container.addEventListener('touchcancel', onTouchEnd, { capture: true, passive: true });
        try { chart.subscribeClick(onChartClick); } catch (e) {}
        try { chart.subscribeCrosshairMove(onCrosshair); } catch (e) {}

        _instances[slot] = {
            container: container, chart: chart, btn: btn,
            onMove: onMove, onLeave: onLeave, onDown: onDown, onClick: onClick,
            onTouchStart: onTouchStart, onTouchMove: onTouchMove, onTouchEnd: onTouchEnd,
            onChartClick: onChartClick, onCrosshair: onCrosshair,
            clear: function () { clearTimeout(hideTimer); }
        };
    }

    window.ICIChartAlertButton = { attach: attach, destroy: destroy };
})();
