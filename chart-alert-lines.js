// ICI Chart Alert Lines — draggable price-alert lines synced with saved alerts, with center delete button
(function () {
    var _instances = {};

    function ensureStyle() {
        if (document.getElementById('ici-al-lines-style')) return;
        var style = document.createElement('style');
        style.id = 'ici-al-lines-style';
        style.textContent = `
.ici-al-line{position:absolute;left:0;height:0;border-top:1px dashed #f7931a;z-index:35;pointer-events:none}
.ici-al-hit{position:absolute;left:0;right:0;top:-5px;height:10px;cursor:ns-resize;pointer-events:auto}
.ici-al-pricebox{position:absolute;top:-10px;right:0;background:#f7931a;color:#131722;font-size:11px;font-weight:800;padding:2px 6px;border-radius:3px;white-space:nowrap;pointer-events:none}
.ici-al-centerbox{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #f7931a;color:#131722;font-size:11px;font-weight:700;padding:4px 8px;border-radius:5px;display:flex;align-items:center;gap:6px;white-space:nowrap;pointer-events:auto;box-shadow:0 1px 4px rgba(0,0,0,0.2);cursor:ns-resize}
.ici-al-x{background:none;border:none;color:#787b86;font-size:13px;font-weight:800;cursor:pointer;padding:0 0 0 2px;line-height:1}
.ici-al-x:hover{color:#ef5350}
`;
        document.head.appendChild(style);
    }

    function destroy(slot) {
        var inst = _instances[slot];
        if (!inst) return;
        cancelAnimationFrame(inst.raf);
        inst.lines.forEach(function (l) { if (l.el && l.el.parentNode) l.el.parentNode.removeChild(l.el); });
        document.removeEventListener('mousemove', inst.onDragMove);
        document.removeEventListener('mouseup', inst.onDragEnd);
        document.removeEventListener('touchmove', inst.onDragMoveTouch);
        document.removeEventListener('touchend', inst.onDragEnd);
        delete _instances[slot];
    }

    function attach(opts) {
        var chart = opts.chart, series = opts.series, container = opts.container,
            symbol = opts.symbol, slot = opts.slot;
        if (!chart || !series || !container) return;

        destroy(slot);
        ensureStyle();

        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }

        var inst = { lines: [], raf: null, lastKey: '', dragging: null };
        _instances[slot] = inst;

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

        function loadPriceAlerts() {
            if (typeof window.alLoadAlerts !== 'function') return [];
            try {
                return window.alLoadAlerts().filter(function (a) {
                    return a.active && a.pair === symbol && a.targetPrice != null &&
                        (a.condition === 'PRICE_ABOVE_VAL' || a.condition === 'PRICE_BELOW_VAL');
                });
            } catch (e) { return []; }
        }

        function fmt(price) {
            var p = getPrecision();
            return Number(price).toFixed(p);
        }

        function buildLine(alert) {
            var wrap = document.createElement('div');
            wrap.className = 'ici-al-line';

            var hit = document.createElement('div');
            hit.className = 'ici-al-hit';

            var priceBox = document.createElement('div');
            priceBox.className = 'ici-al-pricebox';

            var centerBox = document.createElement('div');
            centerBox.className = 'ici-al-centerbox';
            var label = document.createElement('span');
            var xBtn = document.createElement('button');
            xBtn.className = 'ici-al-x';
            xBtn.textContent = '\u2715';
            centerBox.appendChild(label);
            centerBox.appendChild(xBtn);

            wrap.appendChild(hit);
            wrap.appendChild(priceBox);
            wrap.appendChild(centerBox);
            container.appendChild(wrap);

            function refreshLabel(price) {
                priceBox.textContent = fmt(price);
                var dir = alert.condition === 'PRICE_ABOVE_VAL' ? 'Crossing Up' : 'Crossing Down';
                label.textContent = symbol + ' ' + dir + ' ' + fmt(price);
            }
            refreshLabel(alert.targetPrice);

            function startDrag(e) {
                e.preventDefault();
                e.stopPropagation();
                inst.dragging = { alert: alert, wrap: wrap, priceBox: priceBox, refreshLabel: refreshLabel };
                document.addEventListener('mousemove', inst.onDragMove);
                document.addEventListener('mouseup', inst.onDragEnd);
                document.addEventListener('touchmove', inst.onDragMoveTouch, { passive: false });
                document.addEventListener('touchend', inst.onDragEnd);
            }
            hit.addEventListener('mousedown', startDrag);
            centerBox.addEventListener('mousedown', startDrag);
            hit.addEventListener('touchstart', function (e) {
                if (e.touches && e.touches[0]) startDrag(e.touches[0]);
            }, { passive: false });

            xBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (typeof window.alLoadAlerts !== 'function' || typeof window.alSaveAlerts !== 'function') return;
                var all = window.alLoadAlerts().filter(function (a) { return a.id !== alert.id; });
                window.alSaveAlerts(all);
                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
                inst.lines = inst.lines.filter(function (l) { return l.alert.id !== alert.id; });
                if (typeof render === 'function') render();
            });

            return { alert: alert, el: wrap, priceBox: priceBox, refreshLabel: refreshLabel };
        }

        inst.onDragMove = function (e) { doDrag(e.clientY); };
        inst.onDragMoveTouch = function (e) {
            if (e.touches && e.touches[0]) { e.preventDefault(); doDrag(e.touches[0].clientY); }
        };
        function doDrag(clientY) {
            if (!inst.dragging) return;
            var rect = container.getBoundingClientRect();
            var y = clientY - rect.top;
            if (y < 0 || y > container.clientHeight) return;
            var price = series.coordinateToPrice(y);
            if (price == null) return;
            var precision = getPrecision();
            var rounded = parseFloat(price.toFixed(precision));
            inst.dragging.wrap.style.top = y + 'px';
            inst.dragging.refreshLabel(rounded);
            inst.dragging._newPrice = rounded;
        }
        inst.onDragEnd = function () {
            document.removeEventListener('mousemove', inst.onDragMove);
            document.removeEventListener('mouseup', inst.onDragEnd);
            document.removeEventListener('touchmove', inst.onDragMoveTouch);
            document.removeEventListener('touchend', inst.onDragEnd);
            if (inst.dragging && inst.dragging._newPrice != null) {
                var alertId = inst.dragging.alert.id;
                var newPrice = inst.dragging._newPrice;
                if (typeof window.alLoadAlerts === 'function' && typeof window.alSaveAlerts === 'function') {
                    var all = window.alLoadAlerts();
                    var idx = all.findIndex(function (a) { return a.id === alertId; });
                    if (idx !== -1) {
                        all[idx].targetPrice = newPrice;
                        window.alSaveAlerts(all);
                        inst.dragging.alert.targetPrice = newPrice;
                    }
                }
            }
            inst.dragging = null;
        };

        function syncLines() {
            var alerts = loadPriceAlerts();
            var key = alerts.map(function (a) { return a.id + ':' + a.targetPrice + ':' + a.condition; }).join('|');
            if (key !== inst.lastKey) {
                inst.lastKey = key;
                inst.lines.forEach(function (l) { if (l.el && l.el.parentNode) l.el.parentNode.removeChild(l.el); });
                inst.lines = alerts.map(buildLine);
            }
            var w = scaleWidth();
            inst.lines.forEach(function (l) {
                if (inst.dragging && inst.dragging.alert.id === l.alert.id) return;
                var y = series.priceToCoordinate(l.alert.targetPrice);
                if (y == null) { l.el.style.display = 'none'; return; }
                l.el.style.display = 'block';
                l.el.style.top = y + 'px';
                l.el.style.right = w + 'px';
            });
            inst.raf = requestAnimationFrame(syncLines);
        }
        syncLines();
    }

    window.ICIChartAlertLines = { attach: attach, destroy: destroy };
})();
