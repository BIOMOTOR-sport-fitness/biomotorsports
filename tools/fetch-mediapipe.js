// Downloads Google MediaPipe Pose Landmarker into assets/mediapipe so the platform
// runs body tracking from its own website / app (faster, works offline, no CDN needed).
// Usage:  node tools/fetch-mediapipe.js          (Node 18+; run before deploying or building apps)
const fs = require('fs'), path = require('path');
const V = '0.10.14';
const out = path.resolve(__dirname, '..', 'assets', 'mediapipe');
const files = [
  [`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${V}/vision_bundle.mjs`, 'vision_bundle.mjs'],
  ...['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']
    .map(f => [`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${V}/wasm/${f}`, 'wasm/' + f]),
  ...['lite', 'full', 'heavy'].map(m => [`https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_${m}/float16/1/pose_landmarker_${m}.task`, `pose_landmarker_${m}.task`])
];
(async () => {
  fs.mkdirSync(path.join(out, 'wasm'), { recursive: true });
  for (const [url, name] of files) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(out, name), buf);
    console.log('✓', name, (buf.length / 1048576).toFixed(1), 'MB');
  }
  fs.writeFileSync(path.join(out, 'VERSION.txt'), `@mediapipe/tasks-vision ${V}\nPose Landmarker lite / full / heavy (float16)\n`);
  console.log('MediaPipe ready in', out);
})().catch(e => { console.error('MediaPipe download failed:', e.message); process.exit(1); });
