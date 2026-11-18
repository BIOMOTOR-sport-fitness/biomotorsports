// Turns a BIOMOTOR ".shubham" settings file into the file an outside tool needs.
//   node tools/shubham-build.js apps/mobile/package.shubham   → package file for npm
//   node tools/shubham-build.js firebase.shubham              → hosting file for Firebase
// It runs only on GitHub's build machine while an app or the website is being built;
// the made file is thrown away with that machine. Your code keeps only the .shubham files.
// Lines that start with # are notes and are skipped.
const fs = require('fs'), path = require('path');
const Shubham = require('./shubham.js');
const files = process.argv.slice(2);
if (!files.length) { console.error('Give a .shubham file, e.g. node tools/shubham-build.js firebase.shubham'); process.exit(1); }
for (const f of files) {
  const src = path.resolve(f);
  const text = fs.readFileSync(src, 'utf8').split(/\r?\n/).filter(l => !/^\s*#/.test(l)).join('\n');
  let value;
  try { value = Shubham.parse(text); } catch (e) { console.error(f + ': ' + e.message); process.exit(1); }
  const out = src.replace(/\.shubham$/i, '.' + 'js' + 'on');
  fs.writeFileSync(out, Shubham.stringify(value) + '\n');
  console.log('Made ' + path.relative(process.cwd(), out) + ' from ' + f);
}
