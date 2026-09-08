const fs = require('fs');
const files = ['index.html', 'crypto.html', 'stocks.html'];

const bullBearForHeader = `            <button class="slevel-btn" onclick="setFilter('bull')">Bull <span id="bc" style="color:var(--green)">0</span></button>
            <button class="slevel-btn" onclick="setFilter('bear')">Bear <span id="rc" style="color:var(--red)">0</span></button>`;

const oldBullBearInSlevelBar = `        <button class="slevel-btn" onclick="setFilter('bull')">Bull <span id="bc" style="color:var(--green)">0</span></button>
        <button class="slevel-btn" onclick="setFilter('bear')">Bear <span id="rc" style="color:var(--red)">0</span></button>`;

files.forEach(file => {
  if (!fs.existsSync(file)) { console.log('SKIP (not found):', file); return; }
  let content = fs.readFileSync(file, 'utf8');
  let log = [];

  // 1. Extract market-dropdown-wrap block dynamically
  const startMarker = '<div class="market-dropdown-wrap" id="marketDropdownWrap">';
  const startIdx = content.indexOf(startMarker);
  if (startIdx === -1) {
    log.push('WARNING: market-dropdown-wrap not found - aborting for this file');
    console.log(`--- ${file} ---`); log.forEach(l => console.log('  ' + l)); return;
  }
  const endMarker = '                </div>\n            </div>';
  const endIdxRaw = content.indexOf(endMarker, startIdx);
  if (endIdxRaw === -1) {
    log.push('WARNING: market-dropdown-wrap closing not found - aborting for this file');
    console.log(`--- ${file} ---`); log.forEach(l => console.log('  ' + l)); return;
  }
  const fullEnd = endIdxRaw + endMarker.length;
  const marketBlock = content.slice(startIdx, fullEnd);

  // 2. Remove market block from header-actions, insert Bull/Bear there
  content = content.slice(0, startIdx) + bullBearForHeader + content.slice(fullEnd);
  log.push('market-dropdown removed from top header, Bull/Bear inserted OK');

  // 3. Replace old Bull/Bear (in dir-slevel-bar) with the market dropdown block
  if (content.includes(oldBullBearInSlevelBar)) {
    content = content.split(oldBullBearInSlevelBar).join(marketBlock);
    log.push('market-dropdown inserted into dir-slevel-bar, old Bull/Bear removed OK');
  } else {
    log.push('WARNING: Bull/Bear pattern not found in dir-slevel-bar - market block NOT relocated (check indentation)');
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`--- ${file} ---`);
  log.forEach(l => console.log('  ' + l));
});
