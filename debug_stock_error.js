const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/chartFetchers.js';
let src = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_debuglog', src);

const oldBlock = `            const recentDaily = aggregateDaily(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
            const olderDaily = fixNativeOpens(yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', '10y')));
            candles = mergeOlderWithRecent(olderDaily, recentDaily);
        }
    } catch (e) { candles = []; }
    if (candles.length > totalWanted) candles = candles.slice(candles.length - totalWanted);
    return candles;
}

async function refreshStockCandles(meta) {`;

const newBlock = `            const recentDaily = aggregateDaily(yahooToCandles(await fetchYahooChart(yahooSymbol, '60m', '730d')));
            const olderDaily = fixNativeOpens(yahooToCandles(await fetchYahooChart(yahooSymbol, '1d', '10y')));
            candles = mergeOlderWithRecent(olderDaily, recentDaily);
        }
    } catch (e) { console.error('[fetchStockCandlesFull ERROR]', symbol, interval, e && e.stack); candles = []; }
    if (candles.length > totalWanted) candles = candles.slice(candles.length - totalWanted);
    return candles;
}

async function refreshStockCandles(meta) {`;

if (!src.includes(oldBlock)) {
    console.error('MATCH FAILED - anchor not found, aborting. No changes made.');
    process.exit(1);
}
src = src.replace(oldBlock, newBlock);
fs.writeFileSync(path, src);
console.log('Debug logging added to fetchStockCandlesFull catch block');
