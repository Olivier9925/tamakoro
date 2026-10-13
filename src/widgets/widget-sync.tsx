import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { backup } from '../backup/runtime';
import { subscribeLocalSave } from '../backup/local';
import { useI18n } from '../i18n/provider';
import { refreshWidget } from './sync';

export function WidgetSync() {
  const { language } = useI18n();
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        if (active) void refreshWidget(language).catch(() => {});
      }, 250);
    };
    const initialize = () => {
      void backup.initialize().then(() => { if (active) refresh(); }).catch(() => {});
    };
    const stop = subscribeLocalSave(refresh);
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') initialize(); });
    initialize();
    return () => { active = false; if (timer) clearTimeout(timer); stop(); foreground.remove(); };
  }, [language]);
  return null;
}
