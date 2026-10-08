import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsePet, type Pet } from './pet';

const KEY = 'tamakoro.pet.v1';
export async function loadPet(): Promise<Pet | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw === null ? null : parsePet(raw);
}
export async function savePet(pet: Pet): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(pet));
}
