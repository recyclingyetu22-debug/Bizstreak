import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import BackButton from '../components/BackButton';
import EmojiPicker from '../components/EmojiPicker';
import DayPicker from '../components/DayPicker';
import TimePicker from '../components/TimePicker';
import { showAlert } from '../alert';
import { notificationsAvailable, requestNotificationPermission, scheduleHabitReminder, cancelHabitReminder } from '../notifications';
import { ALL_DAYS, normalizeDays } from '../schedule';
import { HABIT_COLORS } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditHabit'>;

export default function EditHabitScreen({ route, navigation }: Props) {
  const { habitId } = route.params;
  const { habits, updateHabit, deleteHabit, language } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const habit = habits.find((h) => h.id === habitId);

  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '✅');
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0]);
  const [days, setDays] = useState<number[]>(habit?.days && habit.days.length ? habit.days : ALL_DAYS);
  const [trackAmount, setTrackAmount] = useState(Boolean(habit?.trackAmount));
  const [unit, setUnit] = useState(habit?.unit ?? '');
  const [remind, setRemind] = useState(Boolean(habit?.reminderTime));
  const [remTime, setRemTime] = useState(habit?.reminderTime ?? '09:00');

  if (!habit) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>{t('habit.notFound')}</Text>
      </SafeAreaView>
    );
  }

  const canSave = name.trim().length > 0;


  const toggleReminder = async (on: boolean) => {
    if (!on) {
      setRemind(false);
      return;
    }
    if (!notificationsAvailable) {
      showAlert(t('set.notifUnavailableTitle'), t('set.notifUnavailableBody'));
      return;
    }
    let granted = false;
    try {
      granted = await requestNotificationPermission();
    } catch {
      granted = false;
    }
    if (!granted) {
      showAlert(t('set.notifDisabledTitle'), t('set.notifDisabledBody'));
      return;
    }
    setRemind(true);
  };

  const handleSave = () => {
    if (!canSave) return;
    updateHabit(habit.id, {
      name: name.trim(),
      emoji,
      color,
      days: normalizeDays(days),
      trackAmount: trackAmount ? true : undefined,
      unit: trackAmount && unit.trim() ? unit.trim() : undefined,
      reminderTime: remind ? remTime : undefined,
    });
    scheduleHabitReminder(
      {
        ...habit,
        name: name.trim(),
        emoji,
        days: normalizeDays(days),
        reminderTime: remind ? remTime : undefined,
      },
      language
    );
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert(t('edit.deleteTitle'), t('edit.deleteBody', { name: habit.name }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('edit.deleteConfirm'),
        style: 'destructive',
        onPress: () => {
          cancelHabitReminder(habit.id);
          deleteHabit(habit.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('edit.title')}</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>{t('add.save')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.sectionLabel}>{t('edit.name')}</Text>
        <View style={styles.inputRow}>
          <TextInput value={emoji} onChangeText={setEmoji} maxLength={2} style={styles.emojiInput} />
          <TextInput value={name} onChangeText={setName} placeholderTextColor={theme.textFaint} style={styles.nameInput} />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('add.emoji')}</Text>
        <EmojiPicker value={emoji} onChange={setEmoji} />

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('add.repeat')}</Text>
        <DayPicker value={days} onChange={setDays} />

        <View style={styles.trackRow}>
          <Text style={styles.trackLabel}>{t('add.track')}</Text>
          <Switch
            value={trackAmount}
            onValueChange={setTrackAmount}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
        <Text style={styles.trackHint}>{t('add.trackHint')}</Text>
        {trackAmount && (
          <TextInput
            value={unit}
            onChangeText={setUnit}
            maxLength={12}
            placeholder={t('add.unit')}
            placeholderTextColor={theme.textFaint}
            style={[styles.nameInput, { marginTop: 10 }]}
          />
        )}

        <View style={styles.trackRow}>
          <Text style={styles.trackLabel}>{t('add.remind')}</Text>
          <Switch
            value={remind}
            onValueChange={toggleReminder}
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
        {remind && (
          <View style={{ marginTop: 14 }}>
            <TimePicker value={remTime} onChange={setRemTime} />
          </View>
        )}

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('add.color')}</Text>
        <View style={styles.colorRow}>
          {HABIT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveBtnText}>{t('edit.saveChanges')}</Text>
        </Pressable>

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>{t('edit.delete')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    saveBtn: { marginTop: 32, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: theme.accentOn, fontSize: 16, fontWeight: '800' },
    missing: { color: theme.textMuted, textAlign: 'center', marginTop: 40 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
    cancel: { color: theme.textMuted, fontSize: 15 },
    save: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    saveDisabled: { color: theme.textFaint },
    sectionLabel: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputRow: { flexDirection: 'row', gap: 10 },
    emojiInput: {
      width: 56,
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      textAlign: 'center',
      fontSize: 22,
      color: theme.text,
    },
    nameInput: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 14,
      fontSize: 16,
      color: theme.text,
    },
    trackRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    trackLabel: { color: theme.text, fontSize: 15, flex: 1, paddingRight: 12 },
    trackHint: { color: theme.textFaint, fontSize: 12, marginTop: 4 },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorDot: { width: 34, height: 34, borderRadius: 17 },
    colorDotActive: { borderWidth: 3, borderColor: theme.text },
    deleteBtn: { marginTop: 36, alignItems: 'center', paddingVertical: 12 },
    deleteBtnText: { color: theme.danger, fontSize: 14, fontWeight: '600' },
  });
}
