import AsyncStorage from '@react-native-async-storage/async-storage';
import { advancePet, isPetDead } from '@/game/pet';
import { loadPet } from '@/game/storage';
import { ReminderController } from './reminder-controller';
import { reminderPlatform } from './reminder-platform';

const KEY = 'tamakoro.reminders.v1';
export const reminders = new ReminderController({
  platform: reminderPlatform,
  read: () => AsyncStorage.getItem(KEY),
  write: settings => AsyncStorage.setItem(KEY, JSON.stringify(settings)),
  async pet() {
    const saved = await loadPet();
    const pet = saved ? advancePet(saved, Date.now()) : null;
    return pet ? { name: pet.name, alive: !isPetDead(pet) } : null;
  },
});
