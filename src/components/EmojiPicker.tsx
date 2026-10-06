import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

// A tap-to-pick set of business-flavoured emojis. The text box next to it
// still accepts any emoji typed from the phone keyboard.
export const EMOJI_CHOICES = [
  '✅', '📦', '💰', '📞', '🎯', '📊', '📱', '📝', '🧾', '🤝',
  '📈', '🛒', '🚚', '📅', '💼', '📣', '🧹', '⏰', '💡', '🔥',
];

interface Props {
  value: string;
  onChange: (emoji: string) => void;
}

export default function EmojiPicker({ value, onChange }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      {EMOJI_CHOICES.map((e) => (
        <Pressable
          key={e}
          onPress={() => onChange(e)}
          style={[styles.cell, value === e && styles.cellActive]}
        >
          <Text style={styles.emoji}>{e}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    cell: {
      width: 46,
      height: 46,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cellActive: { borderColor: theme.accent, backgroundColor: theme.mode === 'dark' ? '#12241A' : '#E7F6EC' },
    emoji: { fontSize: 22 },
  });
}
