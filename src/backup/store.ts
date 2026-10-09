import { emptySave, content, parseRecords, parseSave, type GameSave } from '../game/save';
import { parsePet } from '../game/pet';

type Storage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; multiGet(keys: string[]): Promise<readonly (readonly [string, string | null])[]> };
export function createSaveStore(storage: Storage) {
  const KEY = 'tamakoro.game.v1';
  let revision = 0;
  const getLocalRevision = () => revision;
  let queue: Promise<unknown> = Promise.resolve();
  function serialize<T>(operation: () => Promise<T>): Promise<T> {
    const pending = queue.catch(() => {}).then(operation);
    queue = pending;
    return pending;
  }
  async function write(save: GameSave) {
    const payload = JSON.stringify(save);
    parseSave(payload);
    await storage.setItem(KEY, payload);
  }
  async function read(): Promise<GameSave> {
    const raw = await storage.getItem(KEY);
    if (raw !== null) return parseSave(raw);
    const values = await storage.multiGet(['tamakoro.pet.v1', 'tamakoro.memorial.v1']);
    const pet = values[0][1] === null ? null : parsePet(values[0][1]);
    const memorial = values[1][1] === null ? [] : parseRecords(values[1][1]);
    const save: GameSave = { ...emptySave(), pet, memorial, savedAt: pet?.updatedAt ?? 0 };
    if (pet || memorial.length) await write(save);
    return save;
  }
  const readLocalSave = () => serialize(read);
  const updateLocalSave = (update: (save: GameSave) => GameSave) => serialize(async () => {
    const before = await read();
    const after = update(before);
    if (content(after) !== content(before)) await write({ ...after, savedAt: Date.now() });
  });
  const replaceLocalSave = (expected: GameSave, next: GameSave) => serialize(async () => {
    if (JSON.stringify(await read()) !== JSON.stringify(expected)) throw new Error('CLOUD_CONFLICT');
    await write(next);
    revision++;
  });
  return { readLocalSave, updateLocalSave, replaceLocalSave, getLocalRevision };
}
