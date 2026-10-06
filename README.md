# Akwete mobile app (HNG Internship 15, Lesson 3, individual task)

A phone version of the Akwete shop. It uses the **same Supabase project** as the website, so accounts, products, orders and the shopping bag are shared.

| What the task asks | How it is done |
|---|---|
| Mobile counterpart of the Lesson 2 shop | Expo + React Native app: Shop, Product, Bag, Checkout, Orders, Account |
| Same backend / API endpoints | Same Supabase URL and anon key as the website; reads `products`, calls `place_order()` and the `send-order-email` function, reads `orders` |
| Same user account backend | Google sign-in through Supabase Auth (the same Google users) |
| Cart synchronisation between web and mobile | The bag is one row per user in the `carts` table; both apps read and write it, with live updates |
| Run on a physical phone with a launcher icon | Build an installable Android app (APK) with EAS, steps below |
| Screen recording | Script at the bottom |

Not needed for this lesson (per the guide): Mailgun, Play Store publishing, APK submission. Email still works because the same `send-order-email` function is used.

## Cart audit (what the guide asks you to check first)
The website's bag is **not only browser storage**. It is saved in Supabase, table `carts` (`user_id` primary key, `items` JSON), protected by row level security so each person sees only their own row. The website writes to it a moment after every change and re-reads it when you return to the tab, and (with Realtime on) instantly when another device changes it. The mobile app uses exactly the same rows, so true synchronisation is possible.

Rules used by both apps: when you sign in on a device for the first time, the device's bag and the saved bag are merged (the larger quantity wins). After that the saved bag wins. When an order is placed, the database deletes the saved bag, so both apps empty.

## Part A: one-time Supabase settings
1. **Redirect URLs.** Supabase > Authentication > URL Configuration > Redirect URLs. Add both:
   - `akwete://auth-callback` (the installed app)
   - `exp://**` (testing in Expo Go)
   Keep your website URL there too.
2. **Live updates (recommended).** Supabase > SQL Editor > run `enable-realtime.sql` (it is in the website folder under `supabase/`). Without it the bag still syncs when you reopen the app or pull down to refresh, but not instantly.
3. If you added products earlier, make sure you already ran `add-cloths.sql` on the website side.
4. Google sign-in needs no new setup. The phone signs in through the same Supabase Google provider as the website.

## Part B: put your keys in the app
Open `src/config.ts` and paste the same Supabase URL and anon key as the website's `js/config.js`.

## Part C: try it quickly on your phone (Expo Go)
You need Node.js on a computer (or a GitHub Codespace), and the free **Expo Go** app on your Android phone.
```
npm install
npx expo start
```
Scan the QR code with Expo Go. The app opens. Expo Go shows Expo's own icon, so for the launcher-icon requirement continue to Part D.

## Part D: install a real app with its own icon (APK)
1. Create a free account at expo.dev.
2. On your computer:
```
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```
3. Wait for the cloud build (it can take a while on the free plan). When it finishes, EAS shows a link and QR code for the `.apk`.
4. Open that link on your phone, download, and install. If Android asks, allow "install from this source".
5. The **Akwete tortoise icon** now appears with your other apps. Open it from there.

If you change `src/config.ts` or the icon later, run the build again.

### Choosing the icon
The tortoise icon (from your first logo) is the default. To use the woven-diamond logo instead:
```
node scripts/use-icon.js woven
```
and rebuild. Switch back with `node scripts/use-icon.js tortoise`.

## Part E: the screen recording (suggested order, about 2 minutes)
1. Show the home screen of the phone, then tap the **Akwete icon** to launch the app.
2. Open **Account** and tap **Continue with Google**. Sign in. The screen shows your name.
3. On the **website** (on a computer, or the phone browser in another tab) sign in with the same Google account.
4. Add a piece on the website. Switch to the app's **Bag** tab: it appears (live, or after pull-down refresh). The Bag screen shows "Synced with your account".
5. Add another piece in the **app**. Show it appearing on the website's bag.
6. Change a quantity or remove an item in the app and show the website follow.
7. (Optional) Place an order in the app, show **Orders**, and show the bag is empty on both.

Show the website and the phone side by side if you can. Say aloud that both use the same Supabase project.

## Troubleshooting
- **Sign-in opens a browser then comes back with an error:** the Redirect URLs in Part A are missing. Add `akwete://auth-callback` (installed app) or `exp://**` (Expo Go).
- **"Unsupported provider: provider is not enabled":** Google is not enabled in Supabase (Authentication > Sign In / Providers > Google).
- **Products or bag do not load:** check `src/config.ts` has the real URL and key, not the placeholders. The Account tab shows a warning if not.
- **Bag shows "Could not sync":** pull down on the Bag to retry; check you ran the original `schema.sql` (the `carts` table and its policies).
- **No instant updates:** run `enable-realtime.sql`. Pull-down refresh and reopening the app always work.
- **Checkout says the product is unknown:** run `add-cloths.sql` in Supabase.
- **Confirmation email did not arrive:** the order is saved; use "Resend confirmation email" and check the function logs in Supabase.

## What is not in the app (yet)
"Build your Akwete" (the custom designer), the motif explorer, the history pages and the Igbo language switch are on the website only. Custom pieces made on the website do appear in the app's bag, because they are stored in the same bag row.
