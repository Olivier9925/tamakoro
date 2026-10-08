import type { ReminderAdapter } from './reminder-controller';

// Web fallback: never import the native notification module into the web bundle.
export const reminderPlatform: ReminderAdapter = {
  supported: false,
  permission: async () => 'unavailable', cancel: async () => {}, schedule: async () => {}, test: async () => {},
};
export function observeReminderTap(_open: () => void) { return () => {}; }
