# BIOMOTOR on Google Cloud + Supabase

Owner: Shubham kale · founder.shubhamkale@gmail.com · 9321766523

How the pieces fit:

| Part | Where it runs | What it does |
|---|---|---|
| Website + app files | **Google Cloud – Firebase Hosting** (free) | `https://<project>.web.app`, HTTPS, fast in India |
| Login + data | **Supabase** (free) | accounts, owner approval, sync on every device |
| “Continue with Google” | **Google Cloud OAuth** + Supabase | people sign in with their Gmail |
| App builds (APK / EXE / DMG) | GitHub Actions | files on the Download page |

Do the steps in this order. Total time about 30–40 minutes, one time only.

---

## Part 1 — Supabase (if not done yet)
Follow `supabase/SETUP-SUPABASE.md` steps 1–4:
- create the project,
- run `supabase/setup.sql`,
- turn on email confirmation,
- put the **url** and **key** in `sk/config.sk`.

If you already ran `setup.sql`, run it **again**. This version also reads the name from Google sign-in.

## Part 2 — Google Cloud project (Firebase Hosting)
You already have a Google Cloud project (free trial). Use the same one.
1. Open https://console.firebase.google.com and sign in with **founder.shubhamkale@gmail.com**.
2. **Create a project** → at the bottom choose **"Add Firebase to Google Cloud project"** → pick your existing Google Cloud project → Continue. Google Analytics: optional.
3. Note the **Project ID** (Project settings → General), e.g. `biomotor-sports-1a2b3`.
4. Left menu → **Build → Hosting → Get started**. Skip the CLI screens: just click **Next / Continue**.

> ⚠ Do **not** create a Cloud SQL instance. Supabase is the platform's database. Cloud SQL would use up the $300 trial credit and is billed after the trial.

### Automatic publishing from GitHub — no key file (Workload Identity)
1. https://console.cloud.google.com → choose your project → top right **Activate Cloud Shell** (the `>_` icon).
2. Paste this one line (put your GitHub username and Project ID) and press Enter:
   ```
   bash <(curl -sL https://raw.githubusercontent.com/GITHUB-USER/biomotor-platform/main/tools/google-cloud-link.sh) PROJECT-ID GITHUB-USER/biomotor-platform
   ```
   If Google asks **Authorize**, click Authorize. It takes 1–2 minutes and ends with ✅ and 3 values.
3. GitHub repo → **Settings → Secrets and variables → Actions → Variables** tab → **New repository variable**, three times:
   - `FIREBASE_PROJECT_ID`
   - `GCP_WIF_PROVIDER`
   - `GCP_SERVICE_ACCOUNT`
4. GitHub → **Actions → Deploy to Google Cloud → Run workflow**.
5. After 2–4 minutes the site is live at **https://YOUR-PROJECT-ID.web.app**. The download page is at `/download`.

No key file is downloaded anywhere: GitHub proves who it is to Google directly, and only your repository is allowed.

**Own domain** (e.g. app.biomotor.in): Firebase → Hosting → **Add custom domain** and follow the DNS steps.

## Part 3 — Tell Supabase the new address
Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://YOUR-PROJECT-ID.web.app`
- **Redirect URLs**: add `https://YOUR-PROJECT-ID.web.app/**` (and your own domain if you add one).

## Part 4 — “Continue with Google” sign-in
1. Open https://console.cloud.google.com and select the **same project**.
2. **APIs & Services → OAuth consent screen**:
   - User type **External** → Create.
   - App name **BIOMOTOR Sport and Fitness**; support email founder.shubhamkale@gmail.com; logo optional.
   - Authorised domains: `supabase.co`, and `web.app` or your own domain.
   - Save. Then **Publish app** → **In production**, so anyone can sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type **Web application**, name `BIOMOTOR Supabase`.
   - **Authorised JavaScript origins**: `https://YOUR-PROJECT-ID.web.app`
   - **Authorised redirect URIs**: `https://YOUR-SUPABASE-REF.supabase.co/auth/v1/callback`
     (copy it exactly from Supabase → Authentication → Providers → Google → *Callback URL*)
   - Create → copy the **Client ID** and **Client secret**.
4. Supabase → **Authentication → Providers → Google** → Enable → paste the Client ID and Client secret → Save.
5. Open the website: **Continue with Google** now works.
   - **founder.shubhamkale@gmail.com** becomes **Owner** automatically.
   - Everyone else waits for your approval in **Coaches & Users → Owner control**.

## Part 5 — Apps
Put `github = your-user/your-repo` in `sk/config.sk`, push, then GitHub → **Actions → Build BIOMOTOR apps → Run workflow**. See the README.

- The installed **Android / Windows / Mac** apps use email + password sign-in. Google sign-in works on the website and in the app installed from the browser.
- iPhone users install from the website (Safari → Share → Add to Home Screen), so Google sign-in works there too.

## Optional — Google Cloud Run instead of Firebase Hosting
The code also has a `Dockerfile`. With the gcloud CLI:
```
gcloud run deploy biomotor --source . --region asia-south1 --allow-unauthenticated
```
Firebase Hosting is simpler and free, so use Cloud Run only if your company needs it.

## Costs
- Firebase Hosting free plan: 10 GB storage, 360 MB/day transfer — enough for a club.
- Supabase free plan: 500 MB database, 50,000 monthly users.
- Google OAuth: free.
