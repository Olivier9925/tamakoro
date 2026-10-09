import { requireOptionalNativeModule } from 'expo';
import type { NotificationPermissionsStatus, NotificationResponse } from 'expo-notifications';
import { Platform } from 'react-native';
import type { ReminderAdapter, ReminderPermission } from './reminder-controller';
import { translate } from '@/i18n/messages';

const DAILY_ID = 'tamakoro.daily';
const TEST_ID = 'tamakoro.test';
const CHANNEL = 'tamakoro-reminders';

const supported = requireOptionalNativeModule('ExpoPushTokenManager') !== null;
let modulePromise: Promise<typeof import('expo-notifications')> | undefined;
function notifications() {
  modulePromise ??= import('expo-notifications').then(module => {
    module.setNotificationHandler({ handleNotification: async () => ({
      shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
    }) });
    return module;
  });
  return modulePromise;
}

async function channel() {
  const Notifications = await notifications();
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: translate('reminder.channel'), importance: Notifications.AndroidImportance.DEFAULT,
  });
}
function permissionValue(value: NotificationPermissionsStatus, Notifications: typeof import('expo-notifications')): ReminderPermission {
  if (value.ios) return [Notifications.IosAuthorizationStatus.AUTHORIZED,
    Notifications.IosAuthorizationStatus.PROVISIONAL, Notifications.IosAuthorizationStatus.EPHEMERAL]
    .includes(value.ios.status) ? 'granted'
    : value.ios.status === Notifications.IosAuthorizationStatus.DENIED ? 'denied' : 'undetermined';
  return value.granted ? 'granted' : value.status === 'denied' ? 'denied' : 'undetermined';
}
const content = (name: string) => ({ title: translate('reminder.notificationTitle'),
  body: translate('reminder.notificationBody', { name }), sound: 'default', data: { tamakoroReminder: true } });

export const reminderPlatform: ReminderAdapter = {
  supported,
  async permission(request) {
    if (!supported) return 'unavailable';
    const Notifications = await notifications();
    if (request) await channel();
    let value = await Notifications.getPermissionsAsync();
    if (request && permissionValue(value, Notifications) !== 'granted' && value.canAskAgain) {
      value = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
    }
    return permissionValue(value, Notifications);
  },
  async cancel() {
    if (!supported) return;
    const Notifications = await notifications();
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID);
    await Notifications.cancelScheduledNotificationAsync(TEST_ID);
  },
  async schedule(settings, name) {
    const Notifications = await notifications();
    await channel();
    await Notifications.scheduleNotificationAsync({ identifier: DAILY_ID, content: content(name),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.hour, minute: settings.minute, channelId: CHANNEL } });
  },
  async test(name) {
    const Notifications = await notifications();
    await channel();
    await Notifications.cancelScheduledNotificationAsync(TEST_ID);
    await Notifications.scheduleNotificationAsync({ identifier: TEST_ID, content: content(name),
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: CHANNEL } });
  },
};

export function observeReminderTap(open: () => void) {
  if (!supported) return () => {};
  let disposed = false;
  let unsubscribe: (() => void) | undefined;
  void notifications().then(Notifications => {
    if (disposed) return;
    const handle = (response: NotificationResponse | null) => {
      if (response?.notification.request.content.data?.tamakoroReminder === true) {
        open();
        Notifications.clearLastNotificationResponse();
      }
    };
    handle(Notifications.getLastNotificationResponse());
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    unsubscribe = () => subscription.remove();
  }).catch(() => { /* The reminder settings surface native module failures on refresh. */ });
  return () => { disposed = true; unsubscribe?.(); };
}
