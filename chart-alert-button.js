// ICI Chart Alert Button — hover on right price scale => "+" appears => opens Alert dialog with price prefilled
(function () {
    var _instances = {};

    function destroy(slot) {
        var inst = _instances[slot];
        if (!inst) return;
        try {
            inst.container.removeEventListener('mousemove', inst.onMove);
            inst.container.removeEventListener('mouseleave', inst.onLeave);
        } catch (e) {}
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
        btn.textContent = '+';
        btn.style.cssText = 'position:absolute;z-index:40;width:22px;height:22px;line-height:20px;text-align:center;'
            + 'background:#2962ff;color:#fff;border-radius:4px;font-size:16px;font-weight:700;cursor:pointer;'
            + 'display:none;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.3);user-select:none;';
        btn.title = 'Set Alert';
        container.appendChild(btn);

        var hideTimer = null;
        var lastPrice = null;

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

        function showBtn(y) {
            var w = scaleWidth();
            var left = container.clientWidth - w - 26;
            btn.style.left = Math.max(0, left) + 'px';
            btn.style.top = (y - 11) + 'px';
            btn.style.display = 'flex';
        }

        function hideBtn() { btn.style.display = 'none'; }

        function onMove(e) {
            var rect = container.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var w = scaleWidth();
            var scaleStart = container.clientWidth - w;
            clearTimeout(hideTimer);
            if (x >= scaleStart - 8 && x <= container.clientWidth && y >= 0 && y <= container.clientHeight) {
                var price = series.coordinateToPrice(y);
                if (price == null) { hideBtn(); return; }
                lastPrice = price;
                showBtn(y);
            } else {
                hideTimer = setTimeout(hideBtn, 150);
            }
        }

        function onLeave() { hideTimer = setTimeout(hideBtn, 150); }

        btn.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
        btn.addEventListener('mouseleave', function () { hideTimer = setTimeout(hideBtn, 150); });

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
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
        });

        container.addEventListener('mousemove', onMove);
        container.addEventListener('mouseleave', onLeave);

        _instances[slot] = { container: container, btn: btn, onMove: onMove, onLeave: onLeave };
    }

    window.ICIChartAlertButton = { attach: attach, destroy: destroy };
})();
