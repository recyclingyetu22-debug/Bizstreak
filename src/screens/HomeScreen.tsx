import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import BackButton from '../components/BackButton';
import HabitCard from '../components/HabitCard';
import { FREE_HABIT_LIMIT } from '../types';
import { isScheduled, todayISO } from '../streaks';
import { getSmartTip } from '../insights';
import { useT } from '../useT';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { habits, isPro, toggleHabitDate, reorderHabit, language } = useStore();
  const t = useT();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [editMode, setEditMode] = useState(false);
  const insets = useSafeAreaInsets();
  const today = todayISO();
  const dueToday = habits.filter((h) => isScheduled(h, today));
  const doneTodayCount = dueToday.filter((h) => h.completions.includes(today)).length;
  const progress = dueToday.length === 0 ? 0 : doneTodayCount / dueToday.length;
  // Recomputed only when the habit list identity changes (a completion
  // toggle replaces the array), not on every render — cheap either way at
  // realistic habit counts, but no reason to redo the weekday scan for
  // unrelated re-renders like the edit-mode toggle.
  const smartTip = useMemo(() => getSmartTip(habits, language), [habits, language]);

  const handleAddPress = () => {
    if (!isPro && habits.length >= FREE_HABIT_LIMIT) {
      navigation.navigate('Paywall');
      return;
    }
    navigation.navigate('AddHabit');
  };

  const progressMessage = () => {
    if (habits.length === 0) return t('home.sub');
    if (dueToday.length === 0) return t('home.rest');
    if (doneTodayCount === dueToday.length) return t('home.allDone');
    if (doneTodayCount === 0) return t('home.waiting', { n: dueToday.length });
    return t('home.progress', { done: doneTodayCount, total: dueToday.length });
  };

  return (
    <View style={styles.root}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <BackButton onPress={() => navigation.navigate('Onboarding')} />
          <Text style={styles.title}>BizStreak</Text>
          <Text style={styles.subtitle}>{progressMessage()}</Text>
          {habits.length > 0 && (
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {!editMode && (
            <Pressable onPress={handleAddPress} hitSlop={10} style={styles.editToggle}>
              <Text style={styles.editToggleText}>{t('home.add')}</Text>
            </Pressable>
          )}
          {habits.length > 0 && (
            <Pressable onPress={() => setEditMode((v) => !v)} hitSlop={10} style={styles.editToggle}>
              <Text style={styles.editToggleText}>{editMode ? t('home.done') : t('home.edit')}</Text>
            </Pressable>
          )}
          {habits.length > 0 && (
            <Pressable
              onPress={() => navigation.navigate('Report')}
              hitSlop={10}
              style={styles.settingsBtn}
              accessibilityLabel={t('rep.title')}
            >
              <Text style={styles.settingsIcon}>📊</Text>
            </Pressable>
          )}
          <Pressable onPress={() => navigation.navigate('Settings')} hitSlop={10} style={styles.settingsBtn}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </Pressable>
        </View>
      </View>

      {smartTip && (
        <View style={styles.tipCard}>
          <Text style={styles.tipEmoji}>{smartTip.emoji}</Text>
          <Text style={styles.tipText}>{smartTip.text}</Text>
        </View>
      )}

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📈</Text>
          <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>
            {t('home.emptyBody')}
          </Text>
          <Pressable onPress={handleAddPress} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>{t('home.emptyBtn')}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          renderItem={({ item, index }) => (
            <HabitCard
              habit={item}
              editMode={editMode}
              canMoveUp={index > 0}
              canMoveDown={index < habits.length - 1}
              onMoveUp={() => reorderHabit(item.id, -1)}
              onMoveDown={() => reorderHabit(item.id, 1)}
              onPress={() =>
                editMode
                  ? navigation.navigate('EditHabit', { habitId: item.id })
                  : navigation.navigate('HabitDetail', { habitId: item.id })
              }
              onToggleToday={() => toggleHabitDate(item.id, today)}
            />
          )}
        />
      )}

    </SafeAreaView>

      {/* Placed outside SafeAreaView and positioned from the measured system
          bar height, so it can't end up hidden behind the navigation bar. */}
      {!editMode && (
        <Pressable
          onPress={handleAddPress}
          accessibilityLabel="Add habit"
          style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 24 }]}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.bg },
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 4,
    },
    title: { color: theme.text, fontSize: 26, fontWeight: '800' },
    subtitle: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
    progressTrack: {
      marginTop: 10,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.gridEmpty,
      overflow: 'hidden',
      maxWidth: 220,
    },
    progressFill: { height: 6, borderRadius: 3, backgroundColor: theme.accent },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 2 },
    editToggle: { paddingVertical: 4, paddingHorizontal: 4 },
    editToggleText: { color: theme.accent, fontSize: 14, fontWeight: '700' },
    settingsBtn: { padding: 6 },
    settingsIcon: { fontSize: 20 },
    tipCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 14,
      marginHorizontal: 16,
      marginTop: 14,
    },
    tipEmoji: { fontSize: 18 },
    tipText: { flex: 1, color: theme.text, fontSize: 13, lineHeight: 19 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyTitle: { color: theme.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
    emptyBody: { color: theme.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { marginTop: 24, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 26 },
    emptyBtnText: { color: theme.accentOn, fontSize: 15, fontWeight: '800' },
    fab: {
      position: 'absolute',
      right: 20,
      zIndex: 10,
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: theme.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    fabText: { color: theme.accentOn, fontSize: 30, fontWeight: '700', marginTop: -2 },
  });
}
