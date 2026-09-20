import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Habit } from '../types';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { generateGridWeeks, getCurrentStreak, todayISO } from '../streaks';
import ContributionGrid from './ContributionGrid';

interface Props {
  habit: Habit;
  onPress: () => void;
  onToggleToday: () => void;
  editMode?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export default function HabitCard({
  habit,
  onPress,
  onToggleToday,
  editMode,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const today = todayISO();
  const doneToday = habit.completions.includes(today);
  const streak = getCurrentStreak(habit);
  const weeks = generateGridWeeks(habit, 12);

  const handleToggle = () => {
    Haptics.impactAsync(doneToday ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onToggleToday();
  };

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.emoji}>{habit.emoji}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {habit.name}
          </Text>
        </View>
        <View style={styles.rightWrap}>
          {editMode ? (
            <View style={styles.moveWrap}>
              <Pressable onPress={onMoveUp} disabled={!canMoveUp} hitSlop={8} style={styles.moveBtn}>
                <Text style={[styles.moveIcon, !canMoveUp && styles.moveIconDisabled]}>▲</Text>
              </Pressable>
              <Pressable onPress={onMoveDown} disabled={!canMoveDown} hitSlop={8} style={styles.moveBtn}>
                <Text style={[styles.moveIcon, !canMoveDown && styles.moveIconDisabled]}>▼</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {streak > 0 && <Text style={styles.streak}>🔥 {streak}</Text>}
              <Pressable
                onPress={handleToggle}
                hitSlop={8}
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: doneToday ? habit.color : 'transparent',
                    borderColor: doneToday ? habit.color : theme.border,
                  },
                ]}
              >
                {doneToday && <Text style={styles.checkMark}>✓</Text>}
              </Pressable>
            </>
          )}
        </View>
      </View>
      <View style={styles.gridWrap}>
        <ContributionGrid weeks={weeks} color={habit.color} cellSize={11} gap={3} todayDate={today} />
      </View>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardPressed: { opacity: 0.85 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    titleWrap: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, gap: 8 },
    emoji: { fontSize: 20 },
    name: { color: theme.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
    rightWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    streak: { color: theme.gold, fontSize: 13, fontWeight: '600' },
    checkCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMark: { color: theme.accentOn, fontWeight: '800', fontSize: 15 },
    gridWrap: { alignItems: 'flex-end' },
    moveWrap: { flexDirection: 'row', gap: 14 },
    moveBtn: { padding: 4 },
    moveIcon: { color: theme.text, fontSize: 14 },
    moveIconDisabled: { color: theme.textFaint },
  });
}
