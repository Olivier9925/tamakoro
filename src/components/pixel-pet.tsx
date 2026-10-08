import { View } from 'react-native';
import type { Appearance } from '@/game/pet';

const sprite = [
  '........gg......',
  '.......gGg......',
  '........g.......',
  '.....oooooo.....',
  '...ooCCCCCCoo...',
  '..oCCCCCCCCCCo..',
  '.gGCCoCCCCoCCGg.',
  'gGGCCooCCooCCGGg',
  'gGGCCwwCCwwCCGGg',
  '.gGCCCCCCCCCCGg.',
  '..oCpCCmmCCpCo..',
  '..oCCCCmmCCCCo..',
  '...oCCCCCCCCo...',
  '....ooCCCCoo....',
  '.....oCooCo.....',
  '......o..o......',
];
export const APPEARANCES = {
  leaf: { label: 'Feuille', color: '#a9d875', dark: '#537b49' },
  ember: { label: 'Braise', color: '#ffac77', dark: '#a55b47' },
  water: { label: 'Ondine', color: '#8fdce5', dark: '#417f9a' },
};
export function PixelPet({ appearance, sleeping = false, small = false }: {
  appearance: Appearance; sleeping?: boolean; small?: boolean;
}) {
  const palette: Record<string, string> = { g: APPEARANCES[appearance].dark,
    G: APPEARANCES[appearance].color, o: '#283a43', C: '#fff0c7',
    w: sleeping ? '#fff0c7' : '#ffffff', p: '#ffa1a0', m: '#c76777' };
  const size = small ? 4 : 12;
  return <View accessible accessibilityLabel={`Tamakoro ${APPEARANCES[appearance].label}${sleeping ? ' endormi' : ''}`}>
    {sprite.map((row, y) => <View key={y} style={{ flexDirection: 'row' }}>
      {[...row].map((pixel, x) => <View key={x} style={{ width: size, height: size,
        backgroundColor: palette[pixel] ?? 'transparent' }} />)}
    </View>)}
  </View>;
}
