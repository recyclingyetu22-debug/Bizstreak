# BizStreak — business habit tracker

A working, offline-first habit tracker for entrepreneurs. Free tier: 3 habits.
Pro tier (mock, not wired to real payments yet): unlimited habits.

## What's built

- Add/track/edit/delete/reorder daily business habits (stock checks, invoice follow-ups, sales logging, etc.)
- GitHub-style streak grid, current/best streak, 30-day completion rate
- All data stored locally on-device (AsyncStorage) — no backend, no login, no hosting cost
- Free tier capped at 3 habits; adding a 4th opens the paywall screen
- Paywall UI with monthly/yearly/lifetime plans (currently a **mock unlock** — see below)
- 3-slide first-launch onboarding
- "Today's progress" bar on the home screen
- Haptic feedback when checking off a habit
- Daily local reminder notification (pick a time in Settings)
- Shareable streak-card image — captures a branded summary card and opens the
  native share sheet (this is the main *growth* feature: people sharing a
  streak to WhatsApp/Instagram is how habit apps actually get new users,
  more than any single extra screen would)
- Light/dark theme, switchable in Settings

### Deliberately not included (and why)

- **Home screen widgets** — need a custom native "dev build," not Expo Go.
  Worth adding once you're past initial validation; ask me and I'll set up
  `eas build --profile development` for it.
- **Streak freeze / vacation days** — a real retention feature (Duolingo-style),
  skipped for now to keep the free/pro split simple; easy follow-up.
- **Cloud sync / accounts** — kept out on purpose, per the local-only,
  zero-infra-cost model this app is built around.

## Running it

```bash
cd bizstreak
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS or Android) on your phone to test it live —
no developer account needed for this step.

## Rename it

Everything is called "BizStreak" as a placeholder. To rename:

1. `app.json` → change `"name"` and pick a real `bundleIdentifier` (iOS) /
   `package` (Android), e.g. `com.yourcompany.yourappname`. These must be
   unique across their respective store and **cannot be changed after your
   first submission**, so decide before publishing.
2. `src/screens/HomeScreen.tsx` → the `BizStreak` title text.
3. Replace `assets/icon.png` and the Android adaptive icon images with your
   own artwork.

## Publishing WITHOUT a Mac

Normally iOS builds need Xcode on a Mac. Expo's **EAS Build** does the iOS
compile in Expo's cloud instead, so you can ship from any computer:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android   # produces an .aab for Google Play
eas build --platform ios       # produces an .ipa for the App Store — no Mac needed
eas submit --platform android
eas submit --platform ios
```

You still need, separately: a **Google Play Console** account ($25 one-time)
and an **Apple Developer** account ($99/year) — EAS builds and can submit for
you, but the store accounts themselves have to be yours.

## Turning the mock paywall into real payments

Right now tapping "Continue" on the paywall just flips a local flag — nothing
is actually charged. To take real money:

1. Create products in **App Store Connect** and **Google Play Console**:
   a monthly subscription, a yearly subscription, and a lifetime
   non-consumable, with matching IDs across both stores.
2. Sign up for **RevenueCat** (free until ~$2.5k/month tracked revenue) and
   connect both stores' credentials — it's the standard way to handle
   subscriptions across iOS and Android without writing store-specific
   billing code twice.
3. `npm install react-native-purchases` and follow RevenueCat's Expo guide.
4. In `src/screens/PaywallScreen.tsx`, replace the `handleUnlock` mock (it's
   commented with a `TODO` explaining exactly this) with a real
   `Purchases.purchasePackage(...)` call, and set `isPro` from the returned
   entitlement instead of a hardcoded `true`.
5. In `src/screens/SettingsScreen.tsx`, wire "Restore purchases" to
   `Purchases.restorePurchases()`.

You cannot fully test real purchases until the store products above exist
and the app has been through at least an internal test build — this is
normal and every app goes through it.

## Suggested pricing (already in the paywall UI)

- Monthly: $2.99
- Yearly: $19.99 (framed as the best value)
- Lifetime: $34.99

These numbers follow the pattern of profitable low-overhead habit apps:
cheap enough that people don't think twice, with a lifetime option for
people who dislike subscriptions.

## Getting your first users (App Store Optimization)

Downloads for an app like this come almost entirely from people searching
the store, not ads. Before submitting:

- Pick an app name/subtitle containing the words people actually search:
  "habit tracker", "business habits", "daily discipline".
- Write the store description around the specific pain (staying disciplined
  as a small business owner), not generic features.
- Get 5-10 screenshots showing the streak grid — it's the app's visual hook.
- Launch in English first; add French once you have traction, since you can
  reach both Anglophone and Francophone entrepreneurs across the markets you
  already work in.

## What's intentionally not built yet

- Daily reminder notifications (mentioned in the paywall as a Pro feature —
  needs `expo-notifications`, straightforward to add next)
- Real payments (see above)
- Cloud sync (deliberately skipped — local-only keeps this free to run)
