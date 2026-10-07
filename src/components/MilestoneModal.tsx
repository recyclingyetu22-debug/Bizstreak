import React, { useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { useStore } from '../store';
import { Theme } from '../theme';
import { useTheme } from '../ThemeContext';
import { useT } from '../useT';
import { showAlert } from '../alert';
import type { TKey } from '../i18n';

// Pops up when a habit's streak reaches 7, 30 or 100 days. The card inside is
// what gets shared as a picture.
export default function MilestoneModal() {
  const { celebration, dismissCelebration } = useStore();
  const theme = useTheme();
  const t = useT();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  if (!celebration) return null;
  const m = celebration.milestone;
  const trophy = m >= 100 ? '👑' : m >= 30 ? '🏆' : '🔥';

  const handleShare = async () => {
    if (!cardRef.current) return;
    try {
      setSharing(true);
      const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('ms.shareTitle') });
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
    <Modal visible transparent animationType="fade" onRequestClose={dismissCelebration}>
      <View style={styles.backdrop}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View collapsable={false} ref={cardRef} style={styles.card}>
            <Text style={styles.trophy}>{trophy}</Text>
            <Text style={styles.title}>{t('ms.title', { n: m })}</Text>
            <Text style={styles.habit} numberOfLines={3}>
              {celebration.emoji} {celebration.name}
            </Text>
            <Text style={styles.body}>{t(`ms.body${m}` as TKey)}</Text>
            <Text style={styles.footer}>{t('det.tracked')}</Text>
          </View>

          <Pressable onPress={handleShare} disabled={sharing} style={styles.primary}>
            <Text style={styles.primaryText}>{sharing ? t('det.preparing') : t('ms.share')}</Text>
          </Pressable>
          <Pressable onPress={dismissCelebration} style={styles.secondary}>
            <Text style={styles.secondaryText}>{t('ms.close')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)' },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    card: {
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.accent,
      borderRadius: 22,
      paddingVertical: 28,
      paddingHorizontal: 22,
      alignItems: 'center',
    },
    trophy: { fontSize: 64 },
    title: { color: theme.accent, fontSize: 26, fontWeight: '800', marginTop: 10, textAlign: 'center' },
    habit: { color: theme.text, fontSize: 17, fontWeight: '700', marginTop: 12, textAlign: 'center' },
    body: { color: theme.textMuted, fontSize: 14, lineHeight: 20, marginTop: 12, textAlign: 'center' },
    footer: { color: theme.textFaint, fontSize: 11, marginTop: 20 },
    primary: { marginTop: 18, backgroundColor: theme.accent, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
    primaryText: { color: theme.accentOn, fontSize: 16, fontWeight: '800' },
    secondary: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
    secondaryText: { color: theme.text, fontSize: 15, fontWeight: '600' },
  });
}
