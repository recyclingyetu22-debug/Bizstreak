import { Alert, Platform } from 'react-native';

type AlertButton = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

/** On phones this is the normal Alert. On the web preview (used only while
 * developing) react-native-web has no Alert, so fall back to the browser's
 * own confirm/alert so the same flows can be tested. */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const g = globalThis as any;
  const text = message ? `${title}\n\n${message}` : title;
  const action = buttons?.find((b) => b.style !== 'cancel');
  if (buttons && buttons.length > 1) {
    if (g.confirm(text)) action?.onPress?.();
  } else {
    g.alert(text);
    action?.onPress?.();
  }
}
