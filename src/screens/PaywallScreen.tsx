import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import BackButton from '../components/BackButton';
import { isPurchasesUsable, purchasePlan, PRO_ENTITLEMENT_ID } from '../purchases';
import { PRIVACY_URL, TERMS_URL } from '../links';
import { TKey, purchaseErrorKey } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

type PlanId = 'monthly' | 'yearly' | 'lifetime';

const PLANS: { id: PlanId; label: TKey; price: TKey; sub?: TKey; badge?: TKey }[] = [
  { id: 'yearly', label: 'pay.yearly', price: 'pay.yearlyPrice', sub: 'pay.yearlySub', badge: 'pay.badge' },
  { id: 'monthly', label: 'pay.monthly', price: 'pay.monthlyPrice' },
  { id: 'lifetime', label: 'pay.lifetime', price: 'pay.lifetimePrice', sub: 'pay.lifetimeSub' },
];

const FEATURES: TKey[] = ['pay.f1', 'pay.f2', 'pay.f3'];

export default function PaywallScreen({ navigation }: Props) {
  const { setPro } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [selected, setSelected] = useState<PlanId>('yearly');
  const [purchasing, setPurchasing] = useState(false);

  const handleUnlock = async () => {
    setPurchasing(true);
    try {
      const info = await purchasePlan(selected);
      if (info.entitlements.active[PRO_ENTITLEMENT_ID]) {
        setPro(true);
        Alert.alert(t('pay.proTitle'), t('pay.proBody'));
        navigation.goBack();
      } else {
        Alert.alert(t('pay.noUnlockTitle'), t('pay.noUnlockBody'));
      }
    } catch (err: any) {
      if (err?.userCancelled) return; // they backed out of the store sheet — not a real error
      const known = purchaseErrorKey(err?.code);
      Alert.alert(t('pay.failed'), known ? t(known) : t('pay.generic'));
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View style={styles.topRow}>
          <BackButton onPress={() => navigation.goBack()} />
          <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        <Text style={styles.crown}>🔥</Text>
        <Text style={styles.title}>{t('pay.title')}</Text>
        <Text style={styles.subtitle}>{t('pay.subtitle')}</Text>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.featureCheck}>✓</Text>
              <Text style={styles.featureText}>{t(f)}</Text>
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
                  <Text style={styles.badgeText}>{t(p.badge)}</Text>
                </View>
              )}
              <Text style={styles.planLabel}>{t(p.label)}</Text>
              <Text style={styles.planPrice}>{t(p.price)}</Text>
              {p.sub && <Text style={styles.planSub}>{t(p.sub)}</Text>}
            </Pressable>
          ))}
        </View>

        <Pressable onPress={handleUnlock} disabled={purchasing} style={[styles.cta, purchasing && { opacity: 0.7 }]}>
          {purchasing ? <ActivityIndicator color={theme.accentOn} /> : <Text style={styles.ctaText}>{t('pay.continue')}</Text>}
        </Pressable>
        <Text style={styles.fineprint}>
          {t('pay.fine')}
        </Text>
        <View style={styles.legalRow}>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>{t('pay.terms')}</Text>
          </Pressable>
          <Text style={styles.fineprint}>  •  </Text>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} hitSlop={8}>
            <Text style={styles.legalLink}>{t('pay.privacy')}</Text>
          </Pressable>
        </View>
        {!isPurchasesUsable() && (
          <Text style={styles.fineprint}>{t('pay.expoGo')}</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    closeBtn: { padding: 6 },
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
    legalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    legalLink: { color: theme.accent, fontSize: 12, textDecorationLine: 'underline' },
    fineprint: { color: theme.textFaint, fontSize: 11, textAlign: 'center', marginTop: 14 },
  });
}
