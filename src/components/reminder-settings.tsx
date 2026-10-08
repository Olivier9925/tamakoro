import { Button, Host, Switch } from '@expo/ui';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Text, View } from 'react-native';
import { TERMINAL_FONT } from '@/components/digital-art';
import { TerminalPanel } from '@/components/terminal-panel';
import { useReminders } from '@/hooks/use-reminders';
import { reminderTime } from '@/reminders/reminder-controller';
import { reminders } from '@/reminders/reminders';

export function ReminderSettings() {
  const state = useReminders();
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
  const status = !supported ? Platform.OS === 'web' ? 'Disponible dans l’app iOS ou Android.'
    : 'Module de notifications absent. Recompile l’app pour activer les rappels.'
    : !state.pet?.alive ? 'Les rappels reprendront après une adoption si tu les as activés.'
    : !state.settings.enabled ? 'Désactivé. L’autorisation sera demandée à l’activation.'
    : state.permission !== 'granted' ? 'Rappel suspendu : notifications non autorisées sur ce téléphone.'
    : `Un rappel chaque jour à ${reminderTime(state.settings)}, à l’heure du téléphone.`;
  return <TerminalPanel style={{ gap: 10, padding: 14 }}>
    <Text accessibilityRole="header" style={{ color: '#d4fbb5', fontFamily: TERMINAL_FONT,
      fontSize: 16, fontWeight: '700' }}>{'>_ '}Rappels</Text>
    {state.loading ? <ActivityIndicator color="#a9d875" /> : <>
      <Host matchContents colorScheme="dark" seedColor="#a9d875">
        <Switch label="Rappel quotidien" value={state.settings.enabled}
          disabled={disabled || (!state.pet?.alive && !state.settings.enabled)}
          onValueChange={enabled => { void reminders.save({ ...state.settings, enabled }); }} />
      </Host>
      <Text accessibilityLiveRegion="polite" style={{ color: '#c3d7dc', fontFamily: TERMINAL_FONT,
        fontSize: 13, lineHeight: 20 }}>{status}</Text>
      <View style={{ alignItems: 'flex-start', gap: 8 }}>
        <Host matchContents colorScheme="dark" seedColor="#a9d875">
          <Button label={`Horaire : ${reminderTime(state.settings)}`} variant="outlined" disabled={disabled}
            onPress={() => { setDraftTime(date); setChoosingTime(true); }} />
        </Host>
        {choosingTime && <DateTimePicker mode="time" value={draftTime} is24Hour locale="fr_FR"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'} style={{ width: '100%' }}
          themeVariant="dark" accentColor="#a9d875" disabled={state.busy}
          onDismiss={() => setChoosingTime(false)}
          onValueChange={(_event, value) => {
            setDraftTime(value);
            if (Platform.OS === 'android') { setChoosingTime(false); void saveTime(value); }
          }} />}
        {choosingTime && Platform.OS === 'ios' && <>
          <Host matchContents colorScheme="dark" seedColor="#a9d875">
            <Button label="Enregistrer l’horaire" disabled={disabled} onPress={() => { void saveTime(draftTime); }} />
          </Host>
          <Host matchContents colorScheme="dark" seedColor="#a9d875">
            <Button label="Annuler" variant="outlined" disabled={state.busy} onPress={() => setChoosingTime(false)} />
          </Host>
        </>}
        <Host matchContents colorScheme="dark" seedColor="#a9d875">
          <Button label="Tester le rappel" variant="outlined"
            disabled={disabled || !state.settings.enabled || state.permission !== 'granted' || !state.pet?.alive}
            onPress={() => { void reminders.test(); }} />
        </Host>
        {supported && state.permission === 'denied' && <Host matchContents colorScheme="dark" seedColor="#a9d875">
          <Button label="Réglages du téléphone" variant="outlined" onPress={() => { void Linking.openSettings(); }} />
        </Host>}
      </View>
    </>}
    {state.message && <Text accessibilityLiveRegion="polite" style={{ color: '#a9d875', fontFamily: TERMINAL_FONT,
      fontSize: 12, lineHeight: 18 }}>{state.message}</Text>}
    {state.error && <>
      <Text accessibilityRole="alert" style={{ color: '#ffb09c', fontFamily: TERMINAL_FONT,
        fontSize: 12, lineHeight: 18 }}>{state.error}</Text>
      <Host matchContents colorScheme="dark" seedColor="#a9d875">
        <Button label="Réessayer" variant="outlined" disabled={state.busy} onPress={() => { void reminders.refresh(); }} />
      </Host>
    </>}
    <Text style={{ color: '#91abb7', fontFamily: TERMINAL_FONT, fontSize: 12, lineHeight: 18 }}>
      Facultatif, sans serveur ni connexion. Un appui sur la notification ouvre la partie.
    </Text>
  </TerminalPanel>;
}
