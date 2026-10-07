import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import BackButton from '../components/BackButton';
import { todayISO } from '../streaks';
import { buildReport, formatRange } from '../report';
import { formatAmount } from '../entries';
import { showAlert } from '../alert';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

export default function ReportScreen({ navigation }: Props) {
  const { habits, language } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const today = todayISO();
  const report = useMemo(() => buildReport(habits, today), [habits, today]);
  const range = formatRange(report.weekStart, report.weekEnd, language);
  const { thisWeek, lastWeek } = report;
  const diff = lastWeek.due > 0 ? thisWeek.pct - lastWeek.pct : null;
  const diffColor = diff === null || diff === 0 ? theme.textMuted : diff > 0 ? theme.accent : theme.danger;

  const amountLines = report.amounts
    .filter((a) => a.thisWeek > 0 || a.lastWeek > 0)
    .slice(0, 3)
    .map((a) => {
      const unit = a.habit.unit ? ' ' + a.habit.unit : '';
      const change =
        a.lastWeek > 0 ? ` (${a.thisWeek >= a.lastWeek ? '+' : ''}${Math.round(((a.thisWeek - a.lastWeek) / a.lastWeek) * 100)}%)` : '';
      return `${a.habit.emoji} ${a.habit.name}: ${formatAmount(a.thisWeek, language)}${unit}${change}`;
    });

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      setSharing(true);
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('rep.shareTitle') });
      } else {
        showAlert(t('det.shareUnavailableTitle'), t('det.shareUnavailableBody'));
      }
    } catch {
      showAlert(t('det.shareFailedTitle'), t('det.shareFailedBody'));
    } finally {
      setSharing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('rep.title')}</Text>
        <View style={{ width: 56 }} />
      </View>

      {habits.length === 0 ? (
        <Text style={styles.empty}>{t('rep.empty')}</Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <View collapsable={false} ref={cardRef} style={styles.shareCard}>
            <View style={styles.cardTop}>
              <Text style={styles.brand}>BizStreak</Text>
              <Text style={styles.range}>{range}</Text>
            </View>

            {thisWeek.due === 0 ? (
              <Text style={styles.noData}>{t('rep.noData')}</Text>
            ) : (
              <>
                <Text style={styles.bigPct}>{thisWeek.pct}%</Text>
                <Text style={styles.pctLabel}>{t('rep.pctLabel')}</Text>
                <Text style={styles.checkins}>{t('rep.checkins', { done: thisWeek.done, due: thisWeek.due })}</Text>
                {diff !== null && (
                  <Text style={[styles.delta, { color: diffColor }]}>
                    {t('rep.delta', { sign: diff > 0 ? '+' : '', diff })}
                  </Text>
                )}
              </>
            )}

            {report.topStreak && (
              <Text style={styles.line}>
                🔥 {t('rep.streak', { name: report.topStreak.habit.name, n: report.topStreak.streak })}
              </Text>
            )}
            {amountLines.map((l) => (
              <Text key={l} style={styles.line}>
                {l}
              </Text>
            ))}
            <Text style={styles.footer}>{t('det.tracked')}</Text>
          </View>

          <Pressable onPress={handleShare} disabled={sharing} style={styles.shareBtn}>
            <Text style={styles.shareBtnText}>{sharing ? t('det.preparing') : t('rep.share')}</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>{t('rep.habits')}</Text>
          {report.perHabit.map(({ habit, due, done }) => {
            const ratio = due === 0 ? 0 : done / due;
            return (
              <View key={habit.id} style={styles.habitRow}>
                <View style={styles.habitTop}>
                  <Text style={styles.habitName} numberOfLines={1}>
                    {habit.emoji} {habit.name}
                  </Text>
                  <Text style={styles.habitCount}>
                    {done}/{due}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${Math.round(ratio * 100)}%`, backgroundColor: habit.color }]} />
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
    headerTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
    empty: { color: theme.textMuted, textAlign: 'center', marginTop: 60, paddingHorizontal: 40, fontSize: 14, lineHeight: 20 },
    shareCard: {
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.accent,
      borderRadius: 18,
      padding: 20,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    brand: { color: theme.text, fontSize: 16, fontWeight: '800' },
    range: { color: theme.textMuted, fontSize: 13 },
    noData: { color: theme.textMuted, fontSize: 14, marginVertical: 16 },
    bigPct: { color: theme.accent, fontSize: 56, fontWeight: '800' },
    pctLabel: { color: theme.textMuted, fontSize: 13, marginTop: -4 },
    checkins: { color: theme.text, fontSize: 15, fontWeight: '600', marginTop: 12 },
    delta: { fontSize: 13, fontWeight: '700', marginTop: 4 },
    line: { color: theme.text, fontSize: 14, marginTop: 10 },
    footer: { color: theme.textFaint, fontSize: 11, textAlign: 'right', marginTop: 16 },
    shareBtn: { alignSelf: 'center', paddingVertical: 14 },
    shareBtnText: { color: theme.accent, fontSize: 15, fontWeight: '700' },
    sectionLabel: { color: theme.textMuted, fontSize: 13, fontWeight: '600', marginTop: 8, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    habitRow: { marginBottom: 14 },
    habitTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    habitName: { color: theme.text, fontSize: 14, flexShrink: 1, paddingRight: 10 },
    habitCount: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
    barTrack: { height: 6, borderRadius: 3, backgroundColor: theme.gridEmpty, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
  });
}
