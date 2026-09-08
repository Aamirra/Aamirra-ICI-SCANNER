const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  // 1. Add spacing to the 4 arrow/action buttons (small, safe replacements)
  const marginFixes = [
    [`<button onclick="movePair(-1)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--txt)">`,
      `<button onclick="movePair(-1)" style="background:none;border:none;font-size:20px;padding:8px;margin-right:10px;color:var(--txt)">`],
    [`<button onclick="movePair(1)" style="background:none;border:none;font-size:20px;padding:8px;color:var(--txt)">`,
      `<button onclick="movePair(1)" style="background:none;border:none;font-size:20px;padding:8px;margin-left:10px;color:var(--txt)">`],
    [`style="background:none;border:none;font-size:20px;padding:8px;color:var(--gold);cursor:pointer;" title="Set Alert"`,
      `style="background:none;border:none;font-size:20px;padding:8px;margin-left:4px;color:var(--gold);cursor:pointer;" title="Set Alert"`],
    [`<button id="chartCloseBtn" onclick="closeChart()" style="background:none;border:none;font-size:20px;padding:8px;color:var(--red)">`,
      `<button id="chartCloseBtn" onclick="closeChart()" style="background:none;border:none;font-size:20px;padding:8px;margin-left:4px;color:var(--red)">`],
  ];
  marginFixes.forEach(([oldS, newS]) => {
    if (content.includes(oldS)) { content = content.split(oldS).join(newS); log.push('margin fix applied'); }
    else log.push('WARNING: margin fix pattern not found');
  });

  // 2. Extract the layout-controls block (robust, no exact whitespace needed)
  const startMarker = '<div class="layout-controls">';
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    log.push('WARNING: layout-controls block not found (maybe already moved)');
  } else {
    const closeIdx = content.indexOf('</div>', startIdx) + '</div>'.length;
    const innerStart = startIdx + startMarker.length;
    const innerEnd = closeIdx - '</div>'.length;
    const innerContent = content.slice(innerStart, innerEnd);

    // Remove the block plus one leading newline+indent if present
    let removeStart = startIdx;
    // also eat the newline before it
    const beforeNL = content.lastIndexOf('\n', startIdx);
    if (beforeNL !== -1) removeStart = beforeNL;
    content = content.slice(0, removeStart) + content.slice(closeIdx);

    // Build inline replacement div
    const newInlineDiv = `<div style="display:flex;gap:6px;align-items:center;margin-left:6px;">${innerContent}</div>`;

    // Insert before the movePair(1) button (find stable anchor regardless of style attr)
    const anchor = '<button onclick="movePair(1)"';
    const anchorIdx = content.indexOf(anchor);
    if (anchorIdx === -1) {
      log.push('WARNING: could not find movePair(1) button to insert before');
    } else {
      content = content.slice(0, anchorIdx) + newInlineDiv + '\n        ' + content.slice(anchorIdx);
      log.push('layout-controls moved into top header OK');
    }
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
