const cf = require('./core/chartFetchers');
(async () => {
  for (const sym of ['JPN225', 'US500', 'GER40']) {
    for (const iv of ['1h', '4h']) {
      const c = await cf.fetchForexCandlesFull(sym, iv, 15000);
      const days = new Set(c.map(x => new Date(x.time * 1000).toISOString().slice(0, 10)));
      console.log(sym, iv, '| candles:', c.length, '| per day:', (c.length / days.size).toFixed(1));
    }
  }
  process.exit(0);
})();
