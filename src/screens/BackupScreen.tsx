import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Share } from 'react-native';
import { showAlert } from '../alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import BackButton from '../components/BackButton';
import { createBackup, limitForPlan, parseBackup } from '../backup';
import { cancelHabitReminder, syncHabitReminders } from '../notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Backup'>;

export default function BackupScreen({ navigation }: Props) {
  const { habits, isPro, themeMode, language, reminderEnabled, reminderTime, restoreData } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [exportText, setExportText] = useState('');
  const [input, setInput] = useState('');

  const handleExport = async () => {
    if (habits.length === 0) {
      showAlert(t('bk.title'), t('bk.nothing'));
      return;
    }
    const text = createBackup({ habits, isPro, onboarded: true, themeMode, reminderEnabled, reminderTime, language });
    // Shown on screen as well, so it can be copied by hand if the share menu
    // misbehaves on some phone.
    setExportText(text);
    try {
      await Share.share({ message: text, title: t('bk.shareTitle') });
    } catch {
      /* the text box below still has the backup */
    }
  };

  const handleRestore = () => {
    if (!input.trim()) {
      showAlert(t('bk.title'), t('bk.empty'));
      return;
    }
    const parsed = parseBackup(input);
    if (!parsed.ok) {
      showAlert(t('bk.title'), t('bk.invalid'));
      return;
    }
    if (parsed.habits.length === 0) {
      showAlert(t('bk.title'), t('bk.noHabits'));
      return;
    }
    const { habits: kept, dropped } = limitForPlan(parsed.habits, isPro);
    showAlert(t('bk.confirmTitle'), t('bk.confirmBody', { n: kept.length }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('bk.confirmYes'),
        onPress: () => {
          // Old habits' reminders must not outlive the data they belonged to.
          habits.forEach((h) => cancelHabitReminder(h.id));
          restoreData(kept, parsed.themeMode, parsed.language);
          syncHabitReminders(kept, parsed.language);
          setInput('');
          const note = dropped > 0 ? '\n\n' + t('bk.freeLimit', { dropped }) : '';
          showAlert(t('bk.doneTitle'), t('bk.doneBody', { n: kept.length }) + note, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{t('bk.title')}</Text>
        <View style={{ width: 56 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('bk.exportTitle')}</Text>
          <Text style={styles.cardBody}>{t('bk.exportBody')}</Text>
          <Pressable onPress={handleExport} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t('bk.exportBtn')}</Text>
          </Pressable>
          {exportText ? (
            <>
              <Text style={styles.smallLabel}>{t('bk.textLabel')}</Text>
              <TextInput
                value={exportText}
                onChangeText={() => {}}
                multiline
                selectTextOnFocus
                showSoftInputOnFocus={false}
                style={[styles.box, { maxHeight: 130 }]}
              />
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('bk.importTitle')}</Text>
          <Text style={styles.cardBody}>{t('bk.importBody')}</Text>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('bk.placeholder')}
            placeholderTextColor={theme.textFaint}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.box, { minHeight: 110 }]}
          />
          <Pressable onPress={handleRestore} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>{t('bk.restoreBtn')}</Text>
          </Pressable>
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
    },
    headerTitle: { color: theme.text, fontSize: 16, fontWeight: '700' },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
      marginBottom: 20,
    },
    cardTitle: { color: theme.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
    cardBody: { color: theme.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 14 },
    primaryBtn: { backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    primaryBtnText: { color: theme.accentOn, fontSize: 15, fontWeight: '800' },
    secondaryBtn: {
      marginTop: 12,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.accent,
    },
    secondaryBtnText: { color: theme.accent, fontSize: 15, fontWeight: '800' },
    smallLabel: { color: theme.textFaint, fontSize: 11, marginTop: 14, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    box: {
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      color: theme.text,
      fontSize: 12,
      textAlignVertical: 'top',
    },
  });
}
