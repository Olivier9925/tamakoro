import { Button, Host, Switch } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native';
import { TERMINAL_FONT } from '@/components/digital-art';
import { TerminalPanel } from '@/components/terminal-panel';
import { useReminders } from '@/hooks/use-reminders';
import { reminderTime } from '@/reminders/reminder-controller';
import { reminders } from '@/reminders/reminders';
import { useI18n } from '@/i18n/provider';

export function ReminderSettings() {
  const state = useReminders();
  const { t, language } = useI18n();
  useEffect(() => { void reminders.refresh(); }, [language]);
  const [choosingTime, setChoosingTime] = useState(false);
  const [draftTime, setDraftTime] = useState(new Date());
  const supported = state.permission !== 'unavailable';
  const disabled = state.loading || state.busy || !supported;
  const date = new Date();
  date.setHours(state.settings.hour, state.settings.minute, 0, 0);
  const saveTime = async (value: Date) => {
    const saved = await reminders.save({ ...state.settings, hour: value.getHours(), minute: value.getMinutes() });
    if (saved) setChoosingTime(false);
  };
  const status = !supported ? Platform.OS === 'web' ? t('settings.reminderSupported')
    : t('settings.reminderModuleMissing')
    : !state.pet?.alive ? t('settings.reminderResume')
    : !state.settings.enabled ? t('settings.reminderDisabled')
    : state.permission !== 'granted' ? t('settings.reminderSuspended')
    : t('settings.reminderDaily', { time: reminderTime(state.settings) });
  return <TerminalPanel style={{ gap: 10, padding: 14 }}>
    <Text accessibilityRole="header" style={{ color: '#d4fbb5', fontFamily: TERMINAL_FONT,
      fontSize: 16, fontWeight: '700' }}>{'>_ '}{t('settings.reminders')}</Text>
    {state.loading ? <ActivityIndicator color="#a9d875" /> : <>
      <Host matchContents colorScheme="dark" seedColor="#a9d875">
        <Switch label={t('settings.dailyReminder')} value={state.settings.enabled}
          disabled={disabled || (!state.pet?.alive && !state.settings.enabled)}
          onValueChange={enabled => { void reminders.save({ ...state.settings, enabled }); }} />
      </Host>
      <Text accessibilityLiveRegion="polite" style={{ color: '#c3d7dc', fontFamily: TERMINAL_FONT,
        fontSize: 13, lineHeight: 20 }}>{status}</Text>
      <View style={{ alignItems: 'flex-start', gap: 8 }}>
        <Host matchContents colorScheme="dark" seedColor="#a9d875">
          <Button label={t('settings.time', { time: reminderTime(state.settings) })} variant="outlined" disabled={disabled}
            onPress={() => { setDraftTime(date); setChoosingTime(true); }} />
        </Host>
        {choosingTime && <DateTimePicker mode="time" value={draftTime} is24Hour locale={language === 'fr' ? 'fr_FR' : 'en_US'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} style={{ width: '100%' }}
          themeVariant="dark" accentColor="#a9d875" disabled={state.busy}
          onDismiss={() => setChoosingTime(false)}
          onValueChange={(_event, value) => {
            setDraftTime(value);
            if (Platform.OS === 'android') { setChoosingTime(false); void saveTime(value); }
          }} />}
        {choosingTime && Platform.OS === 'ios' && <>
          <Host matchContents colorScheme="dark" seedColor="#a9d875">
            <Button label={t('settings.saveTime')} disabled={disabled} onPress={() => { void saveTime(draftTime); }} />
          </Host>
          <Host matchContents colorScheme="dark" seedColor="#a9d875">
            <Button label={t('home.cancel')} variant="outlined" disabled={state.busy} onPress={() => setChoosingTime(false)} />
          </Host>
        </>}
        <Host matchContents colorScheme="dark" seedColor="#a9d875">
          <Button label={t('settings.testReminder')} variant="outlined"
            disabled={disabled || !state.settings.enabled || state.permission !== 'granted' || !state.pet?.alive}
            onPress={() => { void reminders.test(); }} />
        </Host>
        {supported && state.permission === 'denied' && <Host matchContents colorScheme="dark" seedColor="#a9d875">
          <Button label={t('settings.phoneSettings')} variant="outlined" onPress={() => { void Linking.openSettings(); }} />
        </Host>}
      </View>
    </>}
    {state.message && <Text accessibilityLiveRegion="polite" style={{ color: '#a9d875', fontFamily: TERMINAL_FONT,
      fontSize: 12, lineHeight: 18 }}>{state.message}</Text>}
    {state.error && <>
      <Text accessibilityRole="alert" style={{ color: '#ffb09c', fontFamily: TERMINAL_FONT,
        fontSize: 12, lineHeight: 18 }}>{state.error}</Text>
      <Host matchContents colorScheme="dark" seedColor="#a9d875">
        <Button label={t('settings.retry')} variant="outlined" disabled={state.busy} onPress={() => { void reminders.refresh(); }} />
      </Host>
    </>}
    <Text style={{ color: '#91abb7', fontFamily: TERMINAL_FONT, fontSize: 12, lineHeight: 18 }}>
      {t('settings.reminderNote')}
    </Text>
  </TerminalPanel>;
}
