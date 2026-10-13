// Android and web do not import iOS native modules.
import type { Language } from '../i18n/messages';
export function refreshWidget(_language?: Language): Promise<void> { return Promise.resolve(); }
