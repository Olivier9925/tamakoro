import { Button, Host } from '@expo/ui';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPEARANCES } from '@/components/pixel-pet';
import { IncubatorScene } from '@/components/incubator-scene';
import { CareKey } from '@/components/care-key';
import { NeedGauges } from '@/components/need-gauges';
import { TERMINAL_FONT } from '@/components/digital-art';
import { DigitalBackground } from '@/components/digital-background';
import { TerminalPanel } from '@/components/terminal-panel';
import { isPetDead, NEEDS, needSeverity, petGrowth, petHealthAlert, petMood, type Action, type Appearance } from '@/game/pet';
import { usePet } from '@/hooks/use-pet';
import { useI18n } from '@/i18n/provider';
import { appearanceLabel, stageLabel, type TranslationKey } from '@/i18n/messages';

const colors = { panel: '#19343f', text: '#eaf6f0', muted: '#a3bcc0', accent: '#a9d875' };
function formatAge(totalHours: number, t: ReturnType<typeof useI18n>['t']) {
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days === 0) return t('home.ageHoursOnly', { hours });
  if (hours === 0) return t('home.ageDaysOnly', { days });
  return t('home.age', { days, hours });
}
function formatWakeTime(energy: number, t: ReturnType<typeof useI18n>['t']) {
  const minutes = Math.ceil(Math.max(0, 100 - energy) / 18 * 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} ${t('time.minuteShort')}`;
  if (remainingMinutes === 0) return `${hours} ${t('time.hourShort')}`;
  return `${hours} ${t('time.hourShort')} ${remainingMinutes.toString().padStart(2, '0')} ${t('time.minuteShort')}`;
}
const actions: { action: Action; label: TranslationKey; symbol: string; color: string }[] = [
  { action: 'feed', label: 'action.feed', symbol: '🍎', color: '#ffac69' },
  { action: 'hydrate', label: 'action.hydrate', symbol: '💧', color: '#59efff' },
  { action: 'play', label: 'action.play', symbol: '✦', color: '#a0ff77' },
  { action: 'clean', label: 'action.clean', symbol: '🫧', color: '#81bcff' },
];
function Control({ label, onPress, disabled = false, selected = false }: {
  label: string; onPress: () => void; disabled?: boolean; selected?: boolean;
}) {
  return <Host matchContents colorScheme="dark" seedColor={colors.accent}>
    <Button label={label} onPress={onPress} disabled={disabled} variant={selected ? 'filled' : 'outlined'} />
  </Host>;
}
export default function HomeScreen() {
  const game = usePet();
  const { t, language } = useI18n();
  const [lastAction, setLastAction] = useState<{ action: 'feed' | 'hydrate' | 'play' | 'clean'; at: number } | null>(null);
  useEffect(() => {
    if (!lastAction) return;
    const timer = setTimeout(() => setLastAction(null), 2_200);
    return () => clearTimeout(timer);
  }, [lastAction]);
  const [name, setName] = useState('Momo');
  const [appearance, setAppearance] = useState<Appearance>('leaf');
  const [preparingAdoption, setPreparingAdoption] = useState(false);
  const insets = useSafeAreaInsets();
  const pet = game.pet;
  const growth = pet ? petGrowth(pet, pet.updatedAt) : null;
  const dead = pet ? isPetDead(pet) : false;
  const healthAlert = pet ? petHealthAlert(pet) : null;
  const statusColor = dead ? colors.muted : pet && NEEDS.some(key => needSeverity(key, pet.needs[key]) === 'critical')
    ? '#ff726f' : pet && NEEDS.some(key => needSeverity(key, pet.needs[key]) === 'warning') ? '#ffc66e' : pet?.sleeping ? '#81c8fa' : colors.accent;
  const { height } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const sceneHeight = Math.max(180, Math.min(350, (viewportHeight || height - 100) - 400 - insets.bottom));
  return <View style={{ flex: 1, backgroundColor: '#090f18' }}>
    <DigitalBackground />
    <ScrollView onLayout={event => setViewportHeight(event.nativeEvent.layout.height)} contentInsetAdjustmentBehavior="automatic"
    automaticallyAdjustKeyboardInsets keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled"
    bounces={false} alwaysBounceVertical={false} overScrollMode="never"
    contentContainerStyle={{ flexGrow: 1, padding: pet ? 14 : 20, paddingBottom: Math.max(insets.bottom, 12),
      gap: pet ? 10 : 16, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
    {game.loading ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color={colors.accent} /><Text style={{ color: colors.text }}>{t('home.loading')}</Text>
    </View> : !pet || preparingAdoption ? <>
      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>{t('home.eyebrow')}</Text>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>{t('home.adoptTitle')}</Text>
      <Text style={{ color: colors.muted, fontSize: 17, lineHeight: 25 }}>
        {t('home.adoptDescription')}
      </Text>
      <IncubatorScene appearance={appearance} />
      {pet && <TerminalPanel><Text style={{ color: '#ffcf8a', fontFamily: TERMINAL_FONT, fontSize: 12, lineHeight: 18 }}>{t('home.replaceWarning', { name: pet.name })}</Text></TerminalPanel>}
      {game.error && <Text accessibilityRole="alert" selectable style={{ color: '#ffb2a5' }}>{game.error}</Text>}
      {game.loadFailed ? <Control label={t('home.recoverSave')} onPress={() => { void game.load(); }} /> : <>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{t('home.namePrompt')}</Text>
        <TextInput value={name} onChangeText={setName} maxLength={20} editable={!game.busy}
          accessibilityLabel={t('home.nameLabel')} placeholder={t('home.namePlaceholder')} placeholderTextColor={colors.muted}
          returnKeyType="done" style={{ color: colors.text, backgroundColor: colors.panel, borderRadius: 14,
            padding: 16, fontSize: 18, fontFamily: TERMINAL_FONT, borderWidth: 1, borderColor: '#365663' }} />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>{t('home.colorPrompt')}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {(Object.keys(APPEARANCES) as Appearance[]).map(value => <Control key={value}
            label={`${appearance === value ? '✓ ' : ''}${appearanceLabel(value, language)}`} selected={appearance === value}
            disabled={game.busy} onPress={() => setAppearance(value)} />)}
        </View>
        <Control label={game.busy ? t('home.adopting') : pet ? t('home.confirmAdoption') : t('home.adopt')} selected
          disabled={game.busy || !name.trim()} onPress={() => { void game.adopt(name, appearance).then(adopted => { if (adopted) setPreparingAdoption(false); }); }} />
        {pet && <Control label={t('home.cancel')} disabled={game.busy} onPress={() => setPreparingAdoption(false)} />}
      </>}
    </> : <>
      <TerminalPanel style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ gap: 4, flex: 1, minWidth: 120 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text accessible={false} style={{ color: '#97ed72', fontFamily: TERMINAL_FONT, fontSize: 18 }}>&gt;_</Text>
            <Text selectable style={{ flexShrink: 1, color: '#d7ffe4', fontFamily: TERMINAL_FONT,
              fontSize: 22, fontWeight: '700', letterSpacing: 1 }}>{pet.name}</Text>
          </View>
          <Text style={{ color: colors.muted, fontFamily: TERMINAL_FONT, fontSize: 10 }}>{stageLabel(growth?.stageIndex ?? 0, language)} · {formatAge(growth?.ageHours ?? 0, t)} · {appearanceLabel(pet.appearance, language)}</Text>
          {dead ? <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 9 }}>{t('home.remembrance')}</Text>
            : pet.sleeping ? <Text accessibilityLiveRegion="polite" style={{ color: '#9bd8ff', fontFamily: TERMINAL_FONT, fontSize: 9 }}>
              {t('home.wakeCountdown', { time: formatWakeTime(pet.needs.energy, t) })}
            </Text> : <View style={{ gap: 4 }}>
              <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 9 }}>
                {growth?.nextStage ? t('home.nextGrowth', { stage: stageLabel((growth?.stageIndex ?? 0) + 1, language), days: growth.daysUntilNext ?? 0,
                  unit: growth.daysUntilNext === 1 ? t('time.day') : t('time.days') }) : t('home.adult')}
              </Text>
              <View accessibilityLabel={t('home.progress', { percent: Math.round((growth?.progress ?? 1) * 100) })}
                accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round((growth?.progress ?? 1) * 100) }}
                style={{ height: 4, overflow: 'hidden', backgroundColor: '#29434a', borderRadius: 2 }}>
                <View style={{ width: `${Math.round((growth?.progress ?? 1) * 100)}%`, height: '100%', backgroundColor: colors.accent, borderRadius: 2 }} />
              </View>
            </View>}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8,
          backgroundColor: '#09151b', borderRadius: 6, borderWidth: 1, borderColor: '#2d474b' }}>
          <View accessible={false} style={{ width: 5, height: 5, borderRadius: 1,
            backgroundColor: statusColor }} />
          <Text style={{ color: statusColor, fontFamily: TERMINAL_FONT,
            fontSize: 11 }}>{petMood(pet)}</Text>
        </View>
      </TerminalPanel>
      <IncubatorScene appearance={pet.appearance} stageIndex={growth?.stageIndex} sleeping={pet.sleeping || dead} dead={dead} height={sceneHeight}
        action={lastAction ? `${lastAction.action}-${lastAction.at}` : null} />
      <NeedGauges pet={pet} />
      {dead ? <Control label={t('home.adoptNew')} disabled={game.busy} onPress={() => { setName(''); setPreparingAdoption(true); }} /> : <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {actions.map(({ action, label, symbol, color }) => <CareKey key={action} label={t(label)} symbol={symbol} color={color}
          disabled={game.busy || pet.sleeping} onPress={() => { if (action !== 'sleep') setLastAction({ action, at: Date.now() }); void game.care(action); }} />)}
        <CareKey label={pet.sleeping ? t('action.wake') : t('action.sleep')} symbol={pet.sleeping ? '☀' : '☾'} color="#c6a0ff"
          disabled={game.busy} onPress={() => { void game.care('sleep'); }} />
      </View>}
      <TerminalPanel style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <Text accessible={false} style={{ color: '#97ed72', fontFamily: TERMINAL_FONT, fontSize: 12, lineHeight: 16 }}>&gt;_</Text>
          <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: '#d7ffe4', fontFamily: TERMINAL_FONT, fontSize: 11, lineHeight: 16 }}>
            {dead ? healthAlert : game.message.replace(' Les jauges restent entre 0 et 100.', '')}
          </Text>
        </View>
        {!dead && healthAlert && <Text accessibilityRole="alert" style={{ color: '#ffb2a5', fontFamily: TERMINAL_FONT, fontSize: 11, lineHeight: 16 }}>{healthAlert}</Text>}
        {dead && pet && <Text style={{ color: colors.muted, fontFamily: TERMINAL_FONT, fontSize: 10, lineHeight: 14 }}>{t('home.deadAt', { date: new Date(pet.updatedAt).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) })}</Text>}
        <View accessible={false} style={{ height: 1, backgroundColor: '#2c404b' }} />
        {game.saveFailed ? <View style={{ gap: 10 }}>
          <Text accessibilityRole="alert" selectable style={{ color: '#ffb2a5', fontFamily: TERMINAL_FONT, fontSize: 11, lineHeight: 16 }}>{t('home.saveFailure')}</Text>
          <Control label={t('home.retrySave')} disabled={game.busy} onPress={() => { void game.retrySave(); }} />
        </View> : <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <View accessible={false} style={{ width: 5, height: 5, marginTop: 4, borderRadius: 1,
            backgroundColor: game.busy ? '#ffb637' : '#97ed72' }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: colors.muted, fontFamily: TERMINAL_FONT, fontSize: 10, lineHeight: 14 }}>{t('home.localGame')}</Text>
            <Text accessibilityLiveRegion="polite" style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 10, lineHeight: 14 }}>{game.busy ? t('home.saving') : t('home.autosaved')}</Text>
          </View>
        </View>}
      </TerminalPanel>

    </>}
  </ScrollView></View>;
}
