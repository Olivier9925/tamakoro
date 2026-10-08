import { Text, useWindowDimensions, View } from 'react-native';
import { NEEDS, type Need, type Pet } from '@/game/pet';

const indicators: Record<Need, { label: string; color: string }> = {
  food: { label: 'Satiété', color: '#ff9866' }, energy: { label: 'Énergie', color: '#efff52' },
  hygiene: { label: 'Hygiène', color: '#47f5ff' }, mood: { label: 'Humeur', color: '#89ff63' },
  health: { label: 'Santé', color: '#ef89ff' },
};
export function NeedGauges({ pet }: { pet: Pet }) {
  const { fontScale } = useWindowDimensions();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, borderRadius: 14,
    backgroundColor: '#0b1b26', borderWidth: 1, borderColor: '#2f626c', boxShadow: '0 0 10px #47f5ff15' }}>
    {NEEDS.map(key => {
      const { label, color } = indicators[key];
      const value = pet.needs[key];
      return <View key={key} accessible accessibilityLabel={`${label} : ${Math.round(value)} sur 100${value < 25 ? ', faible' : ''}`}
        style={{ flex: fontScale > 1.3 ? undefined : 1, minWidth: 0, width: fontScale > 1.3 ? '46%' : undefined, gap: 6 }}>
        <Text style={{ color: '#c5d8de', fontSize: 10, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
        <Text style={{ color, fontSize: 15, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] }}>{Math.round(value)}{value < 25 ? ' !' : ''}</Text>
        <View style={{ height: 8, borderRadius: 3, backgroundColor: '#040c14', borderWidth: 1, borderColor: `${color}33` }}>
          <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value}%`, borderRadius: 2,
            backgroundColor: color, boxShadow: `0 0 6px ${color}cc, 0 0 12px ${color}66` }}>
            <View style={{ height: 2, backgroundColor: '#ffffffbb', borderRadius: 2 }} />
          </View>
        </View>
      </View>;
    })}
  </View>;
}
