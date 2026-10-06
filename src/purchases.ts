import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import type { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';

// Create these in your RevenueCat dashboard (app.revenuecat.com) after
// creating matching products in App Store Connect and Google Play Console,
// then paste the resulting public SDK keys into app.json's expo.extra.
// Never hardcode real keys here — app.json is what gets committed.
const API_KEY_IOS = (Constants.expoConfig?.extra?.revenueCatApiKeyIos as string | undefined) ?? '';
const API_KEY_ANDROID = (Constants.expoConfig?.extra?.revenueCatApiKeyAndroid as string | undefined) ?? '';

// The Entitlement identifier from the RevenueCat dashboard (Entitlements
// tab) — "bizstreak_pro" is what RevenueCat auto-created for this project;
// the monthly, yearly, and lifetime products all need to be attached to
// this same entitlement so any one of them unlocks Pro.
export const PRO_ENTITLEMENT_ID = 'bizstreak_pro';

// react-native-purchases has native code that plain Expo Go does not
// include at all (unlike expo-notifications, which Expo Go does include,
// just with push disabled) — importing it inside Expo Go throws
// immediately. A dynamic import() below defers loading the module until a
// real build actually calls one of these functions; every function here
// checks isExpoGo first, so nothing ever imports the native module while
// testing in Expo Go, and the rest of the app keeps working.
const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let configured = false;

/** Sync check for whether purchases can work at all in this running app
 * (false in Expo Go, regardless of API keys) — use this to show a
 * "requires the real app" notice in the UI before the user even taps buy. */
export function isPurchasesUsable(): boolean {
  return !isExpoGo;
}

async function loadPurchasesModule() {
  const mod = await import('react-native-purchases');
  return mod.default;
}

export async function initPurchases(): Promise<void> {
  if (configured || isExpoGo) return;
  const apiKey = Platform.OS === 'ios' ? API_KEY_IOS : API_KEY_ANDROID;
  if (!apiKey) return; // not wired up yet — see README
  const Purchases = await loadPurchasesModule();
  Purchases.configure({ apiKey });
  configured = true;
}

export async function hasProEntitlement(): Promise<boolean> {
  if (!configured) return false;
  const Purchases = await loadPurchasesModule();
  const info = await Purchases.getCustomerInfo();
  return Boolean(info.entitlements.active[PRO_ENTITLEMENT_ID]);
}

export type PlanId = 'monthly' | 'yearly' | 'lifetime';

function matchPackage(offering: PurchasesOffering, planId: PlanId): PurchasesPackage | undefined {
  if (planId === 'monthly') return offering.monthly ?? undefined;
  if (planId === 'yearly') return offering.annual ?? undefined;
  return offering.lifetime ?? undefined;
}

/** Errors carry a `code`; screens turn it into text in the user's language. */
function fail(code: 'notAvailable' | 'noRestore' | 'expoGo' | 'noOffering' | 'noPackage'): never {
  const err = new Error(code) as Error & { code: string };
  err.code = code;
  throw err;
}

async function getPlanPackage(planId: PlanId): Promise<PurchasesPackage> {
  if (isExpoGo) fail('expoGo');
  if (!configured) fail('notAvailable');
  const Purchases = await loadPurchasesModule();
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) {
    fail('noOffering');
  }
  const pkg = matchPackage(current, planId);
  if (!pkg) {
    fail('noPackage');
  }
  return pkg;
}

export async function purchasePlan(planId: PlanId): Promise<CustomerInfo> {
  const pkg = await getPlanPackage(planId);
  const Purchases = await loadPurchasesModule();
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  if (isExpoGo) fail('expoGo');
  if (!configured) fail('noRestore');
  const Purchases = await loadPurchasesModule();
  return Purchases.restorePurchases();
}
