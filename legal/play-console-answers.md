# BizStreak — Google Play Console answer sheet

Prepared while waiting for the developer account to be approved. Everything
here is accurate to how the app actually behaves today.

## 1. Create app
- App name: **BizStreak**
- Default language: English (United States)
- App or game: **App**
- Free or paid: **Free** (in-app purchases are declared separately)
- Tick both declarations (Developer Program Policies, US export laws)

## 2. Store listing
- Short + full description: `legal/store-listing.md`
- App icon: `store-screenshots/05-play-store-icon-512.png` (512x512)
- Feature graphic: `store-screenshots/00-feature-graphic.png` (1024x500)
- Phone screenshots: `store-screenshots/01-home.png` ... `04-paywall.png`
- Category: Business (Productivity is an acceptable alternative)
- Contact email: tenzitradingltd@gmail.com
- Privacy policy URL: https://recyclingyetu22-debug.github.io/Bizstreak/privacy-policy.html

## 3. App content declarations
- App access: all functionality available without login or special access
- Ads: **No ads**
- Target audience: **18 and over** (not directed at children; avoids Families policy)
- Advertising ID: **No**
- Government app / financial features / health features / news app: **No** to all
- Content rating questionnaire: category "Utility / Productivity". Answer **No**
  to violence, sexual content, profanity, drugs, gambling, user-generated
  content, and location sharing. Expected result: rated for everyone.

## 4. Data safety form
NOTE: an earlier suggestion that the answer is "no data collected" was
wrong. The app ships the RevenueCat SDK, and RevenueCat's own Google Play
guidance says to declare purchase history. Answers:

- Does the app collect or share any required user data types? **Yes**
- Data type: **Financial info -> Purchase history**
  - Collected (RevenueCat processes it on your behalf), not used for ads
  - Purposes: App functionality (RevenueCat also lists Analytics)
  - Required, cannot be turned off
- Personal info, location, contacts, health, photos, files: **not collected**
  (habit data never leaves the device)
- Encrypted in transit: **Yes**
- Way for users to request deletion: **Yes** — email tenzitradingltd@gmail.com
  (purchase records can be deleted from the RevenueCat dashboard; habit data
  is deleted by uninstalling)

Source: https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety
Re-read that page before submitting in case it changed.

## 5. In-app products (create after the app exists)
| Product | Type | Suggested ID | Price |
|---|---|---|---|
| Pro Monthly | Subscription | `bizstreak_pro_monthly` | $1.00 |
| Pro Yearly | Subscription | `bizstreak_pro_yearly` | $9.99 |
| Pro Lifetime | One-time product | `bizstreak_pro_lifetime` | $30.00 |

Then in RevenueCat: add an Android app with package `com.tenzi.bizstreak`,
connect Google Play credentials, attach the three products to the
`bizstreak_pro` entitlement, and send the `goog_...` public key to be put
in `app.json` (replacing the Test Store key).

## 6. Closed test (required before production for new personal accounts)
- Testing -> Closed testing -> create track, upload the production AAB
- **At least 12 testers**, who must stay opted in for **14 days**
- Add testers by Gmail address (or a Google Group), then share the opt-in link
- Apply for production access afterwards

## 7. Message to send testers
> Hi! I'm launching a small app called BizStreak (a habit tracker for
> business owners). Could you help me test it? 1) Send me your Gmail
> address so I can add you. 2) Open this link and tap "Become a tester":
> [OPT-IN LINK]. 3) Install it from Google Play and open it now and then
> over the next 2 weeks. Please don't uninstall it until I tell you. Thank you!
