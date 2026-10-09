import { backup } from '@/backup/runtime';
import { readLocalSave, updateLocalSave, getLocalRevision } from '@/backup/local';
import { translate } from '@/i18n/messages';
import type { Pet } from './pet';
export type { PetRecord } from './save';

async function ready() {
  try { await backup.initialize(); }
  catch { throw new Error(translate('backup.restoreError')); }
}
export async function loadPet(): Promise<Pet | null> {
  await ready();
  try { return (await readLocalSave()).pet; }
  catch { throw new Error(translate('save.unreadable')); }
}
export async function savePet(pet: Pet, revision = getLocalRevision()): Promise<void> {
  await updateLocalSave(save => {
    if (revision !== getLocalRevision()) throw new Error('CLOUD_CONFLICT');
    const id = `${pet.createdAt}:${pet.name}`;
    const memorial = pet.needs.health === 0 && !save.memorial.some(record => record.id === id)
      ? [...save.memorial, { id, pet }] : save.memorial;
    return { ...save, pet, memorial };
  });
  backup.changed();
}
export async function loadPetRecords() {
  await ready();
  try { return (await readLocalSave()).memorial; }
  catch { throw new Error(translate('memorial.invalid')); }
}
export async function archivePet(pet: Pet, revision = getLocalRevision()): Promise<void> {
  if (pet.needs.health !== 0) return;
  const id = `${pet.createdAt}:${pet.name}`;
  await updateLocalSave(save => {
    if (revision !== getLocalRevision()) throw new Error('CLOUD_CONFLICT');
    return save.memorial.some(record => record.id === id) ? save
      : { ...save, memorial: [...save.memorial, { id, pet }] };
  });
  backup.changed();
}
