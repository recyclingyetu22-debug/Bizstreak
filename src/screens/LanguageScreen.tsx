import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import { LANGUAGES, Language } from '../i18n';
import { syncHabitReminders } from '../notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

// The very first screen: pick a language, then the intro is shown in it.
export default function LanguageScreen({ navigation }: Props) {
  const { language, setLanguage, habits } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const choose = (code: Language) => {
    setLanguage(code);
    syncHabitReminders(habits, code);
    navigation.replace('Onboarding');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.globe}>🌍</Text>
        <Text style={styles.title}>{t('lang.title')}</Text>
        <View style={styles.list}>
          {LANGUAGES.map((l) => (
            <Pressable
              key={l.code}
              onPress={() => choose(l.code)}
              accessibilityRole="button"
              style={[styles.row, language === l.code && styles.rowActive]}
            >
              <Text style={styles.rowText}>{l.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    globe: { fontSize: 52, textAlign: 'center' },
    title: { color: theme.text, fontSize: 22, fontWeight: '800', textAlign: 'center', marginTop: 12, marginBottom: 22 },
    list: { gap: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    rowActive: { borderColor: theme.accent },
    rowText: { color: theme.text, fontSize: 17, fontWeight: '700' },
    chevron: { color: theme.textMuted, fontSize: 22 },
  });
}
