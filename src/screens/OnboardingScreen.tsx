import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import type { TKey } from '../i18n';
import BackButton from '../components/BackButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

const SLIDES: { emoji: string; title: TKey; body: TKey }[] = [
  { emoji: '📈', title: 'onb.1.title', body: 'onb.1.body' },
  { emoji: '🔥', title: 'onb.2.title', body: 'onb.2.body' },
  { emoji: '🔒', title: 'onb.3.title', body: 'onb.3.body' },
];

export default function OnboardingScreen({ navigation }: Props) {
  const { setOnboarded } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const finish = () => {
    setOnboarded(true);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Home');
    }
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
    } else {
      finish();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {navigation.canGoBack() && (
        <BackButton onPress={() => navigation.goBack()} style={styles.back} />
      )}
      <Pressable onPress={finish} style={styles.skip} hitSlop={10}>
        <Text style={styles.skipText}>{t('onb.skip')}</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{s.emoji}</Text>
            <Text style={styles.title}>{t(s.title)}</Text>
            <Text style={styles.body}>{t(s.body)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Pressable onPress={next} style={styles.cta}>
          <Text style={styles.ctaText}>{index === SLIDES.length - 1 ? t('onb.start') : t('onb.next')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    back: { position: 'absolute', top: 20, left: 20, zIndex: 1 },
    skip: { position: 'absolute', top: 16, right: 20, zIndex: 1, padding: 8 },
    skipText: { color: theme.textMuted, fontSize: 14 },
    slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
    emoji: { fontSize: 64, marginBottom: 24 },
    title: { color: theme.text, fontSize: 24, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
    body: { color: theme.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
    footer: { paddingHorizontal: 24, paddingBottom: 20 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.border },
    dotActive: { backgroundColor: theme.accent, width: 20 },
    cta: { backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    ctaText: { color: theme.accentOn, fontSize: 16, fontWeight: '800' },
  });
}
