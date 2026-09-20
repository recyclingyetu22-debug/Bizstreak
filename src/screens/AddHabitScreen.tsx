import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { HABIT_COLORS, HABIT_TEMPLATES } from '../types';
import { todayISO } from '../streaks';

type Props = NativeStackScreenProps<RootStackParamList, 'AddHabit'>;

export default function AddHabitScreen({ navigation }: Props) {
  const { addHabit } = useStore();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✅');
  const [color, setColor] = useState(HABIT_COLORS[0]);

  const canSave = name.trim().length > 0;

  const handleTemplatePress = (t: { emoji: string; name: string }) => {
    setName(t.name);
    setEmoji(t.emoji);
  };

  const handleSave = () => {
    if (!canSave) return;
    addHabit({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      emoji,
      color,
      createdAt: todayISO(),
      completions: [],
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Habit</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.sectionLabel}>Quick add</Text>
        <View style={styles.templateGrid}>
          {HABIT_TEMPLATES.map((t) => (
            <Pressable
              key={t.name}
              onPress={() => handleTemplatePress(t)}
              style={[styles.chip, name === t.name && styles.chipActive]}
            >
              <Text style={styles.chipEmoji}>{t.emoji}</Text>
              <Text style={styles.chipText}>{t.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Or write your own</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={emoji}
            onChangeText={setEmoji}
            maxLength={2}
            style={styles.emojiInput}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Call 3 clients"
            placeholderTextColor={theme.textFaint}
            style={styles.nameInput}
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Color</Text>
        <View style={styles.colorRow}>
          {HABIT_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.colorDot,
                { backgroundColor: c },
                color === c && styles.colorDotActive,
              ]}
            />
          ))}
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
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
    cancel: { color: theme.textMuted, fontSize: 15 },
    save: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    saveDisabled: { color: theme.textFaint },
    sectionLabel: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    chipActive: { borderColor: theme.accent, backgroundColor: theme.mode === 'dark' ? '#12241A' : '#E7F6EC' },
    chipEmoji: { fontSize: 15 },
    chipText: { color: theme.text, fontSize: 13, fontWeight: '500' },
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
  });
}
