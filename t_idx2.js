(async () => {
  for (const s of ['NQ=F', 'YM=F', 'FDAX=F', 'FESX=F', '^GDAXI', '^FTSE', 'Z=F']) {
    try {
      const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(s) + '?range=1mo&interval=1h', { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const j = await r.json();
      const t = (j.chart.result[0].timestamp || []);
      const days = new Set(t.map(x => new Date(x * 1000).toISOString().slice(0, 10)));
      console.log(s, '| bars:', t.length, '| bars/day:', (t.length / days.size).toFixed(1));
    } catch (e) { console.log(s, 'fail'); }
  }
})();
