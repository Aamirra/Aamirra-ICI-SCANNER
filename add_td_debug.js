const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/core/scanner.js';
let content = fs.readFileSync(path, 'utf8');
fs.writeFileSync(path + '.before_tddebug', content);

const old1 = `                try {
                    const j = JSON.parse(d);
                    if (j.code === 429) { coolDownKey(key, '429'); return resolve(retryCount < config.KEYS.length ? await fetchTF(p, tf, retryCount + 1) : false); }`;
const new1 = `                try {
                    const j = JSON.parse(d);
                    console.log(\`[TD DEBUG] \${p.n} (\${tf}):\`, JSON.stringify(j).slice(0, 250));
                    if (j.code === 429) { coolDownKey(key, '429'); return resolve(retryCount < config.KEYS.length ? await fetchTF(p, tf, retryCount + 1) : false); }`;
const ok1 = content.includes(old1);
if (ok1) content = content.replace(old1, new1);

fs.writeFileSync(path, content);
console.log('Debug patch applied:', ok1);
