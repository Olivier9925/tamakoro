import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';
import { BackupController, type RemoteSave } from './controller';
import { readLocalSave, replaceLocalSave, readSyncMeta, writeSyncMeta } from './local';
type NativeBackup = { readBackup(): Promise<RemoteSave>; writeBackup(payload: string, account: string, tag: string): Promise<string> };
const native = Platform.OS === 'ios' ? requireOptionalNativeModule<NativeBackup>('TamakoroCloudBackup') : null;
function deadline<T>(operation: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Cloud timeout')), 15000);
    operation.then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
  });
}
export const backup = new BackupController({
  kind: Platform.OS === 'ios' ? 'cloud' : Platform.OS === 'android' ? 'system' : 'local',
  readLocal: readLocalSave, replaceLocal: replaceLocalSave, readMeta: readSyncMeta, writeMeta: writeSyncMeta,
  async readCloud() {
    if (!native) throw new Error('CLOUD_UNAVAILABLE');
    return deadline(native.readBackup());
  },
  async writeCloud(save) {
    if (!native) throw new Error('CLOUD_UNAVAILABLE');
    return deadline(native.writeBackup(save.payload, save.account, save.tag));
  },
});
