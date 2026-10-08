import { useSyncExternalStore } from 'react';
import { reminders } from '@/reminders/reminders';

export function useReminders() {
  return useSyncExternalStore(reminders.subscribe, reminders.getSnapshot, reminders.getSnapshot);
}
