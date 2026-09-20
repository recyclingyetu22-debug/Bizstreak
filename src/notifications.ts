import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const DAILY_REMINDER_ID = 'bizstreak-daily-reminder';

// expo-notifications' Android push-registration code was removed from Expo
// Go as of SDK 53 — merely IMPORTING the module now throws in Expo Go, even
// though this app only ever schedules LOCAL reminders, never push. A
// dynamic import() defers evaluating that module until one of the functions
// below actually runs, and we skip calling it at all while running inside
// Expo Go — so the rest of the app keeps working during a quick test.
// Everything here works normally in a real build (EAS development build or
// a store build), where this restriction doesn't apply.
export const notificationsAvailable =
  Constants.appOwnership !== 'expo' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

async function loadNotifications() {
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  return Notifications;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!notificationsAvailable) return false;
  const Notifications = await loadNotifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Schedules (or replaces) the single daily reminder at the given "HH:MM". */
export async function scheduleDailyReminder(time: string): Promise<void> {
  if (!notificationsAvailable) return;
  const Notifications = await loadNotifications();
  const [hour, minute] = time.split(':').map(Number);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: 'Keep your streak alive 🔥',
      body: "Take two minutes — check off today's business habits.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  if (!notificationsAvailable) return;
  const Notifications = await loadNotifications();
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
}
