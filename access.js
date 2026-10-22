const fs = require('fs'), path = require('path'), crypto = require('crypto'), https = require('https');
try { require('dotenv').config(); } catch (e) {}
const FILE = path.join(__dirname, 'data', 'access.json');
const DAY = 86400000;
let db = { users: {} };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); if (!db.users) db.users = {}; } catch (e) {}
if (!db.devices) db.devices = {};
function devAcct(d) { return typeof d === 'string' ? d : (d && d.acct); }
function resolveId(uid) { if (!uid) return uid; if (db.users[uid]) return uid; return devAcct(db.devices[uid]) || uid; }
function devTokens(id) { return Object.keys(db.devices).filter(function (t) { return devAcct(db.devices[t]) === id; }); }
function ckey(c) { return String(c || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function findByContact(ck) { if (!ck) return null; return Object.keys(db.users).filter(function (i) { return ckey(db.users[i].contact) === ck; })[0] || null; }
function hashPin(p) { const salt = crypto.randomBytes(8).toString('hex'); return salt + ':' + crypto.scryptSync(p, salt, 32).toString('hex'); }
function checkPin(p, h) { if (!h) return false; const a = h.split(':'); const x = Buffer.from(crypto.scryptSync(p, a[0], 32).toString('hex')); const y = Buffer.from(a[1] || ''); return x.length === y.length && crypto.timingSafeEqual(x, y); }
function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const t = FILE + '.tmp';
  fs.writeFileSync(t, JSON.stringify(db, null, 1));
  fs.renameSync(t, FILE);
}
function cookies(req) {
  const o = {};
  (req.headers.cookie || '').split(';').forEach(function (p) {
    const i = p.indexOf('=');
    if (i > 0) o[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return o;
}
function ipOf(req) { return ((req.headers['x-forwarded-for'] || '').split(',')[0] || req.socket.remoteAddress || '').trim(); }
function isLocal(req) {
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].indexOf(req.socket.remoteAddress) > -1 && !req.headers['x-forwarded-for'];
}
function send(res, code, type, body, extra) {
  res.writeHead(code, Object.assign({ 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store' }, extra || {}));
  res.end(body);
}
function readBody(req, cb) {
  let b = '', dead = false;
  req.on('data', function (c) { b += c; if (b.length > 4096) { dead = true; req.destroy(); } });
  req.on('end', function () { if (dead) return; let j = {}; try { j = JSON.parse(b || '{}'); } catch (e) {} cb(j); });
}
const hits = {};
function limited(key, max) {
  const n = Date.now();
  const a = (hits[key] || []).filter(function (t) { return n - t < 3600000; });
  a.push(n); hits[key] = a;
  return a.length > max;
}
// ici-tgretry
function tg(text, n) {
  n = n || 1;
  console.log('[access] tg() called, attempt ' + n);
  const t = process.env.BOT_TOKEN, c = process.env.CHAT_ID;
  if (!t || !c) { console.error('[access] BOT_TOKEN/CHAT_ID missing'); return; }
  const d = JSON.stringify({ chat_id: c, text: text });
  function again(why) {
    console.error('[access] telegram attempt ' + n + ' failed: ' + why);
    if (n < 4) setTimeout(function () { tg(text, n + 1); }, 2000 * n);
  }
  const r = https.request({ hostname: 'api.telegram.org', path: '/bot' + t + '/sendMessage', method: 'POST', timeout: 8000, family: 4,
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(d) } }, function (x) {
    let b = ''; x.on('data', function (k) { b += k; });
    x.on('end', function () { if (x.statusCode !== 200) again('HTTP ' + x.statusCode + ' ' + b.slice(0, 120)); else console.log('[access] telegram sent OK (attempt ' + n + ')'); });
  });
  r.on('timeout', function () { r.destroy(new Error('timeout')); });
  r.on('error', function (e) { again(e.message); });
  r.end(d);
}
function effective(rec) {
  if (!rec) return 'none';
  if (rec.status === 'blocked') return 'blocked';
  if (rec.status === 'active') return rec.expiry > Date.now() ? 'active' : 'expired';
  return 'pending';
}
function setUidCookie(req, id) {
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  return { 'Set-Cookie': 'ici_uid=' + id + '; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax' + secure };
}

const CSS = 'body{margin:0;padding:20px;font-family:Inter,Arial,sans-serif;background:#0f172a;color:#f8fafc}' +
  '.box{max-width:420px;margin:8vh auto;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:22px}' +
  'h2{margin:0 0 10px}p{color:#94a3b8;line-height:1.5}input{width:100%;box-sizing:border-box;padding:12px;margin:6px 0;border-radius:10px;border:1px solid #334155;background:#0f172a;color:#fff;font-size:16px}' +
  'button{padding:12px 16px;border:0;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;background:#3b82f6;color:#fff}' +
  '.full{width:100%;margin-top:8px}.card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:12px;margin:10px 0}' +
  '.sub{color:#94a3b8;font-size:13px;margin:4px 0 8px}.row{display:flex;gap:6px;flex-wrap:wrap}.g{background:#22c55e}.r{background:#ef4444}.n{background:#475569}' +
  '.row button{padding:8px 12px;font-size:13px}';
function page(inner, script) {
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ICI Scanner</title><style>' + CSS +
    '</style></head><body>' + inner + '<script>' + (script || '') + '</script></body></html>';
}
const REQ_JS = 'function send(again){var n=document.getElementById("n"),c=document.getElementById("c");' +
  'fetch("/access/request",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n?n.value:"",contact:c?c.value:"",again:again})})' +
  '.then(function(r){return r.json();}).then(function(j){if(j.ok)location.reload();else alert(j.error||"Error");});}';
const POLL_JS = 'setInterval(function(){fetch("/access/status").then(function(r){return r.json();}).then(function(j){if(j.status==="active")location.reload();});},5000);';
function userPage(state) {
  if (state === 'none') return page('<div class="box"><h2>ICI Scanner</h2><p>Yeh app private hai. Access ke liye request bhejein, approve hone par app khul jayegi.</p>' +
    '<input id="n" placeholder="Aapka naam" maxlength="40"><input id="c" placeholder="WhatsApp / Telegram number" maxlength="60">' +
    '<button class="full" onclick="send(false)">Access Request Bhejein</button></div>', REQ_JS);
  if (state === 'pending') return page('<div class="box"><h2>Request bhej di gayi</h2><p>Approval ka intezar hai. Approve hote hi yeh page khud khul jayega.</p></div>', POLL_JS);
  if (state === 'expired') return page('<div class="box"><h2>Access khatam</h2><p>Aapka access ka waqt poora ho gaya. Dobara access ke liye request bhejein.</p>' +
    '<button class="full" onclick="send(true)">Dobara Request Bhejein</button></div>', REQ_JS);
  return page('<div class="box"><h2>Access is blocked</h2><p>Is account ka access band kar diya gaya hai.</p></div>');
}
const NEW_JS = 'function v(i){return document.getElementById(i).value;}' +
  'function post(u,b){fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(function(r){return r.json();}).then(function(j){if(j.ok)location.reload();else alert(j.error||"Error");});}' +
  'function reg(){post("/access/request",{name:v("n"),contact:v("c"),pin:v("p")});}' +
  'function login(){post("/access/login",{contact:v("lc"),pin:v("lp")});}';
const _up = userPage;
userPage = function (state) {
  if (state !== 'none') return _up(state);
  return page('<div class="box"><h2>ICI Scanner</h2><p>Yeh app private hai. Naye user ho to request bhejein:</p>' +
    '<input id="n" placeholder="Aapka naam" maxlength="40"><input id="c" placeholder="WhatsApp / Telegram number" maxlength="60">' +
    '<input id="p" type="password" placeholder="PIN / password (6+ characters)" maxlength="40">' +
    '<button class="full" onclick="reg()">Access Request Bhejein</button>' +
    '<hr style="border-color:#334155;margin:18px 0"><p>Pehle se account hai? Kisi bhi device par login karein:</p>' +
    '<input id="lc" placeholder="Apna number"><input id="lp" type="password" placeholder="PIN / password">' +
    '<button class="full n" onclick="login()">Login</button></div>', NEW_JS);
};
function deny(req, res, p, state) {
  const wantsHtml = req.method === 'GET' && (req.headers.accept || '').indexOf('text/html') > -1 && p.indexOf('/api/') !== 0;
  if (wantsHtml) return send(res, 200, 'text/html', userPage(state));
  send(res, 401, 'application/json', JSON.stringify({ error: 'access', state: state }));
}

// ici-landing-en
const LAND_CSS = '<style>.tabs{display:flex;gap:8px;margin:14px 0}.tabs button{flex:1;background:#334155;color:#cbd5e1;padding:12px 6px;font-size:14px}.tabs button.on{background:#3b82f6;color:#fff}.pane{display:none}.pane.on{display:block}.steps{color:#94a3b8;font-size:14px;line-height:1.7;margin:8px 0 12px;padding-left:20px}label{display:block;margin-top:10px;font-size:13px;color:#cbd5e1}</style>';
const LAND_JS = 'function v(i){return document.getElementById(i).value;}' +
  'function tab(i){var k=["new","login"];for(var x=0;x<2;x++){document.getElementById("t-"+k[x]).className=(x===i?"on":"");document.getElementById("p-"+k[x]).className="pane"+(x===i?" on":"");}}' +
  'function post(u,b){fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)}).then(function(r){return r.json();}).then(function(j){if(j.ok)location.reload();else alert(j.error||"Error");});}' +
  'function reg(){post("/access/request",{name:v("n"),contact:v("c"),pin:v("p")});}' +
  'function login(){post("/access/login",{contact:v("lc"),pin:v("lp")});}';
userPage = function (state) {
  if (state === 'none') return page(LAND_CSS + '<div class="box"><h2>ICI Scanner</h2><p>This is a private app. Please choose one option:</p>' +
    '<div class="tabs"><button id="t-new" class="on" onclick="tab(0)">New user</button><button id="t-login" onclick="tab(1)">I have an account</button></div>' +
    '<div id="p-new" class="pane on"><b>Request access</b>' +
    '<ol class="steps"><li>Enter your name and WhatsApp/Telegram number</li><li>Create a PIN (you will use it to log in on other devices)</li><li>Send the request and wait for approval. This page opens automatically once approved.</li></ol>' +
    '<label>Your name</label><input id="n" placeholder="e.g. Ali" maxlength="40">' +
    '<label>WhatsApp / Telegram number</label><input id="c" placeholder="e.g. 03001234567" maxlength="60">' +
    '<label>Create a PIN (min 6 characters)</label><input id="p" type="password" placeholder="PIN / password" maxlength="40">' +
    '<div style="font-size:13px;color:#94a3b8;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px 12px;margin:10px 0;line-height:1.6"><b style="color:#e2e8f0">What is this PIN for?</b><br>' +
    '- It is your password. You need your number + PIN to log in on another device (PC, new phone) or after clearing your browser data.<br>' +
    '- On the device you register from, you stay logged in automatically.<br>' +
    '- Keep it private. Only 2 devices can use one account, and if someone else logs in with your PIN, your oldest device is logged out.<br>' +
    '- If you forget it, it cannot be recovered. The admin can set a new one for you, so please save it somewhere safe.</div>' + /* ici-pinnote */
    '<button class="full" onclick="reg()">Send Request</button></div>' +
    '<div id="p-login" class="pane"><b>Log in</b>' +
    '<p>Already approved or purchased? Enter the same number and PIN you registered with. You can use up to 2 devices (for example mobile and PC).</p>' +
    '<label>Your number</label><input id="lc" placeholder="The number you registered with">' +
    '<label>Your PIN</label><input id="lp" type="password" placeholder="PIN / password">' +
    '<div style="font-size:13px;color:#94a3b8;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px 12px;margin:10px 0;line-height:1.6"><b style="color:#e2e8f0">Forgot your PIN?</b><br>Contact the admin on WhatsApp/Telegram with the number you registered with. The admin will set a new PIN for you, then you can log in again.</div>' +
    '<button class="full" onclick="login()">Log in</button></div></div>', LAND_JS);
  if (state === 'pending') return page('<div class="box"><h2>Request sent</h2><p>Your request is waiting for approval. This page will open the app automatically once you are approved. You can close it and come back later.</p><p>Using another device? Open the site there and use "I have an account" to log in.</p></div>', POLL_JS);
  if (state === 'expired') return page('<div class="box"><h2>Access expired</h2><p>Your access period has ended. Send a new request to continue.</p><button class="full" onclick="send(true)">Request access again</button></div>', REQ_JS);
  return page('<div class="box"><h2>Access blocked</h2><p>Access for this account has been blocked. Please contact the admin.</p></div>');
};
function accessRoute(req, res, p) {
  const uid = cookies(req).ici_uid;
  if (p === '/access/status' && req.method === 'GET') {
    return send(res, 200, 'application/json', JSON.stringify({ status: effective(db.users[resolveId(uid)]) }));
  }
  if (p === '/access/login' && req.method === 'POST') {
    return readBody(req, function (b) {
      const id = findByContact(ckey(b.contact));
      if (limited('login:' + ipOf(req), 10) || limited('loginacct:' + (id || 'x'), 15)) return send(res, 429, 'application/json', '{"ok":false,"error":"Too many attempts, try again later"}');
      const u = id && db.users[id];
      if (!u || !u.pin || !checkPin(String(b.pin || ''), u.pin)) return send(res, 401, 'application/json', '{"ok":false,"error":"Wrong number or PIN"}');
      if (u.status === 'blocked') return send(res, 403, 'application/json', '{"ok":false,"error":"Access is blocked"}');
      const token = crypto.randomBytes(16).toString('hex');
      db.devices[token] = { acct: id, t: Date.now() };
      const toks = devTokens(id).sort(function (a, c) { return ((db.devices[a] || {}).t || 0) - ((db.devices[c] || {}).t || 0); });
      while (toks.length > (u.maxDevices || 2) - 1) delete db.devices[toks.shift()];
      save();
      return send(res, 200, 'application/json', '{"ok":true}', setUidCookie(req, token));
    });
  }
  if (p === '/access/request' && req.method === 'POST') {
    if (limited('req:' + ipOf(req), 8)) return send(res, 429, 'application/json', '{"ok":false,"error":"Too many requests, try again later"}');
    return readBody(req, function (b) {
      let rec = db.users[resolveId(uid)];
      const name = String(b.name || '').trim().slice(0, 40), contact = String(b.contact || '').trim().slice(0, 60);
      const host = req.headers.host;
      if (rec) {
        const st = effective(rec);
        if (st === 'blocked') return send(res, 403, 'application/json', '{"ok":false,"error":"Access is blocked"}');
        if (st === 'expired') {
          rec.status = 'pending';
          if (name.length >= 2) rec.name = name;
          if (contact.length >= 3) rec.contact = contact;
          save();
          tg('Access dobara maanga (expired): ' + rec.name + ' | ' + maskNum(rec.contact) + '\nhttps://' + host + '/admin');
        }
        return send(res, 200, 'application/json', '{"ok":true}', setUidCookie(req, uid));
      }
      const pin = String(b.pin || '');
      if (name.length < 2 || contact.length < 3) return send(res, 400, 'application/json', '{"ok":false,"error":"Please enter your name and number"}');
      if (pin.length < 6) return send(res, 400, 'application/json', '{"ok":false,"error":"PIN must be at least 6 characters"}');
      if (findByContact(ckey(contact))) return send(res, 400, 'application/json', '{"ok":false,"error":"An account with this number already exists. Please use "I have an account"."}');
      if (Object.keys(db.users).length >= 500) return send(res, 429, 'application/json', '{"ok":false,"error":"Requests are closed right now"}');
      const id = crypto.randomBytes(16).toString('hex');
      db.users[id] = { name: name, contact: contact, status: 'pending', expiry: 0, plan: 'free', created: Date.now(), pin: hashPin(pin) };
      save();
      tg('Nayi access request: ' + name + ' | ' + maskNum(contact) + '\nhttps://' + host + '/admin');
      return send(res, 200, 'application/json', '{"ok":true}', setUidCookie(req, id));
    });
  }
  send(res, 404, 'text/plain', 'not found');
}

function adminToken() { return crypto.createHash('sha256').update('ici-admin:' + (process.env.ADMIN_KEY || '')).digest('hex'); }
function safeEq(a, b) { a = Buffer.from(String(a)); b = Buffer.from(String(b)); return a.length === b.length && crypto.timingSafeEqual(a, b); }
function adminOk(req) { return !!process.env.ADMIN_KEY && safeEq(cookies(req).ici_admin || '', adminToken()); }
const ADMIN_JS = 'var L=document.getElementById("list"),D=document.getElementById("days");' +
  'function act(id,a){fetch("/admin/act",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id,action:a,days:+D.value||30})}).then(load);}' +
  'function setpin(id){var x=prompt("Naya PIN (6+ characters)");if(!x)return;fetch("/admin/act",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:id,action:"pin",pin:x})}).then(function(r){return r.json();}).then(function(j){alert(j.ok?"PIN set ho gaya":"Error (6+ characters chahiye)");load();});}' +
  'function btn(t,cls,f){var b=document.createElement("button");b.textContent=t;b.className=cls;b.onclick=f;return b;}' +
  'function fmt(t){return t?new Date(t).toLocaleDateString():"-";}' +
  'function load(){fetch("/admin/list").then(function(r){return r.json();}).then(function(a){L.textContent="";if(!a.length){L.textContent="Koi user nahi";return;}' +
  'a.forEach(function(u){var c=document.createElement("div");c.className="card";var h=document.createElement("b");h.textContent=u.name+"  ["+u.state+"]";c.appendChild(h);' +
  'var p=document.createElement("div");p.className="sub";var left=u.expiry?Math.ceil((u.expiry-Date.now())/86400000):0;' +
  'p.textContent=u.contact+" | plan: "+u.plan+" | devices: "+u.dev+"/"+u.max+(u.pin?"":" | PIN nahi")+" | expiry: "+fmt(u.expiry)+(u.state==="active"?" ("+left+" din baqi)":"");c.appendChild(p);' +
  'var r=document.createElement("div");r.className="row";' +
  'r.appendChild(btn(u.state==="active"?"+ Din barhao":"Approve","g",function(){act(u.id,u.state==="active"?"extend":"approve");}));' +
  'if(u.state!=="blocked")r.appendChild(btn("Block","r",function(){act(u.id,"block");}));' +
  'r.appendChild(btn(u.plan==="paid"?"Free karo":"Paid mark","n",function(){act(u.id,"plan");}));' +
  'r.appendChild(btn("PIN set","n",function(){setpin(u.id);}));' +
  'r.appendChild(btn("+1 device","n",function(){act(u.id,"devplus");}));' +
  'r.appendChild(btn("Delete","n",function(){if(confirm("Delete?"))act(u.id,"delete");}));' +
  'c.appendChild(r);L.appendChild(c);});});}load();setInterval(load,15000);';
const LOGIN_JS = 'function go(){fetch("/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:document.getElementById("k").value})})' +
  '.then(function(r){return r.json();}).then(function(j){if(j.ok)location.reload();else alert("Galat password");});}';

function adminRoute(req, res, p) {
  if (!process.env.ADMIN_KEY) return send(res, 503, 'text/plain', 'ADMIN_KEY set nahi hai');
  if (p === '/admin/login' && req.method === 'POST') {
    if (limited('adm:' + ipOf(req), 10)) return send(res, 429, 'application/json', '{"ok":false}');
    return readBody(req, function (b) {
      if (safeEq(crypto.createHash('sha256').update('x' + String(b.key || '')).digest('hex'), crypto.createHash('sha256').update('x' + process.env.ADMIN_KEY).digest('hex'))) {
        const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
        return send(res, 200, 'application/json', '{"ok":true}', { 'Set-Cookie': 'ici_admin=' + adminToken() + '; Path=/; Max-Age=315360000; HttpOnly; SameSite=Strict' + secure });
      }
      send(res, 401, 'application/json', '{"ok":false}');
    });
  }
  if (!adminOk(req)) {
    if (p === '/admin' && req.method === 'GET') {
      return send(res, 200, 'text/html', page('<div class="box"><h2>Admin</h2><input id="k" type="password" placeholder="Admin password"><button class="full" onclick="go()">Login</button></div>', LOGIN_JS));
    }
    return send(res, 401, 'application/json', '{"error":"admin"}');
  }
  if (p === '/admin' && req.method === 'GET') {
    return send(res, 200, 'text/html', page('<h2>Access Admin</h2><p>Approve par din: <input id="days" type="number" value="30" min="1" max="3650" style="width:90px;display:inline-block"></p><div id="list">...</div>', ADMIN_JS));
  }
  if (p === '/admin/list' && req.method === 'GET') {
    const arr = Object.keys(db.users).map(function (id) {
      const u = db.users[id];
      return { id: id, name: u.name, contact: u.contact, plan: u.plan, expiry: u.expiry, created: u.created, state: effective(u), dev: 1 + devTokens(id).length, max: u.maxDevices || 2, pin: !!u.pin };
    }).sort(function (a, b) { return (a.state === 'pending' ? 0 : 1) - (b.state === 'pending' ? 0 : 1) || b.created - a.created; });
    return send(res, 200, 'application/json', JSON.stringify(arr));
  }
  if (p === '/admin/act' && req.method === 'POST') {
    return readBody(req, function (b) {
      const u = db.users[b.id];
      if (!u) return send(res, 404, 'application/json', '{"ok":false}');
      if (b.action === 'pin') {
        if (String(b.pin || '').length < 6) return send(res, 400, 'application/json', '{"ok":false}');
        u.pin = hashPin(String(b.pin)); save();
        return send(res, 200, 'application/json', '{"ok":true}');
      }
      const days = Math.min(3650, Math.max(1, parseInt(b.days, 10) || 30));
      if (b.action === 'approve') { u.status = 'active'; u.expiry = Date.now() + days * DAY; }
      else if (b.action === 'extend') { u.status = 'active'; u.expiry = Math.max(Date.now(), u.expiry || 0) + days * DAY; }
      else if (b.action === 'block') u.status = 'blocked';
      else if (b.action === 'plan') u.plan = u.plan === 'paid' ? 'free' : 'paid';
      else if (b.action === 'devplus') u.maxDevices = (u.maxDevices || 2) + 1;
      else if (b.action === 'delete') { delete db.users[b.id]; devTokens(b.id).forEach(function (t) { delete db.devices[t]; }); }
      else return send(res, 400, 'application/json', '{"ok":false}');
      save();
      send(res, 200, 'application/json', '{"ok":true}');
    });
  }
  send(res, 404, 'text/plain', 'not found');
}

// ici-pro-ui
const PRO_CSS = '*{box-sizing:border-box}' +
'body{margin:0;min-height:100vh;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Arial,sans-serif;background:#0b1220;background-image:radial-gradient(900px 500px at 15% -10%,rgba(59,130,246,.22),transparent 60%),radial-gradient(700px 400px at 100% 0,rgba(34,197,94,.12),transparent 55%);background-attachment:fixed;color:#e2e8f0;padding:20px 16px;-webkit-font-smoothing:antialiased}' +
'.box{max-width:440px;margin:3vh auto;background:rgba(17,26,46,.88);border:1px solid #243049;border-radius:20px;padding:26px 22px;box-shadow:0 20px 50px rgba(0,0,0,.45)}' +
'.brand{display:flex;align-items:center;gap:12px;margin-bottom:6px}' +
'.logo{width:46px;height:46px;border-radius:13px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(59,130,246,.45);flex-shrink:0}' +
'.brand h1{font-size:21px;margin:0;color:#fff;letter-spacing:.2px}.brand small{display:block;color:#7c8aa5;font-size:12px;margin-top:2px}' +
'h2{margin:0 0 10px;color:#fff;font-size:20px}p{color:#94a3b8;line-height:1.55;font-size:14px;margin:8px 0}' +
'.chips{display:flex;gap:6px;flex-wrap:wrap;margin:14px 0 2px}.chip{font-size:11px;font-weight:600;color:#9db4d8;background:#14213a;border:1px solid #243049;padding:5px 10px;border-radius:20px}' +
'.tabs{display:flex;background:#0e1729;border:1px solid #243049;border-radius:12px;padding:4px;gap:4px;margin:18px 0 12px}' +
'.tabs button{flex:1;background:transparent;color:#8da0bf;padding:10px 6px;font-size:14px;border-radius:9px;font-weight:600}' +
'.tabs button.on{background:#2563eb;color:#fff;box-shadow:0 2px 8px rgba(37,99,235,.4)}' +
'.pane{display:none}.pane.on{display:block}.ttl{color:#fff;font-weight:700;font-size:16px}' +
'.steps{color:#94a3b8;font-size:13px;line-height:1.7;margin:8px 0 4px;padding-left:20px}' +
'label{display:block;margin:12px 0 5px;font-size:11px;font-weight:700;color:#9fb0cc;letter-spacing:.6px;text-transform:uppercase}' +
'input{width:100%;padding:13px 14px;border-radius:11px;border:1px solid #2a3858;background:#0b1424;color:#fff;font-size:16px;outline:none;margin:0}' +
'input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.22)}' +
'button{font-family:inherit;border:0;cursor:pointer;color:#fff;font-weight:700}' +
'.full{width:100%;margin-top:16px;padding:14px;font-size:15px;border-radius:11px;background:linear-gradient(180deg,#3b82f6,#2563eb);box-shadow:0 6px 16px rgba(37,99,235,.35)}.full:active{transform:translateY(1px)}.full.n{background:#334155;box-shadow:none}' +
'details{margin-top:14px;background:#0e1729;border:1px solid #243049;border-radius:11px;padding:10px 12px}' +
'summary{cursor:pointer;color:#cbd5e1;font-size:13px;font-weight:600}details div{color:#94a3b8;font-size:13px;line-height:1.6;margin-top:8px}' +
'.badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:5px 11px;border-radius:20px;margin:6px 0 4px}' +
'.b-wait{background:rgba(245,158,11,.15);color:#fbbf24}.b-bad{background:rgba(239,68,68,.15);color:#f87171}' +
'.foot{text-align:center;color:#5b6b88;font-size:11px;margin-top:18px}' +
'.card{background:#111a2e;border:1px solid #243049;border-radius:14px;padding:14px;margin:10px 0}.sub{color:#8da0bf;font-size:13px;margin:6px 0 10px;line-height:1.5}' +
'.row{display:flex;gap:6px;flex-wrap:wrap}.row button{padding:8px 12px;font-size:13px;border-radius:9px;background:#334155}.row button.g{background:#16a34a}.row button.r{background:#dc2626}';
function page(inner, script) {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b1220"><title>ICI Scanner</title><style>' + PRO_CSS + '</style></head><body>' + inner + '<script>' + (script || '') + '</script></body></html>';
}
const BRAND = '<div class="brand"><div class="logo"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg></div><div><h1>ICI Scanner</h1><small>Professional market scanner</small></div></div>';
const FOOT = '<div class="foot">Private access only</div>';
userPage = function (state) {
  if (state === 'none') return page('<div class="box">' + BRAND +
    '<div class="chips"><span class="chip">Live scanner</span><span class="chip">Multi-timeframe</span><span class="chip">Smart alerts</span></div>' +
    '<div class="tabs"><button id="t-new" class="on" onclick="tab(0)">New user</button><button id="t-login" onclick="tab(1)">I have an account</button></div>' +
    '<div id="p-new" class="pane on"><div class="ttl">Request access</div>' +
    '<ol class="steps"><li>Enter your name and WhatsApp/Telegram number</li><li>Create a PIN for logging in on other devices</li><li>Send the request. This page opens automatically once approved.</li></ol>' +
    '<label>Your name</label><input id="n" placeholder="e.g. Ali" maxlength="40" autocomplete="name">' +
    '<label>WhatsApp / Telegram number</label><input id="c" placeholder="e.g. 03001234567" maxlength="60" inputmode="tel">' +
    '<label>Create a PIN (min 6 characters)</label><input id="p" type="password" placeholder="PIN / password" maxlength="40">' +
    '<details><summary>What is this PIN for?</summary><div>' +
    '- It is your password. You need your number + PIN to log in on another device (PC, new phone) or after clearing your browser data.<br>' +
    '- On the device you register from, you stay logged in automatically.<br>' +
    '- Keep it private. Only 2 devices can use one account, and if someone else logs in with your PIN, your oldest device is logged out.<br>' +
    '- If you forget it, it cannot be recovered. The admin can set a new one for you, so please save it somewhere safe.</div></details>' +
    '<button class="full" onclick="reg()">Send Request</button></div>' +
    '<div id="p-login" class="pane"><div class="ttl">Log in</div>' +
    '<p>Already approved or purchased? Enter the number and PIN you registered with. You can use up to 2 devices, for example mobile and PC.</p>' +
    '<label>Your number</label><input id="lc" placeholder="The number you registered with" inputmode="tel">' +
    '<label>Your PIN</label><input id="lp" type="password" placeholder="PIN / password">' +
    '<details><summary>Forgot your PIN?</summary><div>Contact the admin on WhatsApp/Telegram with the number you registered with. The admin will set a new PIN for you, then you can log in again.</div></details>' +
    '<button class="full" onclick="login()">Log in</button></div>' + FOOT + '</div>', LAND_JS);
  if (state === 'pending') return page('<div class="box">' + BRAND + '<span class="badge b-wait">&#9679; Waiting for approval</span><h2>Request sent</h2><p>The admin will review your request. This page opens the app automatically once you are approved. You can close it and come back later.</p><p>Using another device? Open the site there and choose "I have an account".</p>' + FOOT + '</div>', POLL_JS);
  if (state === 'expired') return page('<div class="box">' + BRAND + '<span class="badge b-bad">&#9679; Access expired</span><h2>Your access period has ended</h2><p>Send a new request to continue using the app.</p><button class="full" onclick="send(true)">Request access again</button>' + FOOT + '</div>', REQ_JS);
  return page('<div class="box">' + BRAND + '<span class="badge b-bad">&#9679; Access blocked</span><h2>Account blocked</h2><p>Access for this account has been blocked. Please contact the admin.</p>' + FOOT + '</div>');
};
// ici-pro2
const PRO2_CSS = '<style>' +
'.wrap{max-width:980px;margin:4vh auto;display:grid;grid-template-columns:1.05fr 1fr;background:rgba(15,23,42,.92);border:1px solid #243049;border-radius:24px;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,.55)}' +
'.hero{padding:38px 34px;background:linear-gradient(160deg,#1d3a8a 0%,#1e2a5e 45%,#0f172a 100%);position:relative}' +
'.hero:after{content:"";position:absolute;inset:0;background:radial-gradient(500px 300px at 0 0,rgba(255,255,255,.10),transparent 60%);pointer-events:none}' +
'.hero>*{position:relative;z-index:1}' +
'.hero h2{font-size:28px;line-height:1.25;margin:26px 0 10px;color:#fff;font-weight:800;letter-spacing:-.3px}' +
'.hero .lead{color:#c3d0ee;font-size:14px;line-height:1.6;margin:0 0 22px}' +
'.feat{display:flex;gap:12px;align-items:flex-start;margin:14px 0}' +
'.fi{width:34px;height:34px;border-radius:10px;background:rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px}' +
'.feat b{display:block;color:#fff;font-size:14px}.feat span{color:#b6c4e4;font-size:12.5px;line-height:1.5}' +
'.how{margin-top:26px;padding-top:20px;border-top:1px solid rgba(255,255,255,.15)}' +
'.how h4{margin:0 0 12px;color:#fff;font-size:12px;letter-spacing:1px;text-transform:uppercase;opacity:.8}' +
'.st{display:flex;gap:11px;align-items:center;margin:10px 0;color:#dbe5fb;font-size:13.5px}' +
'.st i{width:24px;height:24px;border-radius:50%;background:#fff;color:#1e3a8a;font-style:normal;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
'.formside{padding:34px 30px;background:#0f172a}' +
'.formside .tabs{margin:0 0 18px}' +
'.formside .ttl{font-size:20px;font-weight:800;color:#fff;margin-bottom:4px}' +
'.formside .sm{color:#8da0bf;font-size:13px;margin:0 0 6px}' +
'.fld{position:relative}.fld svg{position:absolute;left:13px;top:50%;transform:translateY(-50%);opacity:.55}' +
'.fld input{padding-left:42px}' +
'.info{margin:14px 0 2px;background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.28);border-radius:12px;padding:12px 14px}' +
'.info b{display:block;color:#bcd2ff;font-size:13px;margin-bottom:6px}' +
'.info ul{margin:0;padding-left:18px;color:#9db0cf;font-size:12.5px;line-height:1.65}' +
'.info.warn{background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.3)}.info.warn b{color:#fcd34d}' +
'.sec{display:flex;align-items:center;justify-content:center;gap:6px;color:#62728f;font-size:11.5px;margin-top:16px}' +
'@media(max-width:780px){.wrap{grid-template-columns:1fr;margin:0 auto;border-radius:20px}.hero{padding:26px 22px}.hero h2{font-size:22px;margin-top:18px}.formside{padding:24px 20px}.hero .feat.hm{display:none}}' +
'</style>';
const IC_USER = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>';
const IC_PHONE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>';
const IC_LOCK = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>';
const LOGO = '<div class="brand"><div class="logo"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg></div><div><h1>ICI Scanner</h1><small>Professional market scanner</small></div></div>';
const _userPage2 = userPage;
userPage = function (state) {
  if (state !== 'none') return _userPage2(state);
  return page(PRO2_CSS + '<div class="wrap">' +
  '<div class="hero">' + LOGO +
    '<h2>Scan the markets smarter, faster.</h2>' +
    '<p class="lead">A private scanner for Forex, Crypto and Stocks. Access is by approval only.</p>' +
    '<div class="feat"><div class="fi">&#9889;</div><div><b>Live multi-timeframe scanner</b><span>1H, 4H, Daily and Weekly signals in one view</span></div></div>' +
    '<div class="feat"><div class="fi">&#128200;</div><div><b>Pro charts and drawing tools</b><span>Trendlines, long/short tools and more</span></div></div>' +
    '<div class="feat hm"><div class="fi">&#128276;</div><div><b>Smart alerts</b><span>Get notified on Telegram and WhatsApp</span></div></div>' +
    '<div class="how"><h4>How it works</h4>' +
      '<div class="st"><i>1</i>Send your access request</div>' +
      '<div class="st"><i>2</i>Admin approves it</div>' +
      '<div class="st"><i>3</i>The app opens automatically</div></div>' +
  '</div>' +
  '<div class="formside">' +
    '<div class="tabs"><button id="t-new" class="on" onclick="tab(0)">New user</button><button id="t-login" onclick="tab(1)">I have an account</button></div>' +
    '<div id="p-new" class="pane on"><div class="ttl">Request access</div><p class="sm">Fill in the details below. It takes less than a minute.</p>' +
      '<label>Your name</label><div class="fld">' + IC_USER + '<input id="n" placeholder="e.g. Ali" maxlength="40" autocomplete="name"></div>' +
      '<label>WhatsApp / Telegram number</label><div class="fld">' + IC_PHONE + '<input id="c" placeholder="e.g. 03001234567" maxlength="60" inputmode="tel"></div>' +
      '<label>Create a PIN (min 6 characters)</label><div class="fld">' + IC_LOCK + '<input id="p" type="password" placeholder="Choose a PIN you can remember" maxlength="40"></div>' +
      '<div class="info"><b>How does the PIN work?</b><ul>' +
        '<li>It is your password. Use your number + PIN to log in on another device (PC, new phone) or after clearing browser data.</li>' +
        '<li>On the device you register from, you stay logged in automatically.</li>' +
        '<li>Keep it private. One account works on 2 devices; if a third device logs in, the oldest one is logged out.</li>' +
        '<li>If you forget it, the admin can set a new one for you. Please save it somewhere safe.</li></ul></div>' +
      '<button class="full" onclick="reg()">Send Request</button></div>' +
    '<div id="p-login" class="pane"><div class="ttl">Welcome back</div><p class="sm">Approved or purchased? Log in with the number and PIN you registered with. Up to 2 devices (for example mobile and PC).</p>' +
      '<label>Your number</label><div class="fld">' + IC_PHONE + '<input id="lc" placeholder="The number you registered with" inputmode="tel"></div>' +
      '<label>Your PIN</label><div class="fld">' + IC_LOCK + '<input id="lp" type="password" placeholder="Your PIN"></div>' +
      '<div class="info warn"><b>Forgot your PIN?</b><ul><li>Contact the admin on WhatsApp/Telegram with the number you registered with. The admin will set a new PIN for you.</li></ul></div>' +
      '<button class="full" onclick="login()">Log in</button></div>' +
    '<div class="sec"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#62728f" stroke-width="2.4" stroke-linecap="round"><rect x="4" y="11" width="16" height="10" rx="3"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>Private access only. Your PIN is stored encrypted.</div>' +
  '</div></div>', LAND_JS);
};
// ici-fit
const FIT_CSS = '<style>' +
'html,body{height:100%;overflow:hidden}' +
'body{padding:0 !important;display:flex;align-items:center;justify-content:center}' +
'.wrap{margin:0 !important;width:min(980px,96vw);height:min(660px,96vh);max-height:96vh}' +
'.hero{padding:24px 28px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}' +
'.hero h2{font-size:24px;margin:16px 0 8px}.hero .lead{margin:0 0 12px;font-size:13px}' +
'.feat{margin:9px 0}.how{margin-top:14px;padding-top:12px}.st{margin:6px 0}' +
'.formside{padding:20px 26px;display:flex;flex-direction:column;justify-content:center;overflow:hidden}' +
'.formside .tabs{margin:0 0 10px}.formside .ttl{font-size:18px}.formside .sm{font-size:12px;margin:0 0 2px}' +
'label{margin:8px 0 4px;font-size:10.5px}' +
'input{padding-top:10px;padding-bottom:10px}' +
'.info{margin:10px 0 0;padding:9px 12px}.info b{font-size:12px;margin-bottom:4px}.info ul{font-size:11.5px;line-height:1.5}' +
'.full{margin-top:12px;padding:12px}.sec{margin-top:10px}' +
'@media(max-width:780px){.wrap{display:block;height:auto;max-height:96vh;overflow:hidden}.hero{display:none}.formside{padding:16px 16px}.info ul{font-size:11px}.info li:nth-child(n+3){display:none}.formside .sm{display:none}}' +
'@media(max-height:620px){.info li:nth-child(n+3){display:none}.hero .feat.hm,.hero .lead{display:none}}' +
'</style>';
const _userPage3 = userPage;
userPage = function (state) {
  const h = _userPage3(state);
  if (state !== 'none') return h;
  return h.replace('</head>', FIT_CSS + '</head>');
};
// ici-adminlink
const ADMLINK_JS = 'function adm(){var k=prompt("Admin password");if(!k)return;fetch("/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:k})}).then(function(r){return r.json();}).then(function(j){if(j.ok)location.href="/";else alert("Wrong password");});}';
const ADMLINK_HTML = '<div style="text-align:center;margin-top:10px"><a href="#" onclick="adm();return false" style="color:#5b6b88;font-size:12px;text-decoration:underline">Admin login</a></div>';
const _userPage4 = userPage;
userPage = function (state) {
  const h = _userPage4(state);
  if (state === 'blocked') return h;
  return h.replace('<script>', ADMLINK_HTML + '<script>' + ADMLINK_JS).replace(/<\/div><\/div>(<div style="text-align:center;margin-top:10px">)/, '</div>$1');
};
// ici-fit2
const FIT2_CSS = '<style>body{flex-direction:column !important}.wrap{height:auto !important;max-height:none !important;overflow:visible !important}.hero,.formside{overflow:visible !important}</style>';
const FIT2_JS = '<script>(function(){function f(){var w=document.querySelector(".wrap"),l=document.getElementById("adml");if(!w)return;w.style.zoom=1;var h=w.offsetHeight+(l?l.offsetHeight+10:0),a=window.innerHeight-12;w.style.zoom=Math.min(1,a/h);}window.addEventListener("resize",f);window.addEventListener("load",f);f();setTimeout(f,300);})();</script>';
const _userPage5 = userPage;
userPage = function (state) {
  const h = _userPage5(state);
  if (state !== 'none') return h;
  return h.replace('</head>', FIT2_CSS + '</head>')
    .replace('<div style="text-align:center;margin-top:10px">', '<div id="adml" style="text-align:center;margin-top:10px">')
    .replace('</body>', FIT2_JS + '</body>');
};
// ici-mask
function maskNum(c) {
  c = String(c || '');
  if (c.length <= 5) return c.slice(0, 1) + '****';
  return c.slice(0, 3) + '*'.repeat(Math.min(c.length - 5, 10)) + c.slice(-2);
}

const WLFILE = path.join(__dirname, 'data', 'watchlists.json');
let wlDb = {};
try { wlDb = JSON.parse(fs.readFileSync(WLFILE, 'utf8')); } catch (e) {}
function wlPersist() {
  fs.mkdirSync(path.dirname(WLFILE), { recursive: true });
  const t = WLFILE + '.tmp';
  fs.writeFileSync(t, JSON.stringify(wlDb));
  fs.renameSync(t, WLFILE);
}
function wlRoute(req, res, who) {
  const q = new URL(req.url, 'http://x').searchParams;
  if (req.method === 'GET') {
    const k = String(q.get('key') || '');
    if (!/^[a-zA-Z0-9_-]{1,60}$/.test(k)) return send(res, 400, 'application/json', '{"ok":false}');
    return send(res, 200, 'application/json', JSON.stringify({ ok: true, data: (wlDb[who] || {})[k] || null }));
  }
  if (req.method === 'POST') {
    let b = '', dead = false;
    req.on('data', function (c) { b += c; if (b.length > 300000) { dead = true; req.destroy(); } });
    req.on('end', function () {
      if (dead) return;
      let j = {}; try { j = JSON.parse(b || '{}'); } catch (e) {}
      const k = String(j.key || '');
      if (!/^[a-zA-Z0-9_-]{1,60}$/.test(k) || !j.data || !Array.isArray(j.data.tabs)) return send(res, 400, 'application/json', '{"ok":false}');
      if (!wlDb[who]) wlDb[who] = {};
      wlDb[who][k] = j.data;
      try { wlPersist(); } catch (e) { console.error('[wl] save failed', e.message); }
      send(res, 200, 'application/json', '{"ok":true}');
    });
    return;
  }
  send(res, 405, 'text/plain', 'method');
}

function settingsRoute(req, res, who) {
  if (!wlDb[who]) wlDb[who] = {};
  if (req.method === 'GET') return send(res, 200, 'application/json', JSON.stringify({ ok: true, data: wlDb[who].__settings || {} }));
  if (req.method === 'POST') {
    let b = '', dead = false;
    req.on('data', function (c) { b += c; if (b.length > 400000) { dead = true; req.destroy(); } });
    req.on('end', function () {
      if (dead) return;
      let j = {}; try { j = JSON.parse(b || '{}'); } catch (e) {}
      const cur = wlDb[who].__settings || {};
      const st = j.set || {};
      Object.keys(st).forEach(function (k) { if (k.length < 120 && typeof st[k] === 'string' && st[k].length < 100000 && (k in cur || Object.keys(cur).length < 300)) cur[k] = st[k]; });
      (Array.isArray(j.del) ? j.del : []).forEach(function (k) { delete cur[k]; });
      wlDb[who].__settings = cur;
      try { wlPersist(); } catch (e) { console.error('[settings] save failed', e.message); }
      send(res, 200, 'application/json', '{"ok":true}');
    });
    return;
  }
  send(res, 405, 'text/plain', 'method');
}

function gate(req, res, p) {
  try {
    if (p.indexOf('/access/') === 0) { accessRoute(req, res, p); return true; }
    if (p === '/api/settings') {
      const sid = resolveId(cookies(req).ici_uid);
      const sst = effective(db.users[sid]);
      const swho = sst === 'active' ? sid : (adminOk(req) ? 'admin' : null);
      if (!swho) { deny(req, res, p, sst); return true; }
      settingsRoute(req, res, swho); return true;
    }
    if (p === '/api/wl') {
      const wid = resolveId(cookies(req).ici_uid);
      const wst = effective(db.users[wid]);
      const who = wst === 'active' ? wid : (adminOk(req) ? 'admin' : null);
      if (!who) { deny(req, res, p, wst); return true; }
      wlRoute(req, res, who); return true;
    }
    if (p === '/admin' || p.indexOf('/admin/') === 0) { adminRoute(req, res, p); return true; }
    if (isLocal(req)) return false;
    if (adminOk(req)) return false; /* ici-admin-bypass */
    const st = effective(db.users[resolveId(cookies(req).ici_uid)]);
    if (st === 'active') return false;
    deny(req, res, p, st);
    return true;
  } catch (e) {
    console.error('[access]', e.message);
    try { send(res, 500, 'text/plain', 'error'); } catch (e2) {}
    return true;
  }
}
module.exports = { gate };
