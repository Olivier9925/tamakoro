import { requireOptionalNativeModule } from 'expo';
import { readLocalSave } from '../backup/local';
import { type Language } from '../i18n/messages';
import { widgetArt } from './art';
import { widgetTimeline } from './timeline';

let queue: Promise<void> = Promise.resolve();
let latestLanguage: Language = 'en';
let imagePaths: Promise<Record<string, string>> | null = null;
async function prepareImages(directory: string) {
  const { Asset } = await import('expo-asset');
  const { Directory, File } = await import('expo-file-system');
  const folder = new Directory(directory, 'tamakoro-art-v1');
  folder.create({ idempotent: true, intermediates: true });
  const paths: Record<string, string> = {};
  for (const [key, source] of Object.entries(widgetArt)) {
    const target = new File(folder, `${key}.png`);
    if (!target.exists) {
      const asset = await Asset.fromModule(source).downloadAsync();
      if (!asset.localUri) throw new Error('Missing widget image');
      new File(asset.localUri).copy(target);
    }
    paths[key] = target.uri;
  }
  return paths;
}
export function refreshWidget(language?: Language): Promise<void> {
  if (language) latestLanguage = language;
  // Old development builds and Expo Go remain usable until rebuilt with widgets.
  if (!requireOptionalNativeModule('ExpoWidgets')) return Promise.resolve();
  const task = queue.catch(() => {}).then(async () => {
    const { widgetsDirectory } = await import('expo-widgets');
    if (!widgetsDirectory) return;
    const { default: widget } = await import('./tamakoro-widget');
    if (!imagePaths) imagePaths = prepareImages(widgetsDirectory).catch(error => { imagePaths = null; throw error; });
    const paths = await imagePaths;
    const { pet } = await readLocalSave();
    const entries = widgetTimeline(pet, Date.now(), latestLanguage);
    widget.updateTimeline(entries.map(entry => ({ ...entry, props: { ...entry.props, image: paths[entry.props.artKey] } })));
  });
  queue = task;
  return task;
}
// The exported method rejects on failures so callers can retry without affecting the game save.
