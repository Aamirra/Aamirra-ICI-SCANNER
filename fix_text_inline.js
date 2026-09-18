const fs = require('fs');
const file = 'drawing-tools.js';
let js = fs.readFileSync(file, 'utf8');
let changes = 0;

// 1. add showInlineTextInput helper right after mouseXY
const A_OLD = `  function mouseXY(st, e) {
    var rect = st.container.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }`;
const A_NEW = A_OLD + `

  function showInlineTextInput(st, xy, initialValue, onDone) {
    var input = document.createElement('input');
    input.type = 'text';
    input.value = initialValue || '';
    input.style.position = 'absolute';
    input.style.left = xy.x + 'px';
    input.style.top = xy.y + 'px';
    input.style.font = '13px sans-serif';
    input.style.padding = '2px 5px';
    input.style.border = '1px solid #2962FF';
    input.style.borderRadius = '3px';
    input.style.background = 'rgba(255,255,255,0.97)';
    input.style.color = '#111';
    input.style.zIndex = '55';
    input.style.minWidth = '90px';
    input.style.outline = 'none';
    st.container.appendChild(input);
    input.focus();

    var done = false;
    function finish(commit) {
      if (done) return;
      done = true;
      var val = input.value;
      if (input.parentNode) input.parentNode.removeChild(input);
      onDone(commit ? val : null);
    }
    input.addEventListener('keydown', function (e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', function () { finish(true); });
    input.addEventListener('mousedown', function (e) { e.stopPropagation(); });
    input.addEventListener('click', function (e) { e.stopPropagation(); });
  }`;
if (!js.includes('function showInlineTextInput')) {
  if (js.includes(A_OLD)) { js = js.replace(A_OLD, A_NEW); changes++; }
  else console.log('⚠️  anchor A not found');
}

// 2. replace window.prompt on create
const B_OLD = `      if (tool.pts === 1) {
        var draw1 = { type: activeTool, p1: pt, color: PALETTE[currentColorIdx] };
        if (activeTool === 'text') {
          var txt = window.prompt('Text:', '');
          if (!txt) { return; }
          draw1.text = txt;
        }
        st.drawings.push(draw1);
        persistDrawing(slot, draw1);
        selectTool('cursor');
        redraw(slot);
      } else if (tool.pts === 2) {`;
const B_NEW = `      if (tool.pts === 1) {
        if (activeTool === 'text') {
          selectTool('cursor');
          showInlineTextInput(st, xy, '', function (val) {
            if (!val) return;
            var d = { type: 'text', p1: pt, color: PALETTE[currentColorIdx], text: val };
            st.drawings.push(d);
            persistDrawing(slot, d);
            redraw(slot);
          });
          return;
        }
        var draw1 = { type: activeTool, p1: pt, color: PALETTE[currentColorIdx] };
        st.drawings.push(draw1);
        persistDrawing(slot, draw1);
        selectTool('cursor');
        redraw(slot);
      } else if (tool.pts === 2) {`;
if (!js.includes('showInlineTextInput(st, xy')) {
  if (js.includes(B_OLD)) { js = js.replace(B_OLD, B_NEW); changes++; }
  else console.log('⚠️  anchor B not found');
}

// 3. replace window.prompt on edit (double-click)
const C_OLD = `    st.onDblClick = function (e) {
      var xy = mouseXY(st, e);
      var hit = hitTest(st, xy.x, xy.y);
      if (hit && hit.drawing.type === 'text') {
        e.preventDefault(); e.stopPropagation();
        var newTxt = window.prompt('Edit text:', hit.drawing.text || '');
        if (newTxt != null) {
          hit.drawing.text = newTxt;
          persistDrawing(slot, hit.drawing);
          redraw(slot);
        }
      }
    };`;
const C_NEW = `    st.onDblClick = function (e) {
      var xy = mouseXY(st, e);
      var hit = hitTest(st, xy.x, xy.y);
      if (hit && hit.drawing.type === 'text') {
        e.preventDefault(); e.stopPropagation();
        var d = hit.drawing;
        var anchor = ptToXY(st, d.p1) || xy;
        showInlineTextInput(st, anchor, d.text || '', function (val) {
          if (val == null) return;
          d.text = val;
          persistDrawing(slot, d);
          redraw(slot);
        });
      }
    };`;
if (js.includes(C_OLD)) { js = js.replace(C_OLD, C_NEW); changes++; }
else if (!js.includes('showInlineTextInput(st, anchor')) console.log('⚠️  anchor C not found');

if (changes > 0) {
  fs.writeFileSync(file + '.bak-textfix', fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, js);
  console.log(`✅ drawing-tools.js patched (${changes} change(s) applied, backup: ${file}.bak-textfix)`);
} else {
  console.log('ℹ️  No changes made — either already patched or anchors not found (see warnings above).');
}
