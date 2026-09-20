import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView, Alert, Switch } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { ThemeMode } from '../types';
import { requestNotificationPermission, scheduleDailyReminder, cancelDailyReminder, notificationsAvailable } from '../notifications';
import { restorePurchases, isPurchasesUsable, PRO_ENTITLEMENT_ID } from '../purchases';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const REMINDER_TIMES = ['07:00', '09:00', '12:00', '18:00', '20:00'];

export default function SettingsScreen({ navigation }: Props) {
  const { isPro, habits, themeMode, setThemeMode, reminderEnabled, reminderTime, setReminder, setPro } = useStore();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [busy, setBusy] = useState(false);

  const handleRestore = async () => {
    setBusy(true);
    try {
      const info = await restorePurchases();
      if (info.entitlements.active[PRO_ENTITLEMENT_ID]) {
        setPro(true);
        Alert.alert('Restored', 'Your Pro purchase has been restored.');
      } else {
        Alert.alert('Nothing to restore', 'No active purchase was found for this account.');
      }
    } catch (err: any) {
      Alert.alert(isPurchasesUsable() ? 'Restore failed' : 'Preview build', err?.message ?? 'Something went wrong.');
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
      Alert.alert(
        'Not available in this test build',
        'Reminders need a real build to work — they\'re disabled while testing in Expo Go. This will work once BizStreak is built properly.',
      );
      return;
    }
    setBusy(true);
    const granted = await requestNotificationPermission();
    setBusy(false);
    if (!granted) {
      Alert.alert('Notifications disabled', 'Enable notifications for BizStreak in your phone settings to get daily reminders.');
      return;
    }
    await scheduleDailyReminder(reminderTime);
    setReminder(true, reminderTime);
  };

  const handleTimePick = async (time: string) => {
    setReminder(reminderEnabled, time);
    if (reminderEnabled) {
      await scheduleDailyReminder(time);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.statusCard}>
          <Text style={styles.statusEmoji}>{isPro ? '👑' : '🔓'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>{isPro ? 'BizStreak Pro' : 'Free plan'}</Text>
            <Text style={styles.statusBody}>
              {isPro ? 'Unlimited habits unlocked.' : `${habits.length}/3 habits used`}
            </Text>
          </View>
          {!isPro && (
            <Pressable onPress={() => navigation.navigate('Paywall')} style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionTitle}>Daily reminder</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>Remind me every day</Text>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              disabled={busy}
              trackColor={{ false: theme.border, true: theme.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          {reminderEnabled && (
            <View style={styles.timeRow}>
              {REMINDER_TIMES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => handleTimePick(t)}
                  style={[styles.timeChip, reminderTime === t && styles.timeChipActive]}
                >
                  <Text style={[styles.timeChipText, reminderTime === t && styles.timeChipTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Appearance</Text>
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
                  {m === 'dark' ? 'Dark' : 'Light'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable onPress={handleRestore} style={styles.linkRow}>
          <Text style={styles.rowText}>Restore purchases</Text>
          <Text style={styles.rowChevron}>›</Text>
        </Pressable>

        <View style={styles.aboutBox}>
          <Text style={styles.aboutTitle}>About BizStreak</Text>
          <Text style={styles.aboutBody}>
            A simple streak tracker for the daily habits that keep a small business disciplined —
            checking stock, following up on unpaid invoices, recording sales, and staying on top of
            leads. All data stays on this device.
          </Text>
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
