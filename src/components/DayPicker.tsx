import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import { WEEKDAY_OPTIONS } from '../types';
import type { TKey } from '../i18n';

interface Props {
  value: number[]; // 0 = Sunday .. 6 = Saturday
  // A state setter: toggles are applied to the latest list, so two quick taps
  // on different days can never overwrite each other.
  onChange: React.Dispatch<React.SetStateAction<number[]>>;
}

// Seven day chips. At least one day must stay selected, so a habit can never
// end up with a schedule that counts on no day at all.
export default function DayPicker({ value, onChange }: Props) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const toggle = (dow: number) => {
    onChange((prev) => {
      if (prev.includes(dow)) return prev.length === 1 ? prev : prev.filter((d) => d !== dow);
      return [...prev, dow];
    });
  };

  return (
    <View style={styles.row}>
      {WEEKDAY_OPTIONS.map((o) => {
        const active = value.includes(o.dow);
        return (
          <Pressable key={o.dow} onPress={() => toggle(o.dow)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.text, active && styles.textActive]}>{t(`dayShort.${o.dow}` as TKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 6 },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 11,
      borderRadius: 10,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    text: { color: theme.textMuted, fontSize: 12, fontWeight: '700' },
    textActive: { color: theme.accentOn },
  });
}
