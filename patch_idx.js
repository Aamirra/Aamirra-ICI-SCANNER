const fs = require('fs');
const f = 'core/scanner.js';
let s = fs.readFileSync(f, 'utf8');

const edits = [
  [
    "const INDICES = ['US500', 'US100', 'US30', 'GER40', 'UK100', 'JPN225'];",
    "const INDICES = ['US500', 'US100', 'US30', 'GER40', 'UK100', 'JPN225'];\n" +
    "// Yahoo futures ~24h chalte hain (CFD jaisa); cash index sirf ~7 bars/day deta hai\n" +
    "const INDEX_FUT = { US500: 'ES=F', US100: 'NQ=F', US30: 'YM=F', JPN225: 'NKD=F' };"
  ],
  [
    "const yahooSymbol = symMap.yahoo;",
    "const yahooSymbol = (INDEX_FUT[pair] && (tf === '1h' || tf === '4h' || tf === '15m')) ? INDEX_FUT[pair] : symMap.yahoo;"
  ],
  [
    "// Indices ke liye Twelve Data se 15m data fetch karo",
    "let gotFut15 = false;\n" +
    "        if (INDEX_FUT[p.n]) {\n" +
    "            try {\n" +
    "                const r15 = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(INDEX_FUT[p.n]) + '?range=60d&interval=15m', { headers: { 'User-Agent': 'Mozilla/5.0' } });\n" +
    "                const j15 = await r15.json();\n" +
    "                const res15 = j15 && j15.chart && j15.chart.result && j15.chart.result[0];\n" +
    "                const q15 = res15 && res15.indicators && res15.indicators.quote && res15.indicators.quote[0];\n" +
    "                if (res15 && q15 && res15.timestamp) {\n" +
    "                    const o = [], h = [], l = [], c = [], t = [];\n" +
    "                    res15.timestamp.forEach((ts, i) => {\n" +
    "                        if (q15.open[i] == null || q15.high[i] == null || q15.low[i] == null || q15.close[i] == null) return;\n" +
    "                        o.push(q15.open[i]); h.push(q15.high[i]); l.push(q15.low[i]); c.push(q15.close[i]); t.push(new Date(ts * 1000).toISOString());\n" +
    "                    });\n" +
    "                    if (c.length >= 50) {\n" +
    "                        RAW_15M[p.n] = { opens: o.slice(-1500), closes: c.slice(-1500), highs: h.slice(-1500), lows: l.slice(-1500), times: t.slice(-1500), time: t[t.length - 1] };\n" +
    "                        gotFut15 = true;\n" +
    "                    }\n" +
    "                }\n" +
    "            } catch (e) { console.error('[Index] futures 15m error for ' + p.n + ':', e.message); }\n" +
    "        }\n" +
    "        // Indices ke liye Twelve Data se 15m data fetch karo"
  ],
  [
    "const twSymbol = INDEX_SYMBOLS[p.n]?.twelvedata;",
    "const twSymbol = gotFut15 ? null : INDEX_SYMBOLS[p.n]?.twelvedata;"
  ]
];

for (const [a] of edits) {
  if (s.split(a).length !== 2) { console.error('NOT FOUND ya ek se zyada: ' + a.slice(0, 80)); process.exit(1); }
}
fs.copyFileSync(f, f + '.bak_idx');
for (const [a, b] of edits) s = s.replace(a, () => b);
fs.writeFileSync(f, s);
console.log('patched', f);
