const fs = require('fs');
const file = 'drawing-tools.js';
let js = fs.readFileSync(file, 'utf8');

const OLD = `        if (activeTool === 'text') {
          var txt = window.prompt('Text:', '');
          if (!txt) { return; }
          draw1.text = txt;
        }`;

const NEW = `        if (activeTool === 'text') {
          selectTool('cursor');
          showInlineTextInput(st, xy, '', function (val) {
            if (!val) return;
            draw1.text = val;
            st.drawings.push(draw1);
            persistDrawing(slot, draw1);
            redraw(slot);
          });
          return;
        }`;

if (js.includes(OLD)) {
  fs.writeFileSync(file + '.bak-textcreate', js);
  js = js.replace(OLD, NEW);
  fs.writeFileSync(file, js);
  console.log('✅ patched successfully');
} else if (!js.includes('window.prompt')) {
  console.log('ℹ️  window.prompt not found anywhere — likely already patched');
} else {
  console.log('⚠️  anchor not found — paste output of: sed -n "845,855p" drawing-tools.js');
}
