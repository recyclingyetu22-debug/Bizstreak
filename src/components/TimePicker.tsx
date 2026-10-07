import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';

interface Props {
  value: string; // "HH:MM", 24h
  onChange: (time: string) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function parse(value: string) {
  const [h, m] = value.split(':').map(Number);
  return { h: Number.isFinite(h) ? h : 9, m: Number.isFinite(m) ? m : 0 };
}

// Exact hour and minute: tap ▲ / ▼ to step by one, or tap the number and type it.
export default function TimePicker({ value, onChange }: Props) {
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const parsed = parse(value);

  // Local hour/minute are the source of truth while the user is tapping, so
  // several quick taps all count (each step builds on the latest value).
  const [hh, setHh] = useState(parsed.h);
  const [mm, setMm] = useState(parsed.m);
  const [hText, setHText] = useState(pad(parsed.h));
  const [mText, setMText] = useState(pad(parsed.m));

  // Follow changes that come from outside the picker.
  useEffect(() => {
    setHh(parsed.h);
    setMm(parsed.m);
  }, [parsed.h, parsed.m]);

  // Keep the text boxes showing the current numbers.
  useEffect(() => {
    setHText(pad(hh));
    setMText(pad(mm));
  }, [hh, mm]);

  // Tell the parent whenever the local time differs from what it holds.
  useEffect(() => {
    const next = pad(hh) + ':' + pad(mm);
    if (next !== value) onChange(next);
  }, [hh, mm]);

  const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));
  const finishHour = () => setHh(clamp(parseInt(hText, 10) || 0, 23));
  const finishMinute = () => setMm(clamp(parseInt(mText, 10) || 0, 59));

  const column = (
    label: string,
    text: string,
    setText: (s: string) => void,
    finish: () => void,
    step: (d: number) => void,
  ) => (
    <View style={styles.col}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => step(1)} hitSlop={8} style={styles.arrow} accessibilityLabel={label + ' +'}>
        <Text style={styles.arrowText}>▲</Text>
      </Pressable>
      <TextInput
        value={text}
        onChangeText={(s) => setText(s.replace(/[^0-9]/g, '').slice(0, 2))}
        onEndEditing={finish}
        onSubmitEditing={finish}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        style={styles.input}
      />
      <Pressable onPress={() => step(-1)} hitSlop={8} style={styles.arrow} accessibilityLabel={label + ' -'}>
        <Text style={styles.arrowText}>▼</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.row}>
      {column(t('set.hour'), hText, setHText, finishHour, (d) => setHh((p) => (p + d + 24) % 24))}
      <Text style={styles.colon}>:</Text>
      {column(t('set.minute'), mText, setMText, finishMinute, (d) => setMm((p) => (p + d + 60) % 60))}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    col: { alignItems: 'center' },
    label: { color: theme.textFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
    arrow: { paddingVertical: 6, paddingHorizontal: 22 },
    arrowText: { color: theme.accent, fontSize: 16 },
    input: {
      width: 74,
      height: 54,
      borderRadius: 12,
      textAlign: 'center',
      fontSize: 26,
      fontWeight: '700',
      color: theme.text,
      backgroundColor: theme.bg,
      borderWidth: 1,
      borderColor: theme.border,
    },
    colon: { color: theme.text, fontSize: 26, fontWeight: '700', marginTop: 40 },
  });
}
