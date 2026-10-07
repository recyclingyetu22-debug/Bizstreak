import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Language, translate } from './i18n';
import { Habit } from './types';
import { habitReminderIds, planHabitReminder } from './reminderPlan';

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
export async function scheduleDailyReminder(time: string, lang: Language = 'en'): Promise<void> {
  if (!notificationsAvailable) return;
  const Notifications = await loadNotifications();
  const [hour, minute] = time.split(':').map(Number);

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: translate(lang, 'rem.channel'),
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: translate(lang, 'rem.title'),
      body: translate(lang, 'rem.body'),
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

// ---- A reminder of its own for a single habit -------------------------------
// Each habit can have its own time. A habit that only counts on some days
// only reminds on those days (see reminderPlan.ts, which is unit-tested).

export async function cancelHabitReminder(habitId: string): Promise<void> {
  if (!notificationsAvailable) return;
  try {
    const Notifications = await loadNotifications();
    await Promise.all(habitReminderIds(habitId).map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
  } catch {
    /* nothing scheduled, nothing to cancel */
  }
}

export async function scheduleHabitReminder(habit: Habit, lang: Language = 'en'): Promise<void> {
  if (!notificationsAvailable) return;
  try {
    await cancelHabitReminder(habit.id); // replace whatever was there before
    const slots = planHabitReminder(habit);
    if (slots.length === 0) return;
    const Notifications = await loadNotifications();
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: translate(lang, 'rem.channel'),
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    for (const slot of slots) {
      await Notifications.scheduleNotificationAsync({
        identifier: slot.id,
        content: { title: habit.emoji + ' ' + habit.name, body: translate(lang, 'rem.habitBody') },
        trigger:
          slot.weekday === undefined
            ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: slot.hour, minute: slot.minute }
            : { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: slot.weekday, hour: slot.hour, minute: slot.minute },
      });
    }
  } catch {
    // A reminder that cannot be scheduled must never get in the way of saving a habit.
  }
}

/** Re-creates every habit reminder (after a restore or a language change). */
export async function syncHabitReminders(habits: Habit[], lang: Language): Promise<void> {
  for (const habit of habits) await scheduleHabitReminder(habit, lang);
}
