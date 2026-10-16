(function () {
  'use strict';
  var path = location.pathname.toLowerCase();
  var PAGE = path.indexOf('crypto') > -1 ? 'crypto' : (path.indexOf('stocks') > -1 ? 'stocks' : 'forex');
  var CRYPTO_RE = /^(BTC|ETH|XRP|SOL|BNB|ADA|DOGE|DOT|LTC|AVAX|LINK|MATIC|POL|TRX|SHIB|TON|ATOM|NEAR|UNI|XLM|BCH|ETC|APT|ARB|SUI|PEPE|INJ|FIL|HBAR|ICP|AAVE|ALGO|FTM|SAND|MANA|AXS|GRT|EOS|XMR|DASH|ZEC|VET|THETA|RUNE|OP)(USD|USDT|USDC)?$/;

  function parts(ms, tz) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });
    var o = {};
    f.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = parseInt(p.value, 10); });
    if (o.hour === 24) o.hour = 0;
    return o;
  }
  function zoned(y, m, d, mins, tz) {
    var T = Date.UTC(y, m - 1, d, 0, mins), U = T;
    for (var i = 0; i < 2; i++) {
      var p = parts(U, tz);
      var wall = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      U = U - (wall - T);
    }
    return U;
  }

  function nthWeekday(y, m, wd, n) {
    var first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    return 1 + ((wd - first + 7) % 7) + (n - 1) * 7;
  }
  function lastWeekday(y, m, wd) {
    var last = new Date(Date.UTC(y, m, 0));
    return last.getUTCDate() - ((last.getUTCDay() - wd + 7) % 7);
  }
  function easter(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
      m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31),
      da = ((h + l - 7 * m + 114) % 31) + 1;
    return [mo, da];
  }
  function observed(y, m, d) {
    var wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (wd === 6) return [m, d - 1];
    if (wd === 0) return [m, d + 1];
    return [m, d];
  }
  var HCACHE = {};
  function usHolidays(y) {
    if (HCACHE[y]) return HCACHE[y];
    var H = {};
    function add(m, d) { H[m + '-' + d] = 1; }
    var ny = new Date(Date.UTC(y, 0, 1)).getUTCDay();
    if (ny === 0) add(1, 2); else if (ny !== 6) add(1, 1);
    add(1, nthWeekday(y, 1, 1, 3));
    add(2, nthWeekday(y, 2, 1, 3));
    var e = easter(y), gf = new Date(Date.UTC(y, e[0] - 1, e[1] - 2));
    add(gf.getUTCMonth() + 1, gf.getUTCDate());
    add(5, lastWeekday(y, 5, 1));
    var o = observed(y, 6, 19); add(o[0], o[1]);
    o = observed(y, 7, 4); add(o[0], o[1]);
    add(9, nthWeekday(y, 9, 1, 1));
    add(11, nthWeekday(y, 11, 4, 4));
    o = observed(y, 12, 25); add(o[0], o[1]);
    HCACHE[y] = H;
    return H;
  }
  function isUSHoliday(y, m, d) { return !!usHolidays(y)[m + '-' + d]; }
  function isEarly(y, m, d, wd) {
    if (m === 11 && wd === 5 && d === nthWeekday(y, 11, 4, 4) + 1) return true;
    if (m === 12 && d === 24 && wd >= 1 && wd <= 4) return true;
    if (m === 7 && d === 3 && wd >= 1 && wd <= 4) return true;
    return false;
  }

  var MARKETS = {
    forex: {
      name: 'Forex', tz: 'America/New_York', note: 'Sun 5pm NY to Fri 5pm NY',
      day: function (y, m, d, wd) {
        if (wd === 6) return [];
        if (wd === 0) return [[17 * 60, 1440]];
        if (wd === 5) return [[0, 17 * 60]];
        return [[0, 1440]];
      }
    },
    us: {
      name: 'US Stocks', tz: 'America/New_York', note: '9:30am-4:00pm NY, Mon-Fri',
      day: function (y, m, d, wd) {
        if (wd === 0 || wd === 6 || isUSHoliday(y, m, d)) return [];
        return [[9 * 60 + 30, isEarly(y, m, d, wd) ? 13 * 60 : 16 * 60]];
      }
    },
    psx: {
      name: 'PSX', tz: 'Asia/Karachi', note: 'Mon-Thu 9:32-15:30, Fri 9:17-12:00 & 14:32-16:30',
      day: function (y, m, d, wd) {
        if (wd >= 1 && wd <= 4) return [[9 * 60 + 32, 15 * 60 + 30]];
        if (wd === 5) return [[9 * 60 + 17, 12 * 60], [14 * 60 + 32, 16 * 60 + 30]];
        return [];
      }
    },
    crypto: { name: 'Crypto', always: true, note: '24/7' }
  };

  function currentList() {
    if (PAGE === 'crypto') return ['crypto'];
    if (PAGE === 'stocks') return ['us', 'psx'];
    var el = document.getElementById('chartPairName');
    var sym = el ? (el.textContent || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase() : '';
    if (sym && CRYPTO_RE.test(sym)) return ['crypto'];
    return ['forex'];
  }

  function intervals(mk, now) {
    var t = parts(now, mk.tz), out = [];
    for (var k = -1; k <= 10; k++) {
      var dt = new Date(Date.UTC(t.year, t.month - 1, t.day + k));
      var y = dt.getUTCFullYear(), m = dt.getUTCMonth() + 1, d = dt.getUTCDate(), wd = dt.getUTCDay();
      mk.day(y, m, d, wd).forEach(function (s) {
        var a = zoned(y, m, d, s[0], mk.tz), b = zoned(y, m, d, s[1], mk.tz), last = out[out.length - 1];
        if (last && last[1] === a) last[1] = b; else out.push([a, b]);
      });
    }
    return out;
  }
  function status(mk, now) {
    if (mk.always) return { open: true, always: true };
    var iv = intervals(mk, now), i;
    for (i = 0; i < iv.length; i++) if (now >= iv[i][0] && now < iv[i][1]) return { open: true, at: iv[i][1] };
    for (i = 0; i < iv.length; i++) if (iv[i][0] > now) return { open: false, at: iv[i][0] };
    return { open: false, at: null };
  }
  function fmt(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600),
      m = Math.floor(s % 3600 / 60), x = s % 60;
    return (d ? d + 'd ' : '') + (d || h ? h + 'h ' : '') + m + 'm ' + x + 's';
  }
  function pkt(ms) {
    return new Date(ms).toLocaleString('en-GB', { timeZone: 'Asia/Karachi', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) + ' PKT';
  }

  var css = document.createElement('style');
  css.textContent =
    '#ici-mkt-pill{display:inline-flex;align-items:center;justify-content:center;margin:0 6px 0 0;padding:4px;cursor:pointer;vertical-align:middle}' +
    '#ici-mkt-pill.float{position:fixed;top:8px;right:8px;z-index:9999;margin:0}' +
    '#ici-mkt-pill .dot{width:10px;height:10px;border-radius:50%;background:#787b86}' +
    '#ici-mkt-pill.open .dot{background:#26a69a;box-shadow:0 0 6px #26a69a}' +
    '#ici-mkt-pill.closed .dot{background:#ef5350;box-shadow:0 0 6px #ef5350}' +
    '#ici-mkt-pop{position:fixed;z-index:10000;min-width:230px;max-width:calc(100vw - 16px);padding:10px 12px;border-radius:8px;background:#ffffff;border:1px solid #e0e3eb;color:#131722;font:13px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.15);display:none}' +
    '#ici-mkt-pop .row{padding:6px 0;border-bottom:1px solid #e0e3eb}#ici-mkt-pop .row:last-child{border:0}' +
    '#ici-mkt-pop .t{font-weight:700}#ici-mkt-pop .o{color:#26a69a}#ici-mkt-pop .c{color:#ef5350}#ici-mkt-pop .s{color:#787b86;font-size:11px}';
  document.head.appendChild(css);

  var pill = document.createElement('div');
  pill.id = 'ici-mkt-pill';
  pill.innerHTML = '<span class="dot"></span>';
  var pop = document.createElement('div');
  pop.id = 'ici-mkt-pop';
  document.body.appendChild(pop);

  pill.addEventListener('click', function (e) {
    e.stopPropagation();
    if (pop.style.display === 'block') { pop.style.display = 'none'; return; }
    render();
    pop.style.display = 'block';
    var r = pill.getBoundingClientRect();
    pop.style.top = (r.bottom + 6) + 'px';
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
  });
  document.addEventListener('click', function () { pop.style.display = 'none'; });
  pop.addEventListener('click', function (e) { e.stopPropagation(); });

  function inject() {
    var el = document.getElementById('chartPairName');
    if (el) {
      if (pill.parentNode !== el || el.firstChild !== pill) { pill.classList.remove('float'); el.insertBefore(pill, el.firstChild); }
      if (!el._iciObs) {
        el._iciObs = new MutationObserver(function () { if (pill.parentNode !== el || el.firstChild !== pill) inject(); });
        el._iciObs.observe(el, { childList: true });
      }
      return;
    }
    var a = document.getElementById('countdownDisplay');
    if (a && a.parentNode) {
      if (pill.parentNode !== a.parentNode) { pill.classList.remove('float'); a.parentNode.insertBefore(pill, a.nextSibling); }
    } else if (!document.body.contains(pill)) {
      pill.classList.add('float'); document.body.appendChild(pill);
    }
  }

  function render() {
    inject();
    var now = Date.now(), anyOpen = false, html = '', names = [];
    currentList().forEach(function (key) {
      var mk = MARKETS[key], st = status(mk, now);
      if (st.open) anyOpen = true;
      names.push(mk.name + ': ' + (st.open ? 'Open' : 'Closed'));
      var line;
      if (st.always) line = '<span class="o">Open 24/7</span>';
      else if (st.open) line = '<span class="o">Open</span> - closes in: ' + fmt(st.at - now) + '<div class="s">' + pkt(st.at) + '</div>';
      else if (st.at) line = '<span class="c">Closed</span> - opens in: ' + fmt(st.at - now) + '<div class="s">' + pkt(st.at) + '</div>';
      else line = '<span class="c">Closed</span>';
      html += '<div class="row"><div class="t">' + mk.name + '</div>' + line + '<div class="s">' + mk.note + '</div></div>';
    });
    pill.classList.toggle('open', anyOpen);
    pill.classList.toggle('closed', !anyOpen);
    pill.title = names.join(' | ');
    pop.innerHTML = html;
  }

  render();
  setInterval(render, 1000);
})();
