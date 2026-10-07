import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
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
import { ALL_DAYS, normalizeDays } from '../schedule';
import { HABIT_COLORS, HABIT_TEMPLATES, HabitTemplate } from '../types';
import type { TKey } from '../i18n';
import { todayISO } from '../streaks';

type Props = NativeStackScreenProps<RootStackParamList, 'AddHabit'>;

export default function AddHabitScreen({ navigation }: Props) {
  const { addHabit } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✅');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [trackAmount, setTrackAmount] = useState(false);
  const [unit, setUnit] = useState('');

  const canSave = name.trim().length > 0;

  const handleTemplatePress = (tp: HabitTemplate) => {
    setName(t(tp.key as TKey));
    setEmoji(tp.emoji);
  };

  const handleSave = () => {
    if (!canSave) return;
    addHabit({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      emoji,
      color,
      days: normalizeDays(days),
      trackAmount: trackAmount ? true : undefined,
      unit: trackAmount && unit.trim() ? unit.trim() : undefined,
      createdAt: todayISO(),
      completions: [],
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('add.title')}</Text>
        <Pressable onPress={handleSave} disabled={!canSave} hitSlop={10}>
          <Text style={[styles.save, !canSave && styles.saveDisabled]}>{t('add.save')}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.sectionLabel}>{t('add.quick')}</Text>
        <View style={styles.templateGrid}>
          {HABIT_TEMPLATES.map((tp) => (
            <Pressable
              key={tp.key}
              onPress={() => handleTemplatePress(tp)}
              style={[styles.chip, name === t(tp.key as TKey) && styles.chipActive]}
            >
              <Text style={styles.chipEmoji}>{tp.emoji}</Text>
              <Text style={styles.chipText}>{t(tp.key as TKey)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('add.own')}</Text>
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
            placeholder={t('add.placeholder')}
            placeholderTextColor={theme.textFaint}
            style={styles.nameInput}
          />
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

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>{t('add.color')}</Text>
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

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
        >
          <Text style={styles.saveBtnText}>{t('add.saveHabit')}</Text>
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
    trackRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 },
    trackLabel: { color: theme.text, fontSize: 15, flex: 1, paddingRight: 12 },
    trackHint: { color: theme.textFaint, fontSize: 12, marginTop: 4 },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorDot: { width: 34, height: 34, borderRadius: 17 },
    colorDotActive: { borderWidth: 3, borderColor: theme.text },
  });
}
