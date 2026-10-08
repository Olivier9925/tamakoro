import type { PropsWithChildren } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export function TerminalPanel({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <View style={[{ padding: 10, backgroundColor: '#101c26', borderRadius: 12,
    borderWidth: 1, borderColor: '#354650', borderTopColor: '#5a6974',
    boxShadow: 'inset 0 1px 0 #82939d22, 0 3px 0 #03080d' }, style]}>{children}</View>;
}
