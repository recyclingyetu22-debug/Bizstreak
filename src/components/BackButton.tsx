import React, { useMemo } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';

interface Props {
  onPress: () => void;
  style?: ViewStyle;
}

// One visible "< Back" used on every screen, so nobody has to rely on the
// phone's own back arrow.
export default function BackButton({ onPress, style }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" style={[styles.btn, style]}>
      <Text style={styles.text}>‹ Back</Text>
    </Pressable>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    btn: { paddingVertical: 4, paddingRight: 8 },
    text: { color: theme.text, fontSize: 15 },
  });
}
