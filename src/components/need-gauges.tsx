import { Text, useWindowDimensions, View } from 'react-native';
import { NEEDS, needSeverity, type Need, type Pet } from '@/game/pet';
import { useI18n } from '@/i18n/provider';

const indicators: Record<Need, { color: string }> = {
  food: { color: '#ff9866' }, energy: { color: '#efff52' },
  hygiene: { color: '#47f5ff' }, mood: { color: '#89ff63' },
  health: { color: '#ef89ff' },
};
export function NeedGauges({ pet, deltas = {} }: { pet: Pet; deltas?: Partial<Record<Need, number>> }) {
  const { fontScale } = useWindowDimensions();
  const { t } = useI18n();
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10, borderRadius: 14,
    backgroundColor: '#0b1b26', borderWidth: 1, borderColor: '#2f626c', boxShadow: '0 0 10px #47f5ff15' }}>
    {NEEDS.map(key => {
      const label = t(`need.${key}`);
      const { color: normalColor } = indicators[key];
      const value = pet.needs[key];
      const severity = needSeverity(key, value);
      const color = severity === 'critical' ? '#ff726f' : severity === 'warning' ? '#ffc66e' : normalColor;
      const displayed = key === 'health' && value > 0 ? Math.max(1, Math.round(value)) : Math.round(value);
      const status = severity === 'critical' ? `, ${t('need.critical')}` : severity === 'warning' ? `, ${t('need.low')}` : '';
      const delta = deltas[key];
      const deltaText = delta === undefined ? null : `${delta > 0 ? '+' : '−'}${Math.abs(Math.round(delta))}`;
      const deltaColor = delta && delta > 0 ? '#a9f27b' : '#ffbd75';
      return <View key={key} accessible accessibilityLabel={t('need.accessibility', { label, value: displayed, status })}
        style={{ flex: fontScale > 1.3 ? undefined : 1, minWidth: 0, width: fontScale > 1.3 ? '46%' : undefined, gap: 6 }}>
        <View style={{ minHeight: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Text style={{ color: '#c5d8de', fontSize: 10, fontWeight: '600', textAlign: 'center' }}>{label}</Text>
          {deltaText && <Text accessibilityLabel={t('need.change', { delta: deltaText })}
            style={{ color: deltaColor, fontSize: 9, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 4,
              paddingVertical: 1, borderRadius: 5, backgroundColor: `${deltaColor}1c`, borderWidth: 1, borderColor: `${deltaColor}66` }}>{deltaText}</Text>}
        </View>
        <Text style={{ color, fontSize: 15, fontWeight: '800', textAlign: 'center', fontVariant: ['tabular-nums'] }}>{displayed}{severity !== 'normal' ? ' !' : ''}</Text>
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
