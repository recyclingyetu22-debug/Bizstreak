import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import ContributionGrid from '../components/ContributionGrid';
import { generateGridWeeks, getBestStreak, getCompletionRate, getCurrentStreak, todayISO } from '../streaks';

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>;

export default function HabitDetailScreen({ route, navigation }: Props) {
  const { habitId } = route.params;
  const { habits, toggleHabitDate } = useStore();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const habit = habits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Habit not found.</Text>
      </SafeAreaView>
    );
  }

  const today = todayISO();
  const weeks = generateGridWeeks(habit, 26);
  const shareWeeks = generateGridWeeks(habit, 12);
  const currentStreak = getCurrentStreak(habit);
  const bestStreak = getBestStreak(habit);
  const rate30 = getCompletionRate(habit, 30);
  const doneToday = habit.completions.includes(today);

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    try {
      setSharing(true);
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your streak' });
      } else {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Could not share', 'Something went wrong creating the image.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('EditHabit', { habitId: habit.id })} hitSlop={10}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Pressable
          onPress={() => toggleHabitDate(habit.id, today)}
          style={[
            styles.todayBtn,
            { backgroundColor: doneToday ? habit.color : theme.card, borderColor: doneToday ? habit.color : theme.border },
          ]}
        >
          <Text style={[styles.todayBtnText, { color: doneToday ? theme.accentOn : theme.text }]}>
            {doneToday ? '✓ Done today' : 'Mark today done'}
          </Text>
        </Pressable>

        {/* Shareable summary card */}
        <View collapsable={false} ref={shareCardRef} style={[styles.shareCard, { borderColor: habit.color }]}>
          <View style={styles.shareCardHeader}>
            <Text style={styles.shareEmoji}>{habit.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.shareName}>{habit.name}</Text>
              <Text style={styles.shareStreak}>🔥 {currentStreak}-day streak</Text>
            </View>
          </View>
          <ContributionGrid weeks={shareWeeks} color={habit.color} cellSize={13} gap={4} todayDate={today} />
          <Text style={styles.shareBrand}>Tracked with BizStreak</Text>
        </View>

        <Pressable onPress={handleShare} disabled={sharing} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>{sharing ? 'Preparing…' : '↗ Share my streak'}</Text>
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🔥 {currentStreak}</Text>
            <Text style={styles.statLabel}>Current streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🏆 {bestStreak}</Text>
            <Text style={styles.statLabel}>Best streak</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{rate30}%</Text>
            <Text style={styles.statLabel}>Last 30 days</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Full history</Text>
        <View style={styles.gridCard}>
          <ContributionGrid
            weeks={weeks}
            color={habit.color}
            cellSize={13}
            gap={4}
            scrollable
            todayDate={today}
            onCellPress={(date) => toggleHabitDate(habit.id, date)}
          />
        </View>
        <Text style={styles.hint}>Tap any past day to toggle it.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    missing: { color: theme.textMuted, textAlign: 'center', marginTop: 40 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    back: { color: theme.text, fontSize: 15 },
    edit: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    todayBtn: {
      borderWidth: 1.5,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginBottom: 20,
    },
    todayBtnText: { fontSize: 16, fontWeight: '700' },
    shareCard: {
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderRadius: 16,
      padding: 18,
      marginBottom: 12,
    },
    shareCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    shareEmoji: { fontSize: 30 },
    shareName: { color: theme.text, fontSize: 17, fontWeight: '800' },
    shareStreak: { color: theme.gold, fontSize: 13, fontWeight: '700', marginTop: 2 },
    shareBrand: { color: theme.textFaint, fontSize: 11, marginTop: 14, textAlign: 'right' },
    shareBtn: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 24,
    },
    shareBtnText: { color: theme.accent, fontSize: 14, fontWeight: '700' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
    statBox: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      paddingVertical: 14,
      alignItems: 'center',
    },
    statValue: { color: theme.text, fontSize: 17, fontWeight: '800' },
    statLabel: { color: theme.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
    sectionLabel: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    gridCard: { backgroundColor: theme.card, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14 },
    hint: { color: theme.textFaint, fontSize: 12, marginTop: 10, textAlign: 'center' },
  });
}
