const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_splitfix', content);

const oldFn = `async function fetchBatch(jobs) {
    const failed = [];
    for (let i = 0; i < jobs.length; i += MAX_CONCURRENT) {
        const slice = jobs.slice(i, i + MAX_CONCURRENT);
        const results = await Promise.all(slice.map(async ({ p, tf }) => ({ p, tf, ok: await fetchTF(p, tf) })));
        for (const r of results) if (!r.ok) failed.push({ p: r.p, tf: r.tf });
        if (i + MAX_CONCURRENT < jobs.length) await sleep(BATCH_DELAY_MS);
    }
    return failed;
}`;

const newFn = `async function fetchBatch(jobs) {
    const isFastJob = (job) => job.p.isCrypto || INDICES.includes(job.p.n);
    const fastJobs = jobs.filter(isFastJob);
    const slowJobs = jobs.filter(j => !isFastJob(j));

    const FAST_CONCURRENT = 30; // free sources, no key limit — go high

    const runFastPipeline = async () => {
        const localFailed = [];
        for (let i = 0; i < fastJobs.length; i += FAST_CONCURRENT) {
            const slice = fastJobs.slice(i, i + FAST_CONCURRENT);
            const results = await Promise.all(slice.map(async ({ p, tf }) => ({ p, tf, ok: await fetchTF(p, tf) })));
            for (const r of results) if (!r.ok) localFailed.push({ p: r.p, tf: r.tf });
        }
        return localFailed;
    };

    const runSlowPipeline = async () => {
        const localFailed = [];
        for (let i = 0; i < slowJobs.length; i += MAX_CONCURRENT) {
            const slice = slowJobs.slice(i, i + MAX_CONCURRENT);
            const results = await Promise.all(slice.map(async ({ p, tf }) => ({ p, tf, ok: await fetchTF(p, tf) })));
            for (const r of results) if (!r.ok) localFailed.push({ p: r.p, tf: r.tf });
            if (i + MAX_CONCURRENT < slowJobs.length) await sleep(BATCH_DELAY_MS);
        }
        return localFailed;
    };

    const [fastFailed, slowFailed] = await Promise.all([runFastPipeline(), runSlowPipeline()]);
    return [...fastFailed, ...slowFailed];
}`;

const ok = content.includes(oldFn);
if (ok) {
  content = content.replace(oldFn, newFn);
  fs.writeFileSync(path, content);
  console.log('✅ fetchBatch split into fast/slow pipelines successfully.');
} else {
  console.log('⚠️ Pattern match nahi hua — koi change nahi hui.');
}
