const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let src = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_yahoodebuglog', src);

const oldBlock = `function fetchYahooChart(yahooSymbol, yInterval, yRange) {
    return new Promise((resolve) => {
        const url = \`https://query1.finance.yahoo.com/v8/finance/chart/\${encodeURIComponent(yahooSymbol)}?range=\${yRange}&interval=\${yInterval}\`;
        https.get(url, { agent: keepAliveAgent, headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve((json && json.chart && json.chart.result && json.chart.result[0]) || null);
                } catch (e) { resolve(null); }
            });
        }).on('error', () => resolve(null));
    });
}`;

const newBlock = `function fetchYahooChart(yahooSymbol, yInterval, yRange) {
    return new Promise((resolve) => {
        const url = \`https://query1.finance.yahoo.com/v8/finance/chart/\${encodeURIComponent(yahooSymbol)}?range=\${yRange}&interval=\${yInterval}\`;
        https.get(url, { agent: keepAliveAgent, headers: { 'User-Agent': 'Mozilla/5.0' } }, (r) => {
            let data = '';
            r.on('data', c => data += c);
            r.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve((json && json.chart && json.chart.result && json.chart.result[0]) || null);
                } catch (e) {
                    console.error('[fetchYahooChart PARSE ERROR]', yahooSymbol, yInterval, yRange, 'status:', r.statusCode, 'dataLen:', data.length, 'snippet:', data.slice(0, 200), e.message);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error('[fetchYahooChart REQUEST ERROR]', yahooSymbol, yInterval, yRange, err.message);
            resolve(null);
        });
    });
}`;

if (!src.includes(oldBlock)) {
    console.error('MATCH FAILED - aborting. No changes made.');
    process.exit(1);
}
src = src.replace(oldBlock, newBlock);
fs.writeFileSync(path, src);
console.log('Debug logging added to fetchYahooChart');
