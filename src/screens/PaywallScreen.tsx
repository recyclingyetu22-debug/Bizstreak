import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { isPurchasesUsable, purchasePlan, PRO_ENTITLEMENT_ID } from '../purchases';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

type PlanId = 'monthly' | 'yearly' | 'lifetime';

const PLANS: { id: PlanId; label: string; price: string; sub?: string; badge?: string }[] = [
  { id: 'yearly', label: 'Yearly', price: '$9.99/yr', sub: 'Just $0.83/month', badge: 'BEST VALUE' },
  { id: 'monthly', label: 'Monthly', price: '$1.00/mo' },
  { id: 'lifetime', label: 'Lifetime', price: '$30.00', sub: 'Pay once, own it forever' },
];

const FEATURES = [
  'Unlimited habits (free plan is capped at 3)',
  'Full yearly history & streak stats',
  'Custom colors & icons',
  'Daily reminder notifications',
  'Support future updates',
];

export default function PaywallScreen({ navigation }: Props) {
  const { setPro } = useStore();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [selected, setSelected] = useState<PlanId>('yearly');
  const [purchasing, setPurchasing] = useState(false);

  const handleUnlock = async () => {
    setPurchasing(true);
    try {
      const info = await purchasePlan(selected);
      if (info.entitlements.active[PRO_ENTITLEMENT_ID]) {
        setPro(true);
        Alert.alert('You’re Pro!', 'Unlimited habits are unlocked.');
        navigation.goBack();
      } else {
        Alert.alert('Purchase did not unlock Pro', 'Please try again, or contact support if you were charged.');
      }
    } catch (err: any) {
      if (err?.userCancelled) return; // they backed out of the store sheet — not a real error
      Alert.alert(isPurchasesUsable() ? 'Purchase failed' : 'Preview build', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>

        <Text style={styles.crown}>🔥</Text>
        <Text style={styles.title}>Go Pro</Text>
        <Text style={styles.subtitle}>Track every habit that keeps your business disciplined.</Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        <View style={styles.plans}>
          {PLANS.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelected(p.id)}
              style={[styles.plan, selected === p.id && styles.planActive]}
            >
              {p.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{p.badge}</Text>
                </View>
              )}
              <Text style={styles.planLabel}>{p.label}</Text>
              <Text style={styles.planPrice}>{p.price}</Text>
              {p.sub && <Text style={styles.planSub}>{p.sub}</Text>}
            </Pressable>
          ))}
        </View>

        <Pressable onPress={handleUnlock} disabled={purchasing} style={[styles.cta, purchasing && { opacity: 0.7 }]}>
          {purchasing ? <ActivityIndicator color={theme.accentOn} /> : <Text style={styles.ctaText}>Continue</Text>}
        </Pressable>
        <Text style={styles.fineprint}>
          Cancel anytime. Subscriptions renew automatically until canceled.
        </Text>
        {!isPurchasesUsable() && (
          <Text style={styles.fineprint}>Preview build — purchases aren't testable in Expo Go.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    closeBtn: { alignSelf: 'flex-end', padding: 6 },
    closeText: { color: theme.textMuted, fontSize: 18 },
    crown: { fontSize: 40, textAlign: 'center', marginTop: 4 },
    title: { color: theme.text, fontSize: 26, fontWeight: '800', textAlign: 'center', marginTop: 8 },
    subtitle: { color: theme.textMuted, fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 10 },
    featureList: { marginBottom: 28, gap: 10 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    featureCheck: { color: theme.accent, fontSize: 15, fontWeight: '800' },
    featureText: { color: theme.text, fontSize: 14, flexShrink: 1 },
    plans: { gap: 10, marginBottom: 24 },
    plan: {
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
      backgroundColor: theme.card,
    },
    planActive: { borderColor: theme.accent, backgroundColor: theme.mode === 'dark' ? '#12241A' : '#E7F6EC' },
    badge: {
      position: 'absolute',
      top: -10,
      right: 14,
      backgroundColor: theme.gold,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    badgeText: { color: theme.mode === 'dark' ? '#241A02' : '#FFFFFF', fontSize: 10, fontWeight: '800' },
    planLabel: { color: theme.text, fontSize: 15, fontWeight: '700' },
    planPrice: { color: theme.text, fontSize: 20, fontWeight: '800', marginTop: 4 },
    planSub: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
    cta: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    ctaText: { color: theme.accentOn, fontSize: 16, fontWeight: '800' },
    fineprint: { color: theme.textFaint, fontSize: 11, textAlign: 'center', marginTop: 14 },
  });
}
