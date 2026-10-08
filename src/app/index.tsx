import { Button, Host } from '@expo/ui';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APPEARANCES, PixelPet } from '@/components/pixel-pet';
import { HOUR, NEEDS, petMood, type Action, type Appearance, type Need } from '@/game/pet';
import { usePet } from '@/hooks/use-pet';

const colors = { panel: '#19343f', text: '#eaf6f0', muted: '#a3bcc0', accent: '#a9d875' };
const indicators: Record<Need, { label: string; color: string }> = {
  food: { label: 'Satiété', color: '#ffa986' }, energy: { label: 'Énergie', color: '#ffdb83' },
  hygiene: { label: 'Hygiène', color: '#8fdce5' }, mood: { label: 'Humeur', color: '#a9d875' },
  health: { label: 'Santé', color: '#d6b2ec' },
};
const actions: { action: Action; label: string }[] = [
  { action: 'feed', label: 'Nourrir' }, { action: 'hydrate', label: 'Hydrater' },
  { action: 'play', label: 'Jouer' }, { action: 'clean', label: 'Nettoyer' },
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
  return <ScrollView contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled"
    contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: Math.max(insets.bottom, 20) + 20,
      gap: 22, width: '100%', maxWidth: 560, alignSelf: 'center' }}>
    {game.loading ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <ActivityIndicator color={colors.accent} /><Text style={{ color: colors.text }}>Ouverture de ton petit monde…</Text>
    </View> : !pet ? <>
      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 2 }}>UN MONDE DANS TON TÉLÉPHONE</Text>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>Ton petit compagnon t’attend.</Text>
      <Text style={{ color: colors.muted, fontSize: 17, lineHeight: 25 }}>
        Adopte un Tamakoro, prends soin de lui et retrouve-le chaque jour. Tout se passe ici, même hors ligne.
      </Text>
      <View style={{ alignItems: 'center', padding: 24, backgroundColor: colors.panel, borderRadius: 24 }}>
        <PixelPet appearance={appearance} />
      </View>
      {game.error && <Text accessibilityRole="alert" selectable style={{ color: '#ffb2a5' }}>{game.error}</Text>}
      {game.loadFailed ? <Control label="Relire la sauvegarde" onPress={() => { void game.load(); }} /> : <>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>Comment s’appelle-t-il ?</Text>
        <TextInput value={name} onChangeText={setName} maxLength={20} editable={!game.busy}
          accessibilityLabel="Nom du Tamakoro" placeholder="Son petit nom" placeholderTextColor={colors.muted}
          returnKeyType="done" style={{ color: colors.text, backgroundColor: colors.panel, borderRadius: 14,
            padding: 16, fontSize: 18, borderWidth: 1, borderColor: '#365663' }} />
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: '700' }}>{pet.name}</Text>
          <Text style={{ color: colors.muted }}>Jour {Math.max(1, Math.floor((pet.updatedAt - pet.createdAt) / (24 * HOUR)) + 1)} · {APPEARANCES[pet.appearance].label}</Text>
        </View>
        <Text style={{ color: colors.accent, padding: 10, backgroundColor: colors.panel, borderRadius: 12 }}>{petMood(pet)}</Text>
      </View>
      <View style={{ height: 280, backgroundColor: '#142f39', borderRadius: 24, borderWidth: 1,
        borderColor: '#315360', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', gap: 10 }}>
        <View pointerEvents="none" style={{ position: 'absolute', left: 14, top: 18, gap: 12 }}>
          {[0, 1, 2, 3].map(index => <View key={index} style={{ width: 38, height: 26, borderWidth: 2, borderColor: '#2b4b56', backgroundColor: '#10252e' }} />)}
        </View>
        <View pointerEvents="none" style={{ position: 'absolute', right: 14, top: 18, width: 26, height: 100,
          borderWidth: 2, borderColor: '#2b4b56', backgroundColor: '#10252e' }} />
        <Text style={{ color: '#789b9e', fontSize: 10, letterSpacing: 3 }}>CŒUR D’INCUBATION</Text>
        <PixelPet appearance={pet.appearance} sleeping={pet.sleeping} />
        <View style={{ width: 160, height: 8, backgroundColor: '#315360', borderRadius: 4 }} />
      </View>
      <View style={{ gap: 14, padding: 18, borderRadius: 20, backgroundColor: colors.panel }}>
        {NEEDS.map(key => <View key={key} style={{ gap: 6 }} accessible
          accessibilityLabel={`${indicators[key].label} : ${Math.round(pet.needs[key])} sur 100${pet.needs[key] < 25 ? ', faible' : ''}`}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{indicators[key].label}{pet.needs[key] < 25 ? ' · Faible' : ''}</Text>
            <Text style={{ color: indicators[key].color, fontVariant: ['tabular-nums'] }}>{Math.round(pet.needs[key])}/100</Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#0e2530', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: `${pet.needs[key]}%`, backgroundColor: indicators[key].color }} />
          </View>
        </View>)}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {actions.map(({ action, label }) => <Control key={action} label={label} disabled={game.busy || pet.sleeping}
          onPress={() => { void game.care(action); }} />)}
        <Control label={pet.sleeping ? 'Réveiller' : 'Dormir'} selected disabled={game.busy}
          onPress={() => { void game.care('sleep'); }} />
      </View>
      <Text accessibilityLiveRegion="polite" style={{ color: colors.text, lineHeight: 22, textAlign: 'center' }}>{game.message}</Text>
      {game.saveFailed ? <View style={{ gap: 10 }}>
        <Text accessibilityRole="alert" selectable style={{ color: '#ffb2a5' }}>Sauvegarde impossible. Tes soins restent en mémoire : réessaie avant de fermer l’application.</Text>
        <Control label="Réessayer la sauvegarde" disabled={game.busy} onPress={() => { void game.retrySave(); }} />
      </View> : <Text style={{ color: colors.muted, fontSize: 12, textAlign: 'center' }}>{game.busy ? 'Sauvegarde…' : 'Partie locale · Soins sauvegardés automatiquement'}</Text>}
      <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 20 }}>
        Une jauge haute signifie que tout va bien. Les besoins diminuent doucement pendant ton absence.
        Ton compagnon peut avoir besoin de soins, mais tu ne le perdras jamais.
      </Text>
    </>}
  </ScrollView>;
}
