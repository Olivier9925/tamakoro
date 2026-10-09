import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseSave } from '../game/save';
import { createSaveStore } from './store';
const META = 'tamakoro.cloud.v1';
export const { readLocalSave, updateLocalSave, replaceLocalSave, getLocalRevision } = createSaveStore(AsyncStorage);
export type SyncMeta = { account: string; tag: string; payload: string };
export async function readSyncMeta(): Promise<SyncMeta | null> {
  const raw = await AsyncStorage.getItem(META);
  if (raw === null) return null;
  const value = JSON.parse(raw);
  if (!value || typeof value.account !== 'string' || typeof value.tag !== 'string' || typeof value.payload !== 'string') throw new Error('Invalid sync metadata');
  parseSave(value.payload);
  return value as SyncMeta;
}
export const writeSyncMeta = (meta: SyncMeta) => AsyncStorage.setItem(META, JSON.stringify(meta));
