# BIOMOTOR Sport and Fitness — Performance Platform

Athlete management, testing, training programs, live lifting (VBT), speed log, team analytics, recruiting showcase, events, payments (UPI) and organization admin — in one web app.

**Owner:** Shubham kale · founder.shubhamkale@gmail.com · 9321766523

## Files

```
index.html          page shell (sidebar, top bar, modal)
css/styles.css      all styles (dark / light themes)
js/app.js           the whole application
assets/upi-qr.jpg   Google Pay UPI QR used on Subscription & Payments
assets/bm-logo.png  BIOMOTOR full logo (transparent)
assets/bm-mark.png  BIOMOTOR "B" mark (transparent)
assets/bm-fav.png   browser tab icon
```

No build step, no server code. It is plain HTML + CSS + JavaScript.

## Run locally

Open `index.html` in Chrome / Edge / Safari. (For camera features use a local server: `npx serve .` or `python3 -m http.server`.)

## Put it on GitHub

1. Create a new repository on github.com (e.g. `biomotor-platform`).
2. **Add file → Upload files** → drag `index.html`, `README.md`, `netlify.toml`, `.gitignore` and the `css`, `js`, `assets` folders → **Commit changes**.

Or with git:

```bash
git init
git add .
git commit -m "BIOMOTOR Performance Platform"
git branch -M main
git remote add origin https://github.com/<your-username>/biomotor-platform.git
git push -u origin main
```

## Publish as a website

- **Netlify:** Add new site → Import from GitHub → pick the repo → Deploy (no build command, publish directory `.`).
- **GitHub Pages:** repo Settings → Pages → Source: `main` branch, `/ (root)` → Save.

## Where data is stored

All data is saved in the browser's local storage on each device. Use **Settings → Danger Zone → Export** to back up and **Restore** to load a backup. Shared multi-device data, real logins and automatic payment confirmation need a backend (e.g. Supabase + Razorpay) — planned next.

## Internet-loaded libraries

Chart.js (charts), qrcode-generator (QR codes), Google Fonts, MediaPipe (video jump body tracking). The app still works offline; those features fall back gracefully. Excel import/export uses BIOMOTOR's own SheetSK engine and works fully offline (.xlsx and CSV; old .xls files must be re-saved as .xlsx).

© 2026 BIOMOTOR Sport and Fitness

## Accounts & sign-in

The platform opens only after sign-in.

- **Owner (first launch):** the owner account is fixed to Shubham kale · founder.shubhamkale@gmail.com · 9321766523. On first open, confirm the owner mobile number and create a password. A one-time recovery code is shown — keep it safe; it resets the owner password.
- **Everyone else:** tap *Create account*. New accounts stay *Pending* until the owner approves them in **Coaches & Users → Owner control**. People who open an invite link get an active account straight away with the invited role.
- **Owner control:** approve/reject sign-ups, change roles, disable/enable, reset passwords (temporary password via WhatsApp) and delete logins. The owner account cannot be changed or removed.
- Admin pages (Organization, Coaches & Users, Onboarding, Facility, Branding, Settings, Subscription, Payments, Beta) are visible only to the Owner and Organization Admins.
- **Device-only mode** (no cloud keys): passwords are stored as PBKDF2-SHA256 hashes in this browser (`biomotor_accounts_v1`).
- **Cloud mode (Supabase, free):** one login and the same data on every phone and computer, with live sync. Follow `supabase/SETUP-SUPABASE.md`: run `supabase/setup.sql`, then put your Project URL and anon key in `sk/config.sk`.

## Apps (Android, iPhone, Windows, Mac, Linux)

- **Website download page:** `download.html` (also `/download` on Netlify). It detects the visitor's device and shows the right button. The platform links to it from the login page and the sidebar (**📲 Download app**).
- **Install from the browser (all devices):** the platform is an installable web app (`manifest.webmanifest` + `sw.js`). Android/Chrome/Edge show **Install**; iPhone uses Safari → Share → Add to Home Screen. It also opens offline.
- **App files (APK / EXE / DMG / AppImage):** built automatically on GitHub.
  1. Put the repo name in `sk/config.sk` → `github = your-user/your-repo`, and push.
  2. GitHub → **Actions** → **Build BIOMOTOR apps** → **Run workflow** (or push a tag like `v1.0.0`).
  3. After ~15 minutes the files appear under **Releases**: `BIOMOTOR-Android.apk`, `BIOMOTOR-Windows-Setup.exe`, `BIOMOTOR-Mac.dmg`, `BIOMOTOR-Linux.AppImage`. The download page links to the latest release automatically.
- Android project: `apps/mobile` (Capacitor). Desktop project: `apps/desktop` (Electron). `tools/prepare-web.js` copies the website into each app and bakes in the Supabase keys from `sk/config.sk`.
- Store publishing (Google Play / Apple App Store) needs developer accounts and app signing — not required for the download page.

## Google Cloud + Supabase
Full steps: `supabase/SETUP-GOOGLE-CLOUD.md`.
- Website hosting on Google Cloud (Firebase Hosting): `firebase.shubham`, auto-deploy workflow `.github/workflows/deploy-google-cloud.yml` (no key file — Workload Identity, set up with `tools/google-cloud-link.sh`).
- Shubham settings files: `firebase.shubham`, `apps/mobile/package.shubham`, `apps/desktop/package.shubham`. `tools/shubham-build.js` turns them into the files npm and Firebase need, only on GitHub's build machine.
- Database: Supabase, with BIOMOTOR's own data type **shubham** (`supabase/setup.sql`). Optional Cloud Run: `Dockerfile` + `nginx.conf`.
- Login and data: Supabase (`supabase/setup.sql`), with **Continue with Google** sign-in through a Google Cloud OAuth client.

## biomotorsports.com
The main website (GoDaddy) links to the platform at **app.biomotorsports.com**. Steps: `website/LINK-BIOMOTORSPORTS-COM.md`; ready-made section to paste: `website/biomotorsports-app-section.html`.

## Body tracking (Google MediaPipe)
- Engine: **MediaPipe Pose Landmarker** (Tasks API, `@mediapipe/tasks-vision` 0.10.14) — 33 body landmarks + 3D world landmarks, VIDEO mode, GPU with CPU fallback; legacy `@mediapipe/pose` as last fallback.
- Models: lite (Fast) · full (Balanced) · heavy (Accurate) — chosen in the live screen.
- Self-hosting: `node tools/fetch-mediapipe.js` downloads the library, WASM and models into `assets/mediapipe/` (≈ 45 MB). The Google Cloud deploy and app-build workflows run it automatically; without it the platform loads the same files from jsDelivr / Google.
- The installed app caches the files after the first use, so tracking also works offline.
- Check a device: Video Jump Test or Speed Log → **🦴 Check body tracking** (engine, GPU/CPU, model, frames per second).
