import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import { numberSeparators } from '../i18n';
import { useStore } from '../store';
import { Habit } from '../types';
import { addDays, todayISO } from '../streaks';
import { dailyAverage, formatAmount, parseAmount, weekTotals } from '../entries';
import { showAlert } from '../alert';

const MAX_DAYS_BACK = 30;

// A note (and, for habits that track one, an amount) for any of the last 30
// days. Saving an entry also marks that day done.
export default function EntryCard({ habit }: { habit: Habit }) {
  const theme = useTheme();
  const t = useT();
  const { setEntry, language } = useStore();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const today = todayISO();
  const [date, setDate] = useState(today);
  const [saved, setSaved] = useState(false);

  const stored = habit.entries?.[date];
  const decimal = numberSeparators(language).decimal;
  const [amountText, setAmountText] = useState('');
  const [noteText, setNoteText] = useState('');

  // Load the chosen day's saved values into the boxes.
  useEffect(() => {
    setAmountText(stored?.amount !== undefined ? String(stored.amount).replace('.', decimal) : '');
    setNoteText(stored?.note ?? '');
  }, [date, stored?.amount, stored?.note, decimal]);

  const oldest = addDays(today, -MAX_DAYS_BACK);
  const dateLabel = date === today ? t('ent.today') : date === addDays(today, -1) ? t('ent.yesterday') : date;
  const unitSuffix = habit.unit ? ' ' + habit.unit : '';
  const money = (n: number) => formatAmount(n, language) + unitSuffix;

  const save = () => {
    let amount: number | undefined;
    if (habit.trackAmount && amountText.trim() !== '') {
      amount = parseAmount(amountText);
      if (amount === undefined) {
        showAlert(t('ent.title'), t('ent.badAmount'));
        return;
      }
    }
    const note = noteText.trim().slice(0, 300);
    setEntry(habit.id, date, amount === undefined && !note ? null : { amount, note: note || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const totals = habit.trackAmount ? weekTotals(habit, today) : null;

  return (
    <View>
      {totals && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{money(totals.thisWeek)}</Text>
            <Text style={styles.statLabel}>{t('ent.thisWeek')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{money(totals.lastWeek)}</Text>
            <Text style={styles.statLabel}>{t('ent.lastWeek')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{money(dailyAverage(habit, today))}</Text>
            <Text style={styles.statLabel}>{t('ent.avg')}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.dateRow}>
          <Text style={styles.title}>{t('ent.title')}</Text>
          <View style={styles.dateNav}>
            <Pressable onPress={() => setDate(addDays(date, -1))} disabled={date <= oldest} hitSlop={10} style={styles.navBtn}>
              <Text style={[styles.navText, date <= oldest && styles.navDisabled]}>‹</Text>
            </Pressable>
            <Text style={styles.dateText}>{dateLabel}</Text>
            <Pressable onPress={() => setDate(addDays(date, 1))} disabled={date >= today} hitSlop={10} style={styles.navBtn}>
              <Text style={[styles.navText, date >= today && styles.navDisabled]}>›</Text>
            </Pressable>
          </View>
        </View>

        {habit.trackAmount && (
          <View style={styles.amountRow}>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder={t('ent.amount')}
              placeholderTextColor={theme.textFaint}
              keyboardType="decimal-pad"
              style={[styles.input, { flex: 1 }]}
            />
            {habit.unit ? <Text style={styles.unit}>{habit.unit}</Text> : null}
          </View>
        )}

        <TextInput
          value={noteText}
          onChangeText={setNoteText}
          placeholder={t('ent.note')}
          placeholderTextColor={theme.textFaint}
          multiline
          maxLength={300}
          style={[styles.input, { minHeight: 64, textAlignVertical: 'top', marginTop: habit.trackAmount ? 10 : 0 }]}
        />

        <Pressable onPress={save} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{saved ? t('ent.saved') : t('ent.save')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    statBox: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    statValue: { color: theme.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
    statLabel: { color: theme.textMuted, fontSize: 10, marginTop: 4, textAlign: 'center' },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 14,
      marginBottom: 18,
    },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    title: { color: theme.text, fontSize: 14, fontWeight: '700' },
    dateNav: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    navBtn: { paddingHorizontal: 6 },
    navText: { color: theme.accent, fontSize: 22, fontWeight: '700' },
    navDisabled: { color: theme.textFaint },
    dateText: { color: theme.textMuted, fontSize: 13, minWidth: 74, textAlign: 'center' },
    amountRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    unit: { color: theme.textMuted, fontSize: 14, fontWeight: '600' },
    input: {
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: theme.text,
      fontSize: 15,
    },
    saveBtn: { marginTop: 12, backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    saveBtnText: { color: theme.accentOn, fontSize: 14, fontWeight: '800' },
  });
}
