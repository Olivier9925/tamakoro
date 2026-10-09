import { useSyncExternalStore } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { backup } from '@/backup/runtime';
import { TERMINAL_FONT } from './digital-art';
import { useI18n } from '@/i18n/provider';

export function BackupSettings() {
  const { t, language } = useI18n();
  const { status, savedAt } = useSyncExternalStore(backup.subscribe, backup.getSnapshot, backup.getSnapshot);
  const choose = (choice: 'local' | 'cloud') => Alert.alert(t('backup.title'), t('backup.confirm'), [
    { text: t('backup.cancel'), style: 'cancel' },
    { text: t(choice === 'local' ? 'backup.localChoice' : 'backup.cloudChoice'), onPress: () => { void backup.resolve(choice); } },
  ]);
  const button = (label: string, onPress: () => void) => <Pressable accessibilityRole="button"
    onPress={onPress} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 10,
      borderRadius: 6, borderWidth: 1, borderColor: '#2d474b', backgroundColor: '#09151b' }}>
    <Text style={{ color: '#d7ffe4', fontFamily: TERMINAL_FONT, fontSize: 11 }}>{label}</Text>
  </Pressable>;
  return <View style={{ gap: 8, padding: 12, backgroundColor: '#101c26', borderRadius: 10,
    borderWidth: 1, borderColor: '#354650' }}>
    <Text accessibilityRole="header" style={{ color: '#d4fbb5', fontFamily: TERMINAL_FONT,
      fontSize: 14, fontWeight: '700' }}>{t('backup.title')}</Text>
    <Text accessibilityLiveRegion="polite" style={{ color: '#a3bcc0', fontFamily: TERMINAL_FONT, fontSize: 11 }}>
      {t(`backup.${status}`)}
    </Text>
    {status === 'system' && <Text style={{ color: '#87b8c3', fontSize: 12 }}>{t('backup.systemNote')}</Text>}
    {savedAt !== null && status === 'synced' && <Text style={{ color: '#87b8c3', fontSize: 12 }}>
      {t('backup.date', { date: new Date(savedAt).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US') })}
    </Text>}
    {status === 'conflict' ? <>
      {button(t('backup.localChoice'), () => choose('local'))}
      {button(t('backup.cloudChoice'), () => choose('cloud'))}
    </> : status !== 'local' && status !== 'system' && status !== 'checking'
      && button(t('backup.retry'), () => { void backup.refresh().catch(() => {}); })}
  </View>;
}
