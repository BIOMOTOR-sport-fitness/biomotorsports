# Link biomotorsports.com with the BIOMOTOR platform

Your website **biomotorsports.com** stays as it is. It is built on GoDaddy's website builder.

The platform gets its own address on your domain: **https://app.biomotorsports.com**.

The two sites link to each other:

| From | To |
|---|---|
| biomotorsports.com menu → **Login** | app.biomotorsports.com |
| biomotorsports.com → **App & Login** section | login + Download App |
| Platform login page, sidebar and Download page | 🌐 biomotorsports.com |

Do these steps after the platform is on Firebase Hosting (see `supabase/SETUP-GOOGLE-CLOUD.md`, Part 2).

---

## Step 1 — Put the platform on app.biomotorsports.com
1. Firebase console → your project → **Hosting** → **Add custom domain**.
2. Type `app.biomotorsports.com` → Continue.
3. Firebase shows DNS records, usually an **A** record (and sometimes a **TXT** record). Keep this page open.
4. In a new tab, open **GoDaddy → My Products → biomotorsports.com → DNS** (Manage DNS).
5. **Add New Record** for each record Firebase showed:
   - Type **A** · Name `app` · Value = the IP address Firebase shows · TTL 1 hour.
   - Type **TXT** · Name `app` (or what Firebase shows) · Value = the text Firebase shows.
   - Do **not** change the records for `@` or `www`. Those keep your main website working.
6. Back in Firebase, click **Verify**.
   - DNS can take from 15 minutes to a few hours.
   - Firebase then adds a free SSL certificate automatically, so the 🔒 shows.
7. Check: https://app.biomotorsports.com opens the login page, and https://app.biomotorsports.com/download opens the Download page.

## Step 2 — Tell Supabase and Google the new address
- **Supabase → Authentication → URL Configuration**:
  - Site URL: `https://app.biomotorsports.com`
  - Redirect URLs: add `https://app.biomotorsports.com/**` (keep the `.web.app` one too)
- **Google Cloud → APIs & Services → Credentials → your OAuth client**:
  - Authorised JavaScript origins: add `https://app.biomotorsports.com`
- **Google Cloud → OAuth consent screen → Authorised domains**: add `biomotorsports.com`

## Step 3 — Add a "Login" button to biomotorsports.com
GoDaddy website builder → **Edit Website**:
1. **Site Navigation** (or Pages) → **Add** → **Link** (to a web address).
2. Name: `Login` (or `Athlete Login`) · Link: `https://app.biomotorsports.com` · tick **Open in new tab**.
3. Optional: change the header button's link the same way, e.g. a second button **App Login**.

## Step 4 — Add the "App & Login" section
1. Edit the **Home** page → **Add Section** → search **HTML** → add it.
2. Open `website/biomotorsports-app-section.html`, copy everything, and paste it into the HTML box.
3. Click **Done**, then **Publish**.

The section shows a red BIOMOTOR banner with two buttons: **Athlete & Coach Login** and **Download the App**.

## Step 5 — Check
- biomotorsports.com → Login → opens the platform.
- Platform login page → 🌐 biomotorsports.com → opens your website.
- On a phone: biomotorsports.com → Download the App → shows the Android / iPhone install buttons.

The website address used inside the platform can be changed any time in **Organization → Website**.
