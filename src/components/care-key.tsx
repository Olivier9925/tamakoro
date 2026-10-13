import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

export function CareKey({ label, symbol, color, disabled, onPress, wide = false, selected, icon }: {
  label: string; symbol: string; color: string; disabled: boolean; onPress: () => void; wide?: boolean; selected?: boolean; icon?: ReactNode;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress}
    pressRetentionOffset={12} style={{ flex: wide ? undefined : 1, minWidth: 48, minHeight: 66, opacity: disabled ? 0.4 : 1,
      borderRadius: 12, backgroundColor: '#050a11', padding: 3, paddingBottom: 7,
      boxShadow: '0 3px 0 #020508, 0 5px 8px #00000055' }}>
    {({ pressed }) => <View style={{ flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: wide ? 10 : 3, flexDirection: wide ? 'row' : 'column', paddingHorizontal: wide || icon ? 8 : 0, paddingVertical: icon ? 8 : wide ? 4 : 0,
      transform: [{ translateY: pressed ? 4 : 0 }], backgroundColor: `${color}${selected ? '38' : '22'}`, borderRadius: 9,
      borderWidth: 1, borderTopWidth: 2, borderBottomWidth: 3,
      borderTopColor: `${color}bb`, borderLeftColor: `${color}66`, borderRightColor: `${color}44`,
      borderBottomColor: `${color}55`, boxShadow: `inset 0 1px 2px ${color}33, inset 0 -4px 6px #00000055` }}>
      {icon ?? <Text accessible={false} style={{ color, fontSize: 22, lineHeight: 25, fontWeight: '800' }}>{symbol}</Text>}
      <Text style={{ color: '#eaf6f0', fontSize: wide ? 13 : 10, fontWeight: '700', textAlign: 'center', flexShrink: 1 }}>{label}</Text>
    </View>}
  </Pressable>;
}
