import { parsePet, type Pet } from './pet';

export type PetRecord = { id: string; pet: Pet };
export type GameSave = { version: 1; savedAt: number; pet: Pet | null; memorial: PetRecord[] };
export function parseRecords(raw: string): PetRecord[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Invalid memorial');
  const ids = new Set<string>();
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('id' in entry) || typeof entry.id !== 'string'
      || !('pet' in entry)) throw new Error('Invalid memorial');
    const pet = parsePet(JSON.stringify(entry.pet));
    if (pet.needs.health !== 0 || entry.id !== `${pet.createdAt}:${pet.name}` || ids.has(entry.id)) throw new Error('Invalid memorial');
    ids.add(entry.id);
    return { id: entry.id, pet };
  });
}
export function parseSave(raw: string): GameSave {
  // CloudKit records are limited in size; count UTF-8 bytes, including emoji names.
  const bytes = Array.from(raw).reduce((sum, char) => {
    const code = char.codePointAt(0)!;
    return sum + (code < 128 ? 1 : code < 2048 ? 2 : code < 65536 ? 3 : 4);
  }, 0);
  if (bytes > 700_000) throw new Error('Backup too large');
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object' || value.version !== 1 || !Number.isFinite(value.savedAt) || value.savedAt < 0 || !('pet' in value)) throw new Error('Invalid backup');
  return { version: 1, savedAt: value.savedAt, pet: value.pet === null ? null : parsePet(JSON.stringify(value.pet)),
    memorial: parseRecords(JSON.stringify(value.memorial)) };
}
export const emptySave = (): GameSave => ({ version: 1, savedAt: 0, pet: null, memorial: [] });
export const hasData = (save: GameSave) => save.pet !== null || save.memorial.length > 0;
export const content = (save: GameSave) => JSON.stringify({ pet: save.pet, memorial: save.memorial });
