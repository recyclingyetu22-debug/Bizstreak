import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { HABIT_COLORS } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EditHabit'>;

export default function EditHabitScreen({ route, navigation }: Props) {
  const { habitId } = route.params;
  const { habits, updateHabit, deleteHabit } = useStore();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const habit = habits.find((h) => h.id === habitId);

  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '✅');
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0]);

  if (!habit) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>Habit not found.</Text>
      </SafeAreaView>
    );
  }

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    updateHabit(habit.id, { name: name.trim(), emoji, color });
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete habit?', `"${habit.name}" and all its history will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteHabit(habit.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Edit Habit</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.sectionLabel}>Name</Text>
        <View style={styles.inputRow}>
          <TextInput value={emoji} onChangeText={setEmoji} maxLength={2} style={styles.emojiInput} />
          <TextInput value={name} onChangeText={setName} placeholderTextColor={theme.textFaint} style={styles.nameInput} />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Color</Text>
        <View style={styles.colorRow}>
          {HABIT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
            />
          ))}
        </View>

        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>Delete habit</Text>
        </Pressable>
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
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorDot: { width: 34, height: 34, borderRadius: 17 },
    colorDotActive: { borderWidth: 3, borderColor: theme.text },
    deleteBtn: { marginTop: 36, alignItems: 'center', paddingVertical: 12 },
    deleteBtnText: { color: theme.danger, fontSize: 14, fontWeight: '600' },
  });
}
