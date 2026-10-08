import { Image } from 'expo-image';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TERMINAL_FONT, WORDMARK_SOURCE } from '@/components/digital-art';

function Screw() {
  return <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: '#56636e',
    borderWidth: 1, borderColor: '#101821', alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 3, height: 1, backgroundColor: '#a7b3b9' }} />
  </View>;
}

export function AppHeader() {
  const insets = useSafeAreaInsets();
  return <View style={{ paddingTop: insets.top, backgroundColor: '#0b131c',
    borderBottomWidth: 1, borderBottomColor: '#263b46' }}>
    <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 14,
      paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, borderRadius: 10, borderWidth: 1, borderColor: '#43505b', paddingHorizontal: 10,
        paddingVertical: 7, backgroundColor: '#101d27', boxShadow: 'inset 0 1px 0 #65748055, 0 3px 0 #03080d' }}>
        <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ gap: 22 }}><Screw /><Screw /></View>
        <View accessible accessibilityRole="header" accessibilityLabel="Tamakoro, compagnon virtuel"
          style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Image source={WORDMARK_SOURCE} accessible={false} contentFit="contain"
            style={{ width: 188, maxWidth: '100%', height: 30 }} />
          <Text accessible={false} style={{ color: '#91abb7', fontFamily: TERMINAL_FONT,
            fontSize: 8, letterSpacing: 2 }}>COMPAGNON VIRTUEL</Text>
        </View>
        <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ gap: 10, alignItems: 'center' }}>
          <Screw />
          <View style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: '#9ded72', boxShadow: '0 0 5px #9ded7299' }} />
          <Screw />
        </View>
      </View>
    </View>
  </View>;
}
