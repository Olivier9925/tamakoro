import AsyncStorage from '@react-native-async-storage/async-storage';
import { parsePet, type Pet } from './pet';

const KEY = 'tamakoro.pet.v1';
const HISTORY_KEY = 'tamakoro.memorial.v1';
export type PetRecord = { id: string; pet: Pet };

function parsePetRecords(raw: string): PetRecord[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Le mémorial ne peut pas être lu. Les données sont conservées sur cet appareil.');
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('id' in entry) || typeof entry.id !== 'string'
      || !('pet' in entry) || !entry.pet || typeof entry.pet !== 'object') {
      throw new Error('Le mémorial ne peut pas être lu. Les données sont conservées sur cet appareil.');
    }
    const pet = parsePet(JSON.stringify(entry.pet));
    if (pet.needs.health !== 0 || entry.id !== `${pet.createdAt}:${pet.name}`) {
      throw new Error('Le mémorial contient une fiche invalide. Les données sont conservées sur cet appareil.');
    }
    return { id: entry.id, pet };
  });
}

export async function loadPet(): Promise<Pet | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw === null ? null : parsePet(raw);
}
export async function savePet(pet: Pet): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(pet));
}

export async function loadPetRecords(): Promise<PetRecord[]> {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw === null ? [] : parsePetRecords(raw);
}

export async function archivePet(pet: Pet): Promise<void> {
  if (pet.needs.health !== 0) return;
  const records = await loadPetRecords();
  const id = `${pet.createdAt}:${pet.name}`;
  if (records.some(record => record.id === id)) return;
  const next = [...records, { id, pet }];
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}
