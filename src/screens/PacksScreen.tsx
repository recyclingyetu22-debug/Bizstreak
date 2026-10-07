import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import BackButton from '../components/BackButton';
import { showAlert } from '../alert';
import { FREE_HABIT_LIMIT } from '../types';
import { Pack, PACKS, planPack } from '../packs';
import { todayISO } from '../streaks';

type Props = NativeStackScreenProps<RootStackParamList, 'Packs'>;

export default function PacksScreen({ navigation }: Props) {
  const { habits, isPro, addHabit } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const slots = isPro ? Infinity : Math.max(0, FREE_HABIT_LIMIT - habits.length);

  const makePlan = (pack: Pack) =>
    planPack(pack, habits, slots, (k) => t(k), todayISO(), () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const handlePick = (pack: Pack) => {
    if (slots === 0) {
      navigation.navigate('Paywall');
      return;
    }
    const plan = makePlan(pack);
    if (plan.habits.length === 0) {
      showAlert(t(pack.nameKey), t('packs.allThere'));
      return;
    }
    showAlert(t(pack.nameKey), t('packs.confirm', { n: plan.habits.length }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('packs.add'),
        onPress: () => {
          plan.habits.forEach(addHabit);
          const note = plan.skippedLimit > 0 ? '\n\n' + t('packs.limitNote', { n: plan.skippedLimit }) : '';
          showAlert(t('packs.doneTitle'), t('packs.doneBody', { n: plan.habits.length }) + note, [
            { text: 'OK', onPress: () => navigation.navigate('Home') },
          ]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('packs.title')}</Text>
        <View style={{ width: 56 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <Text style={styles.intro}>{t('packs.intro')}</Text>
        {PACKS.map((pack) => (
          <Pressable key={pack.id} onPress={() => handlePick(pack)} style={styles.card} accessibilityRole="button">
            <View style={styles.cardTop}>
              <Text style={styles.cardEmoji}>{pack.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{t(pack.nameKey)}</Text>
                <Text style={styles.cardDesc}>{t(pack.descKey)}</Text>
              </View>
            </View>
            {pack.habits.map((h) => (
              <Text key={h.key} style={styles.habitLine} numberOfLines={2}>
                {h.emoji} {t(h.key)}
              </Text>
            ))}
          </Pressable>
        ))}
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
    headerTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
    intro: { color: theme.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 16 },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
    },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    cardEmoji: { fontSize: 30, marginRight: 12 },
    cardName: { color: theme.text, fontSize: 16, fontWeight: '800' },
    cardDesc: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
    habitLine: { color: theme.text, fontSize: 14, marginTop: 6, lineHeight: 19 },
  });
}
