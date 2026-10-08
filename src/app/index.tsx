import { Button, Host } from '@expo/ui';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPEARANCES } from '@/components/pixel-pet';
import { IncubatorScene } from '@/components/incubator-scene';
import { CareKey } from '@/components/care-key';
import { NeedGauges } from '@/components/need-gauges';
import { TERMINAL_FONT } from '@/components/digital-art';
import { DigitalBackground } from '@/components/digital-background';
import { petGrowth, petMood, type Action, type Appearance } from '@/game/pet';
import { usePet } from '@/hooks/use-pet';

const colors = { panel: '#19343f', text: '#eaf6f0', muted: '#a3bcc0', accent: '#a9d875' };
const actions: { action: Action; label: string; symbol: string; color: string }[] = [
  { action: 'feed', label: 'Nourrir', symbol: '🍎', color: '#ffac69' },
  { action: 'hydrate', label: 'Hydrater', symbol: '💧', color: '#59efff' },
  { action: 'play', label: 'Jouer', symbol: '✦', color: '#a0ff77' },
  { action: 'clean', label: 'Nettoyer', symbol: '🫧', color: '#81bcff' },
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
  const [name, setName] = useState('Momo');
  const [appearance, setAppearance] = useState<Appearance>('leaf');
  const insets = useSafeAreaInsets();
  const pet = game.pet;
  const growth = pet ? petGrowth(pet, pet.updatedAt) : null;
  const { height } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState(0);
  const sceneHeight = Math.max(180, Math.min(350, (viewportHeight || height - 100) - 355 - insets.bottom));
  return <View style={{ flex: 1, backgroundColor: '#090f18' }}>
    <DigitalBackground />
    <ScrollView onLayout={event => setViewportHeight(event.nativeEvent.layout.height)} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ flexGrow: 1, padding: pet ? 14 : 20, paddingBottom: Math.max(insets.bottom, 12),
      gap: pet ? 10 : 16, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
    {game.loading ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color={colors.accent} /><Text style={{ color: colors.text }}>Ouverture de ton petit monde…</Text>
    </View> : !pet ? <>
      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>UN MONDE DANS TON TÉLÉPHONE</Text>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>Ton petit compagnon t’attend.</Text>
      <Text style={{ color: colors.muted, fontSize: 17, lineHeight: 25 }}>
        Adopte un Tamakoro, prends soin de lui et retrouve-le chaque jour. Tout se passe ici, même hors ligne.
      </Text>
      <IncubatorScene appearance={appearance} />
      {game.error && <Text accessibilityRole="alert" selectable style={{ color: '#ffb2a5' }}>{game.error}</Text>}
      {game.loadFailed ? <Control label="Relire la sauvegarde" onPress={() => { void game.load(); }} /> : <>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Comment s’appelle-t-il ?</Text>
        <TextInput value={name} onChangeText={setName} maxLength={20} editable={!game.busy}
          accessibilityLabel="Nom du Tamakoro" placeholder="Son petit nom" placeholderTextColor={colors.muted}
          returnKeyType="done" style={{ color: colors.text, backgroundColor: colors.panel, borderRadius: 14,
            padding: 16, fontSize: 18, fontFamily: TERMINAL_FONT, borderWidth: 1, borderColor: '#365663' }} />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Choisis sa couleur</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {(Object.keys(APPEARANCES) as Appearance[]).map(value => <Control key={value}
            label={`${appearance === value ? '✓ ' : ''}${APPEARANCES[value].label}`} selected={appearance === value}
            disabled={game.busy} onPress={() => setAppearance(value)} />)}
        </View>
        <Control label={game.busy ? 'Adoption en cours…' : 'Adopter mon Tamakoro'} selected
          disabled={game.busy || !name.trim()} onPress={() => { void game.adopt(name, appearance); }} />
      </>}
    </> : <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        padding: 10, backgroundColor: '#101c26', borderRadius: 12, borderWidth: 1, borderColor: '#354650',
        borderTopColor: '#5a6974', boxShadow: 'inset 0 1px 0 #82939d22, 0 3px 0 #03080d' }}>
        <View style={{ gap: 4, flex: 1, minWidth: 120 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Text accessible={false} style={{ color: '#97ed72', fontFamily: TERMINAL_FONT, fontSize: 18 }}>&gt;_</Text>
            <Text selectable style={{ flexShrink: 1, color: '#d7ffe4', fontFamily: TERMINAL_FONT,
              fontSize: 22, fontWeight: '700', letterSpacing: 1 }}>{pet.name}</Text>
          </View>
          <Text style={{ color: colors.muted, fontFamily: TERMINAL_FONT, fontSize: 10 }}>{growth?.stage.label} · Jour {(growth?.ageDays ?? 0) + 1} · {APPEARANCES[pet.appearance].label}</Text>
          <Text style={{ color: '#87b8c3', fontFamily: TERMINAL_FONT, fontSize: 9 }}>
            {growth?.daysUntilNext === null ? 'Taille adulte atteinte' : `Prochaine évolution : ${growth?.daysUntilNext} j`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8,
          backgroundColor: '#09151b', borderRadius: 6, borderWidth: 1, borderColor: '#2d474b' }}>
          <View accessible={false} style={{ width: 5, height: 5, borderRadius: 1,
            backgroundColor: pet.sleeping ? '#81c8fa' : colors.accent }} />
          <Text style={{ color: pet.sleeping ? '#81c8fa' : colors.accent, fontFamily: TERMINAL_FONT,
            fontSize: 11 }}>{petMood(pet)}</Text>
        </View>
      </View>
      <IncubatorScene appearance={pet.appearance} stageIndex={growth?.stageIndex} sleeping={pet.sleeping} height={sceneHeight} />
      <NeedGauges pet={pet} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {actions.map(({ action, label, symbol, color }) => <CareKey key={action} label={label} symbol={symbol} color={color}
          disabled={game.busy || pet.sleeping} onPress={() => { void game.care(action); }} />)}
        <CareKey label={pet.sleeping ? 'Réveiller' : 'Dormir'} symbol={pet.sleeping ? '☀' : '☾'} color="#c6a0ff"
          disabled={game.busy} onPress={() => { void game.care('sleep'); }} />
      </View>
      <Text accessibilityLiveRegion="polite" style={{ color: colors.text, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>
        {game.message.replace(' Les jauges restent entre 0 et 100.', '')}
      </Text>
      {game.saveFailed ? <View style={{ gap: 10 }}>
        <Text accessibilityRole="alert" selectable style={{ color: '#ffb2a5' }}>Sauvegarde impossible. Tes soins restent en mémoire : réessaie avant de fermer l’application.</Text>
        <Control label="Réessayer la sauvegarde" disabled={game.busy} onPress={() => { void game.retrySave(); }} />
      </View> : <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>{game.busy ? 'Sauvegarde…' : 'Partie locale · Soins sauvegardés automatiquement'}</Text>}

    </>}
  </ScrollView></View>;
}
