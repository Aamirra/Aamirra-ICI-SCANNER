const fs = require('fs');
const file = 'drawing-tools.js';
const original = fs.readFileSync(file, 'utf8');
fs.writeFileSync(file + '.bak-longshort-v2', original);

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

// 1. Replace drawPosition with 3-point (entry/stop/target), no-border version
apply(
`  function drawPosition(st, d, dir) {
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
  }`,
`  function drawPosition(st, d, dir) {
    var a = ptToXY(st, d.p1);
    if (!a) return;
    var b = d.p2 ? ptToXY(st, d.p2) : st.mousePt;
    if (!b) return;

    var entryPrice = d.p1.price;
    var stopPrice = d.p2 ? d.p2.price : yToPrice(st, b.y);
    var risk = Math.abs(entryPrice - stopPrice);
    var targetPrice = d.p3 ? d.p3.price : (dir === 'long' ? entryPrice + risk * DEFAULT_RR : entryPrice - risk * DEFAULT_RR);

    var entryY = a.y;
    var stopY = priceToY(st, stopPrice);
    var targetY = priceToY(st, targetPrice);
    if (stopY == null || targetY == null) return;

    var x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    if (x1 - x0 < 2) x1 = x0 + 80;

    var ctx = st.ctx;
    var rewardTop = Math.min(entryY, targetY), rewardH = Math.abs(targetY - entryY);
    var riskTop = Math.min(entryY, stopY), riskH = Math.abs(stopY - entryY);

    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#089981';
    ctx.fillRect(x0, rewardTop, x1 - x0, rewardH);
    ctx.fillStyle = '#F23645';
    ctx.fillRect(x0, riskTop, x1 - x0, riskH);
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.save();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#089981';
    ctx.beginPath(); ctx.moveTo(x0, targetY); ctx.lineTo(x1, targetY); ctx.stroke();
    ctx.strokeStyle = '#F23645';
    ctx.beginPath(); ctx.moveTo(x0, stopY); ctx.lineTo(x1, stopY); ctx.stroke();
    ctx.strokeStyle = '#787b86';
    ctx.beginPath(); ctx.moveTo(x0, entryY); ctx.lineTo(x1, entryY); ctx.stroke();
    ctx.restore();

    var reward = Math.abs(targetPrice - entryPrice);
    var rr = risk ? (reward / risk) : 0;
    var riskPct = entryPrice ? (risk / entryPrice * 100) : 0;
    var rewardPct = entryPrice ? (reward / entryPrice * 100) : 0;

    ctx.save();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#089981';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Target ' + formatPrice(targetPrice) + '  (' + rewardPct.toFixed(2) + '%)', x0 + 4, targetY - 2);

    ctx.fillStyle = '#F23645';
    ctx.textBaseline = 'top';
    ctx.fillText('Stop ' + formatPrice(stopPrice) + '  (' + riskPct.toFixed(2) + '%)', x0 + 4, stopY + 2);

    ctx.fillStyle = '#d1d4dc';
    ctx.textBaseline = 'bottom';
    ctx.fillText((dir === 'long' ? 'Long ' : 'Short ') + 'Entry ' + formatPrice(entryPrice) + '   R:R 1:' + rr.toFixed(2), x0 + 4, entryY - 2);
    ctx.restore();
  }`,
  'drawPosition (no border, 3-point)'
);

// 2. Replace hit-testing to detect target/entry/stop LINES (draggable anywhere along the line)
apply(
`      case 'long': case 'short': {
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
      }`,
`      case 'long': case 'short': {
        var lp1 = ptToXY(st, d.p1);
        if (!lp1 || !d.p2) return null;
        var lp2xy = ptToXY(st, d.p2);
        if (!lp2xy) return null;
        var lx0 = Math.min(lp1.x, lp2xy.x), lx1 = Math.max(lp1.x, lp2xy.x);
        if (lx1 - lx0 < 2) lx1 = lx0 + 80;
        if (x < lx0 - HIT_PX || x > lx1 + HIT_PX) return null;

        var entryPriceH = d.p1.price, stopPriceH = d.p2.price;
        var riskH = Math.abs(entryPriceH - stopPriceH);
        var targetPriceH = d.p3 ? d.p3.price : (d.type === 'long' ? entryPriceH + riskH * DEFAULT_RR : entryPriceH - riskH * DEFAULT_RR);
        var yEntryH = priceToY(st, entryPriceH), yStopH = priceToY(st, stopPriceH), yTargetH = priceToY(st, targetPriceH);
        if (yEntryH == null || yStopH == null || yTargetH == null) return null;

        if (Math.abs(y - yTargetH) < HIT_PX) return 'p3';
        if (Math.abs(y - yStopH) < HIT_PX) return 'p2';
        if (Math.abs(y - yEntryH) < HIT_PX) return 'p1';

        var yMinH = Math.min(yEntryH, yStopH, yTargetH), yMaxH = Math.max(yEntryH, yStopH, yTargetH);
        return (y >= yMinH && y <= yMaxH) ? 'body' : null;
      }`,
  'hit-testing (line-based, target draggable)'
);

// 3. On second click: store target as a real point (d.p3) so it becomes independently draggable
apply(
`      } else if (tool.pts === 2) {
        if (!st.pending) {
          st.pending = { type: activeTool, p1: pt, color: PALETTE[currentColorIdx] };
        } else {
          st.pending.p2 = pt;
          st.drawings.push(st.pending);
          persistDrawing(slot, st.pending);
          st.pending = null;
          selectTool('cursor');
        }
        redraw(slot);
      } else if (tool.pts === -1) {`,
`      } else if (tool.pts === 2) {
        if (!st.pending) {
          st.pending = { type: activeTool, p1: pt, color: PALETTE[currentColorIdx] };
        } else {
          st.pending.p2 = pt;
          if (st.pending.type === 'long' || st.pending.type === 'short') {
            var riskI = Math.abs(st.pending.p1.price - st.pending.p2.price);
            var targetPriceI = st.pending.type === 'long' ? st.pending.p1.price + riskI * DEFAULT_RR : st.pending.p1.price - riskI * DEFAULT_RR;
            st.pending.p3 = { time: st.pending.p2.time, price: targetPriceI };
          }
          st.drawings.push(st.pending);
          persistDrawing(slot, st.pending);
          st.pending = null;
          selectTool('cursor');
        }
        redraw(slot);
      } else if (tool.pts === -1) {`,
  'onDown (create target point)'
);

// 4. Dragging: support moving the target line (p3), and shift p3 along with body drags
apply(
`        if (st.dragging.part === 'p1' && d.p1) { d.p1 = { time: curPt.time, price: curPt.price }; }
        else if (st.dragging.part === 'p2' && d.p2) { d.p2 = { time: curPt.time, price: curPt.price }; }
        else if (st.dragging.part === 'body') {
          if (d.points) {
            d.points = st.dragging.origPoints ? st.dragging.origPoints.map(function (p) {
              return { time: (typeof p.time === 'number' ? p.time + dt : p.time), price: p.price + dp };
            }) : d.points;
          } else {
            if (!st.dragging.origP1) { st.dragging.origP1 = d.p1; st.dragging.origP2 = d.p2; }
            if (d.p1) d.p1 = { time: (typeof st.dragging.origP1.time === 'number' ? st.dragging.origP1.time + dt : st.dragging.origP1.time), price: st.dragging.origP1.price + dp };
            if (d.p2) d.p2 = { time: (typeof st.dragging.origP2.time === 'number' ? st.dragging.origP2.time + dt : st.dragging.origP2.time), price: st.dragging.origP2.price + dp };
          }
        }
        if (d.points && !st.dragging.origPoints) st.dragging.origPoints = d.points.map(function (p) { return { time: p.time, price: p.price }; });`,
`        if (st.dragging.part === 'p1' && d.p1) { d.p1 = { time: curPt.time, price: curPt.price }; }
        else if (st.dragging.part === 'p2' && d.p2) { d.p2 = { time: curPt.time, price: curPt.price }; }
        else if (st.dragging.part === 'p3' && d.p3) { d.p3 = { time: d.p3.time, price: curPt.price }; }
        else if (st.dragging.part === 'body') {
          if (d.points) {
            d.points = st.dragging.origPoints ? st.dragging.origPoints.map(function (p) {
              return { time: (typeof p.time === 'number' ? p.time + dt : p.time), price: p.price + dp };
            }) : d.points;
          } else {
            if (!st.dragging.origP1) { st.dragging.origP1 = d.p1; st.dragging.origP2 = d.p2; st.dragging.origP3 = d.p3; }
            if (d.p1) d.p1 = { time: (typeof st.dragging.origP1.time === 'number' ? st.dragging.origP1.time + dt : st.dragging.origP1.time), price: st.dragging.origP1.price + dp };
            if (d.p2) d.p2 = { time: (typeof st.dragging.origP2.time === 'number' ? st.dragging.origP2.time + dt : st.dragging.origP2.time), price: st.dragging.origP2.price + dp };
            if (d.p3) d.p3 = { time: (typeof st.dragging.origP3.time === 'number' ? st.dragging.origP3.time + dt : st.dragging.origP3.time), price: st.dragging.origP3.price + dp };
          }
        }
        if (d.points && !st.dragging.origPoints) st.dragging.origPoints = d.points.map(function (p) { return { time: p.time, price: p.price }; });`,
  'onMove (target-line dragging)'
);

// 5. Skip circle handles for long/short (dragging works via the lines themselves, TradingView-style)
apply(
`  function drawHandles(st, d) {
    var ctx = st.ctx;
    var pts = [];
    if (d.p1) pts.push(d.p1);
    if (d.p2) pts.push(d.p2);
    ctx.save();`,
`  function drawHandles(st, d) {
    if (d.type === 'long' || d.type === 'short') return;
    var ctx = st.ctx;
    var pts = [];
    if (d.p1) pts.push(d.p1);
    if (d.p2) pts.push(d.p2);
    ctx.save();`,
  'drawHandles (skip for long/short)'
);

if (anyChanged) {
  fs.writeFileSync(file, src);
  console.log('✅ drawing-tools.js updated.');
} else {
  console.log('ℹ️  No changes made.');
}
