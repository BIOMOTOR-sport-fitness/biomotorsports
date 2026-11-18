// Copies the website into an app folder (Android / desktop) and bakes in the cloud settings.
// Usage: node tools/prepare-web.js <outDir>
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'), out = path.resolve(process.argv[2] || 'www');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const copy = (src, dst) => { const s = path.join(root, src), d = path.join(out, dst || src);
  if (!fs.existsSync(s)) return; if (fs.statSync(s).isDirectory()) fs.cpSync(s, d, { recursive: true }); else { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); } };
['index.html', 'css', 'js', 'assets', 'sk', 'manifest.webmanifest'].forEach(x => copy(x));
// read url/key from sk/config.sk
const cfg = {}; try { fs.readFileSync(path.join(root, 'sk/config.sk'), 'utf8').split(/\r?\n/).forEach(l => { l = l.trim(); if (!l || l[0] === '#') return; const i = l.indexOf('='); if (i < 0) return; cfg[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim().replace(/^['"]|['"]$/g, ''); }); } catch (e) {}
let html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
// Shubham quote: writes a value as a safe JavaScript string
const shubham = v => "'" + String(v).replace(/[\\'\n\r<>\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')) + "'";
const cloud = cfg.url && cfg.key ? `globalThis.BIOMOTOR_CLOUD={url:${shubham(cfg.url)},key:${shubham(cfg.key)}};` : '';
html = html.replace(/<script>globalThis\.BIOMOTOR_CONFIG='sk\/config\.sk'<\/script>/, `<script>globalThis.BIOMOTOR_NATIVE=true;${cloud}</script>`);
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('Web app copied to', out, cloud ? '(cloud settings included)' : '(device-only mode — no cloud keys in sk/config.sk)');
