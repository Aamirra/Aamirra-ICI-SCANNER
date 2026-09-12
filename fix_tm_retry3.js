const fs = require('fs');
const path = '/home/ubuntu/ICI-SCANNER/services/technicalMetrics.js';
let content = fs.readFileSync(path, 'utf8');

const old3 = `                        await sleep(1000); 
                        resolve(await fetchTwelveDataVolume(pairName)); 
                        return;`;
const new3 = `                        await sleep(1000);
                        resolve(await fetchTwelveDataVolume(pairName, retryCount + 1));
                        return;`;
const ok3 = content.includes(old3);
if (ok3) content = content.replace(old3, new3);

fs.writeFileSync(path, content);
console.log('Patch applied:', ok3);
