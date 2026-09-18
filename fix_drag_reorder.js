const fs = require('fs');
const file = 'drawing-tools.js';
let js = fs.readFileSync(file, 'utf8');
let changes = 0;

// 1. add dragFromIndex tracking var
const A_OLD = `  var toolbarEl = null, pinsEl = null, flyoutEl = null, colorBtnEl = null, deleteBtnEl = null;`;
const A_NEW = A_OLD + `\n  var dragFromIndex = null;`;
if (!js.includes('var dragFromIndex')) {
  if (js.includes(A_OLD)) { js = js.replace(A_OLD, A_NEW); changes++; }
  else console.log('⚠️  anchor A not found');
}

// 2. container-level dragover/drop
const B_OLD = `    pinsEl = document.createElement('div');
    pinsEl.style.display = 'flex';
    pinsEl.style.flexDirection = 'column';
    pinsEl.style.gap = '2px';
    toolbarEl.appendChild(pinsEl);`;
const B_NEW = B_OLD + `

    pinsEl.addEventListener('dragover', function (e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    pinsEl.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragFromIndex == null) return;
      var children = Array.prototype.slice.call(pinsEl.children);
      var targetIdx = children.length - 1;
      for (var i = 0; i < children.length; i++) {
        var rect = children[i].getBoundingClientRect();
        if (e.clientY < rect.top + rect.height / 2) { targetIdx = i; break; }
      }
      if (targetIdx !== dragFromIndex && dragFromIndex >= 0 && dragFromIndex < favorites.length) {
        var moved = favorites.splice(dragFromIndex, 1)[0];
        if (targetIdx > dragFromIndex) targetIdx--;
        favorites.splice(targetIdx, 0, moved);
        saveFavorites();
      }
      dragFromIndex = null;
      renderPins();
    });`;
if (!js.includes("pinsEl.addEventListener('drop'")) {
  if (js.includes(B_OLD)) { js = js.replace(B_OLD, B_NEW); changes++; }
  else console.log('⚠️  anchor B not found');
}

// 3. replace fragile per-pin dragstart/dragover/drop
const C_OLD = `      b.addEventListener('click', function (e) { e.stopPropagation(); selectTool(tool.id); });
      b.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', String(idx));
        e.dataTransfer.effectAllowed = 'move';
      });
      b.addEventListener('dragover', function (e) { e.preventDefault(); });
      b.addEventListener('drop', function (e) {
        e.preventDefault();
        var from = parseInt(e.dataTransfer.getData('text/plain'), 10);
        var to = idx;
        if (isNaN(from) || from === to) return;
        var moved = favorites.splice(from, 1)[0];
        favorites.splice(to, 0, moved);
        saveFavorites();
        renderPins();
      });
      pinsEl.appendChild(b);`;
const C_NEW = `      b.addEventListener('click', function (e) { e.stopPropagation(); selectTool(tool.id); });
      b.addEventListener('dragstart', function (e) {
        dragFromIndex = idx;
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(idx)); } catch (err) {}
        setTimeout(function () { b.style.opacity = '0.35'; }, 0);
      });
      b.addEventListener('dragend', function () {
        b.style.opacity = '1';
        dragFromIndex = null;
      });
      pinsEl.appendChild(b);`;
if (js.includes(C_OLD)) { js = js.replace(C_OLD, C_NEW); changes++; }
else if (!js.includes('dragend')) console.log('⚠️  anchor C not found');

if (changes > 0) {
  fs.writeFileSync(file + '.bak-dragfix', fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, js);
  console.log(`✅ drawing-tools.js patched (${changes} change(s) applied, backup: ${file}.bak-dragfix)`);
} else {
  console.log('ℹ️  No changes made — either already patched or anchors not found (see warnings above).');
}
