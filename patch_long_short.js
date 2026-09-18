const fs = require('fs');
const file = 'drawing-tools.js';
const original = fs.readFileSync(file, 'utf8');
fs.writeFileSync(file + '.bak-longshort', original);

let src = original;
let anyChanged = false;

function apply(oldStr, newStr, label) {
  if (src.indexOf(newStr) !== -1) {
    console.log('ℹ️  ' + label + ': already applied, skipping.');
    return;
  }
  if (src.indexOf(oldStr) === -1) {
    console.log('⚠️  ' + label + ': anchor not found, skipped.');
    return;
  }
  src = src.replace(oldStr, newStr);
  anyChanged = true;
  console.log('✅ ' + label + ' applied.');
}

// 1. Add Long/Short to tool catalog
apply(
`    { id: 'brush',  name: 'Brush',            icon: 'fa-paintbrush',          pts: -1 }
  ];`,
`    { id: 'brush',  name: 'Brush',            icon: 'fa-paintbrush',          pts: -1 },
    { id: 'long',   name: 'Long Position',    icon: 'fa-arrow-up',            pts: 2 },
    { id: 'short',  name: 'Short Position',   icon: 'fa-arrow-down',          pts: 2 }
  ];`,
  'TOOLS catalog'
);

// 2. Default risk:reward ratio
apply(
`  var FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
  var PALETTE = ['#2962FF', '#F23645', '#089981', '#FF9800', '#9C27B0', '#00BCD4', '#FFFFFF', '#000000'];`,
`  var FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1, 1.272, 1.618];
  var PALETTE = ['#2962FF', '#F23645', '#089981', '#FF9800', '#9C27B0', '#00BCD4', '#FFFFFF', '#000000'];
  var DEFAULT_RR = 2;`,
  'DEFAULT_RR constant'
);

// 3. Dispatch in drawShape
apply(
`      case 'brush': drawBrush(st, d); break;
    }`,
`      case 'brush': drawBrush(st, d); break;
      case 'long': drawPosition(st, d, 'long'); break;
      case 'short': drawPosition(st, d, 'short'); break;
    }`,
  'drawShape dispatch'
);

// 4. drawPosition() function
apply(
`  function drawBrush(st, d) {
    var pts = (d.points || []).map(function (p) { return ptToXY(st, p); }).filter(Boolean);
    if (pts.length < 2) return;
    var ctx = st.ctx;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  function formatPrice(p) {`,
`  function drawBrush(st, d) {
    var pts = (d.points || []).map(function (p) { return ptToXY(st, p); }).filter(Boolean);
    if (pts.length < 2) return;
    var ctx = st.ctx;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }

  function drawPosition(st, d, dir) {
    var a = ptToXY(st, d.p1), b = d.p2 ? ptToXY(st, d.p2) : st.mousePt;
    if (!a || !b) return;
    var ctx = st.ctx;

    var entryPrice = d.p1.price;
    var stopPrice = d.p2 ? d.p2.price : yToPrice(st, b.y);
    var risk = Math.abs(entryPrice - stopPrice);
    var rr = d.rr || DEFAULT_RR;
    var targetPrice = dir === 'long' ? entryPrice + risk * rr : entryPrice - risk * rr;

    var entryY = a.y;
    var stopY = priceToY(st, stopPrice);
    var targetY = priceToY(st, targetPrice);
    if (stopY == null || targetY == null) return;

    var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    if (x1 - x0 < 2) x1 = x0 + 80;

    var rewardTop = Math.min(entryY, targetY), rewardH = Math.abs(targetY - entryY);
    var riskTop = Math.min(entryY, stopY), riskH = Math.abs(stopY - entryY);

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#089981';
    ctx.fillRect(x0, rewardTop, x1 - x0, rewardH);
    ctx.fillStyle = '#F23645';
    ctx.fillRect(x0, riskTop, x1 - x0, riskH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#089981';
    ctx.lineWidth = 1;
    ctx.strokeRect(x0, rewardTop, x1 - x0, rewardH);
    ctx.strokeStyle = '#F23645';
    ctx.strokeRect(x0, riskTop, x1 - x0, riskH);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#787b86';
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, entryY); ctx.lineTo(x1, entryY); ctx.stroke();
    ctx.restore();

    var riskPct = entryPrice ? (risk / entryPrice * 100) : 0;
    var rewardPct = entryPrice ? (Math.abs(targetPrice - entryPrice) / entryPrice * 100) : 0;

    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#089981';
    ctx.textBaseline = 'top';
    ctx.fillText('Target ' + formatPrice(targetPrice) + '  (' + rewardPct.toFixed(2) + '%)', x0 + 4, rewardTop + 3);

    ctx.fillStyle = '#F23645';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Stop ' + formatPrice(stopPrice) + '  (' + riskPct.toFixed(2) + '%)', x0 + 4, riskTop + riskH - 3);

    ctx.fillStyle = '#d1d4dc';
    ctx.textBaseline = 'middle';
    ctx.fillText((dir === 'long' ? 'Long ' : 'Short ') + 'Entry ' + formatPrice(entryPrice) + '   R:R 1:' + rr.toFixed(2), x0 + 4, entryY - 10);
    ctx.restore();
  }

  function formatPrice(p) {`,
  'drawPosition function'
);

// 5. Hit-testing for Long/Short
apply(
`      case 'rect': case 'fib': {
        var p1 = ptToXY(st, d.p1), p2 = ptToXY(st, d.p2);
        if (!p1 || !p2) return null;
        if (Math.hypot(x - p1.x, y - p1.y) < HIT_PX) return 'p1';
        if (Math.hypot(x - p2.x, y - p2.y) < HIT_PX) return 'p2';
        var rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y);
        var rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y);
        return (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) ? 'body' : null;
      }
      case 'text': {`,
`      case 'rect': case 'fib': {
        var p1 = ptToXY(st, d.p1), p2 = ptToXY(st, d.p2);
        if (!p1 || !p2) return null;
        if (Math.hypot(x - p1.x, y - p1.y) < HIT_PX) return 'p1';
        if (Math.hypot(x - p2.x, y - p2.y) < HIT_PX) return 'p2';
        var rx = Math.min(p1.x, p2.x), ry = Math.min(p1.y, p2.y);
        var rw = Math.abs(p2.x - p1.x), rh = Math.abs(p2.y - p1.y);
        return (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) ? 'body' : null;
      }
      case 'long': case 'short': {
        var lp1 = ptToXY(st, d.p1), lp2 = ptToXY(st, d.p2);
        if (!lp1 || !lp2) return null;
        if (Math.hypot(x - lp1.x, y - lp1.y) < HIT_PX) return 'p1';
        if (Math.hypot(x - lp2.x, y - lp2.y) < HIT_PX) return 'p2';
        var lx0 = Math.min(lp1.x, lp2.x), lx1 = Math.max(lp1.x, lp2.x);
        var entryPriceH = d.p1.price, stopPriceH = d.p2.price;
        var riskH = Math.abs(entryPriceH - stopPriceH);
        var rrH = d.rr || DEFAULT_RR;
        var targetPriceH = d.type === 'long' ? entryPriceH + riskH * rrH : entryPriceH - riskH * rrH;
        var yEntryH = priceToY(st, entryPriceH), yStopH = priceToY(st, stopPriceH), yTargetH = priceToY(st, targetPriceH);
        if (yEntryH == null || yStopH == null || yTargetH == null) return null;
        var yMinH = Math.min(yEntryH, yStopH, yTargetH), yMaxH = Math.max(yEntryH, yStopH, yTargetH);
        return (x >= lx0 && x <= lx1 && y >= yMinH && y <= yMaxH) ? 'body' : null;
      }
      case 'text': {`,
  'hit-testing'
);

if (anyChanged) {
  fs.writeFileSync(file, src);
  console.log('✅ drawing-tools.js updated.');
} else {
  console.log('ℹ️  No changes made.');
}
