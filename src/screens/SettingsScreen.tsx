import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Switch, Linking } from 'react-native';
import Constants from 'expo-constants';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import TimePicker from '../components/TimePicker';
import { Language, purchaseErrorKey } from '../i18n';
import { ThemeMode } from '../types';
import { requestNotificationPermission, scheduleDailyReminder, cancelDailyReminder, notificationsAvailable } from '../notifications';
import { restorePurchases, isPurchasesUsable, PRO_ENTITLEMENT_ID } from '../purchases';
import { PRIVACY_URL, TERMS_URL, DELETE_DATA_URL, SUPPORT_EMAIL } from '../links';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { isPro, habits, themeMode, setThemeMode, reminderEnabled, reminderTime, setReminder, setPro, language, setLanguage } = useStore();
  const t = useT();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);

  const handleRestore = async () => {
    setBusy(true);
    try {
      const info = await restorePurchases();
      if (info.entitlements.active[PRO_ENTITLEMENT_ID]) {
        setPro(true);
        Alert.alert(t('set.restoredTitle'), t('set.restoredBody'));
      } else {
        Alert.alert(t('set.nothingTitle'), t('set.nothingBody'));
      }
    } catch (err: any) {
      const known = purchaseErrorKey(err?.code);
      Alert.alert(isPurchasesUsable() ? t('set.restoreFailed') : t('set.previewBuild'), known ? t(known) : t('set.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const handleReminderToggle = async (value: boolean) => {
    if (!value) {
      await cancelDailyReminder();
      setReminder(false, reminderTime);
      return;
    }
    if (!notificationsAvailable) {
      Alert.alert(t('set.notifUnavailableTitle'), t('set.notifUnavailableBody'));
      return;
    }
    setBusy(true);
    const granted = await requestNotificationPermission();
    setBusy(false);
    if (!granted) {
      Alert.alert(t('set.notifDisabledTitle'), t('set.notifDisabledBody'));
      return;
    }
    await scheduleDailyReminder(reminderTime, language);
    setReminder(true, reminderTime);
  };

  // Re-scheduling waits until the user stops tapping the arrows.
  const rescheduleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleTimePick = (time: string) => {
    setReminder(reminderEnabled, time);
    if (!reminderEnabled) return;
    if (rescheduleTimer.current) clearTimeout(rescheduleTimer.current);
    rescheduleTimer.current = setTimeout(() => {
      scheduleDailyReminder(time, language);
    }, 600);
  };

  const handleLanguage = async (next: Language) => {
    setLanguage(next);
    // The reminder text is baked in when it's scheduled, so re-schedule it.
    if (reminderEnabled) {
      await scheduleDailyReminder(reminderTime, next);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>{t('back')}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t('set.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>{isPro ? '👑' : '🔓'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{isPro ? t('set.proTitle') : t('set.freePlan')}</Text>
            <Text style={styles.statusBody}>
              {isPro ? t('set.unlimited') : t('set.used', { n: habits.length })}
            </Text>
          </View>
          {!isPro && (
            <Pressable onPress={() => navigation.navigate('Paywall')} style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>{t('set.upgrade')}</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('set.reminder')}</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>{t('set.remindMe')}</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              disabled={busy}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          {reminderEnabled && (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.timeLabel}>{t('set.time')}</Text>
              <TimePicker value={reminderTime} onChange={handleTimePick} />
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('set.appearance')}</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {(['dark', 'light'] as ThemeMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => setThemeMode(m)}
                style={[styles.themeOption, themeMode === m && styles.themeOptionActive]}
              >
                <Text style={styles.themeEmoji}>{m === 'dark' ? '🌙' : '☀️'}</Text>
                <Text style={[styles.themeLabel, themeMode === m && styles.themeLabelActive]}>
                  {m === 'dark' ? t('set.dark') : t('set.light')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('set.language')}</Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            {(['en', 'fr'] as Language[]).map((l) => (
              <Pressable
                key={l}
                onPress={() => handleLanguage(l)}
                style={[styles.themeOption, language === l && styles.themeOptionActive]}
              >
                <Text style={[styles.themeLabel, language === l && styles.themeLabelActive]}>
                  {l === 'en' ? 'English' : 'Français'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={() => navigation.navigate('Backup')} style={styles.linkRow}>
          <Text style={styles.rowText}>{t('set.backup')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>

        <Pressable onPress={handleRestore} style={styles.linkRow}>
          <Text style={styles.rowText}>{t('set.restore')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>

        <Pressable onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.linkRow}>
          <Text style={styles.rowText}>{t('set.privacy')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)} style={styles.linkRow}>
          <Text style={styles.rowText}>{t('set.terms')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(DELETE_DATA_URL)} style={styles.linkRow}>
          <Text style={styles.rowText}>{t('set.deleteData')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL('mailto:' + SUPPORT_EMAIL + '?subject=BizStreak%20support')}
          style={styles.linkRow}
        >
          <Text style={styles.rowText}>{t('set.support')}</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>

        <View style={styles.aboutBox}>
          <Text style={styles.aboutTitle}>{t('set.aboutTitle')}</Text>
          <Text style={styles.aboutBody}>
            {t('set.aboutBody')}
          </Text>
          <Text style={[styles.aboutBody, { marginTop: 12 }]}>{t('set.version', { v: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    back: { color: theme.text, fontSize: 15 },
    headerTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
    statusCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
    },
    statusEmoji: { fontSize: 26 },
    statusTitle: { color: theme.text, fontSize: 15, fontWeight: '700' },
    statusBody: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
    upgradeBtn: { backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
    upgradeBtnText: { color: theme.accentOn, fontWeight: '700', fontSize: 13 },
    sectionTitle: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
      marginBottom: 24,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowText: { color: theme.text, fontSize: 14 },
    timeLabel: { color: theme.textMuted, fontSize: 12, marginBottom: 6, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
    timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    timeChip: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    timeChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    timeChipText: { color: theme.text, fontSize: 13, fontWeight: '600' },
    timeChipTextActive: { color: theme.accentOn },
    themeRow: { flexDirection: 'row', gap: 12 },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    themeOptionActive: { borderColor: theme.accent, backgroundColor: theme.mode === 'dark' ? '#12241A' : '#E7F6EC' },
    themeEmoji: { fontSize: 22, marginBottom: 6 },
    themeLabel: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
    themeLabelActive: { color: theme.text },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rowChevron: { color: theme.textFaint, fontSize: 18 },
    aboutBox: { marginTop: 24 },
    aboutTitle: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    aboutBody: { color: theme.textMuted, fontSize: 13, lineHeight: 19 },
  });
}
