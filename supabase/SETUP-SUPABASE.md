# Supabase setup (free) — BIOMOTOR Sport and Fitness

Owner: Shubham kale · founder.shubhamkale@gmail.com · 9321766523

With Supabase connected, every coach, athlete and parent signs in from any phone or computer and sees the same data. You stay in control: new accounts wait for your approval.

## 1. Create the project (5 minutes)
1. Open https://supabase.com and click **Start your project**. Sign in with **founder.shubhamkale@gmail.com** (Google sign-in is fine).
2. Click **New project**:
   - Name: `biomotor`
   - Database password: create a strong one and save it.
   - Region: **South Asia (Mumbai)**
   - Plan: **Free**
3. Wait about 2 minutes until the project is ready.

## 2. Create the tables and security rules
1. Left menu → **SQL Editor** → **New query**.
2. Open `supabase/setup.sql` from this code, copy all of it, paste it, and click **Run**.
3. "Success. No rows returned" means it worked.

## 3. Login settings
Left menu → **Authentication**:
- **Sign In / Providers → Email**: keep **Email** enabled and keep **Confirm email ON**. This stops anyone from using your owner email.
- **URL Configuration → Site URL**: your website address, e.g. `https://biomotor.netlify.app`. Add the same address under **Redirect URLs**. Confirmation and password-reset links open this address.

## 4. Put the keys in the code
Left menu → **Project Settings → API** (or **Data API**). Copy:
- **Project URL**, e.g. `https://abcd1234.supabase.co`
- **anon public** key (the long `eyJ…` key). Never use the `service_role` key.

Then:
- **GitHub / website code:** open `sk/config.sk` and paste both values after the `=` sign:
  ```
  url = https://abcd1234.supabase.co
  key = eyJ...
  ```
- **Single-file version:** near the top of `biomotor-single-file.html`, find
  `globalThis.BIOMOTOR_CLOUD={url:'',key:''};` and paste the two values there.

Upload the website again (GitHub → Netlify redeploys automatically).

## 5. First sign-in (owner)
1. Open the website → **Create account** with **founder.shubhamkale@gmail.com** and a password.
2. Open the confirmation email and click the link.
3. Sign in. You become **Owner** automatically, and your data from this device uploads to the cloud.

## 6. Daily use
- Coaches, athletes and parents tap **Create account** and confirm their email. They wait until you approve them in **Coaches & Users → Owner control → Approve**. A bell notification tells you when someone is waiting.
- If you send an **invite link**, that person's account opens automatically after they confirm their email.
- **Forgot password:** anyone (including you) taps *Forgot password?* and gets a reset link by email. As owner you can also tap **Send reset link** for any account.
- **Disable / Remove** blocks a person immediately on every device.
- Changes save to the cloud about one second after each edit. Other open devices update live.

## Good to know
- The free plan gives 500 MB of database and 50,000 monthly users. That is plenty for a club.
- Free projects pause after 7 days with no activity. Open the dashboard and click **Restore** if that happens. Normal daily use keeps it awake.
- The whole organisation is one shared record, and the last save wins. If two people edit the same item at the same moment, the later save is kept.
- Public pages (event registration, recruiting profile, TV display) still show this device's copy of the data. Visitors without an account can't submit into the cloud yet.
- Backups: Settings → Danger zone → Export still works. Download one regularly.
