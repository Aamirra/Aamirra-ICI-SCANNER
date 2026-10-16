const fs = require('fs');
const f = 'core/chartFetchers.js';
let s = fs.readFileSync(f, 'utf8');

const edits = [
  [
    "function forexYahooSymbol(pairName) {",
    "// Yahoo futures ~24h chalte hain (CFD jaisa); cash index sirf ~7 bars/day deta hai\n" +
    "const INDEX_FUT_CHART = { US500: 'ES=F', US100: 'NQ=F', US30: 'YM=F', JPN225: 'NKD=F' };\n\n" +
    "function forexYahooSymbol(pairName) {"
  ],
  [
    "const yahooSymbol = forexYahooSymbol(symbol);",
    "const yahooSymbol = forexYahooSymbol(symbol);\n" +
    "    const futSym = INDEX_FUT_CHART[symbol];\n" +
    "    if (futSym && (interval === '1h' || interval === '4h')) {\n" +
    "        try {\n" +
    "            const fut = yahooToCandles(await fetchYahooChart(futSym, '60m', '730d'));\n" +
    "            if (fut.length >= 200) {\n" +
    "                let out = interval === '4h' ? aggregate4h(fut) : fut;\n" +
    "                if (out.length > totalWanted) out = out.slice(out.length - totalWanted);\n" +
    "                return out;\n" +
    "            }\n" +
    "        } catch (e) { /* fallback: cash index neeche */ }\n" +
    "    }"
  ]
];

for (const [a] of edits) {
  if (s.split(a).length !== 2) { console.error('NOT FOUND ya ek se zyada: ' + a.slice(0, 70)); process.exit(1); }
}
fs.copyFileSync(f, f + '.bak_chart');
for (const [a, b] of edits) s = s.replace(a, () => b);
fs.writeFileSync(f, s);
console.log('patched', f);
