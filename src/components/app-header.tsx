import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TERMINAL_FONT, WORDMARK_SOURCE } from '@/components/digital-art';
import { svgSource } from '@/utils/svg-source';

const GEAR_SOURCE = svgSource(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <g fill="#d4fbb5">${Array.from({ length: 8 }, (_, i) =>
    `<rect x="10" y="1" width="4" height="6" rx="1" transform="rotate(${i * 45} 12 12)"/>`).join('')}
    <path fill-rule="evenodd" d="M12 4a8 8 0 1 1 0 16a8 8 0 1 1 0-16M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6"/>
  </g></svg>`);

function headerKey(label: string, symbol: 'gear' | '?' | '×', onPress?: () => void) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={{ width: 44, minHeight: 44 }}>
    {({ pressed }) => <View style={{ width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
      borderRadius: 8, borderWidth: 1, borderTopWidth: 2, borderBottomWidth: 3,
      borderColor: '#597a68', borderTopColor: '#a9d875', backgroundColor: pressed ? '#2a4437' : '#192d28',
      transform: [{ translateY: pressed ? 2 : 0 }], boxShadow: '0 2px 0 #03080d' }}>
    {symbol === 'gear' ? <Image source={GEAR_SOURCE} accessible={false} style={{ width: 24, height: 24 }} />
      : <Text accessible={false} style={{ color: '#d4fbb5', fontFamily: TERMINAL_FONT,
        fontSize: 24, fontWeight: '700' }}>{symbol}</Text>}
    </View>}
  </Pressable>;
}

function Screw() {
  return <View style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: '#56636e',
    borderWidth: 1, borderColor: '#101821', alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: 3, height: 1, backgroundColor: '#a7b3b9' }} />
  </View>;
}

export function AppHeader({ panel }: { panel?: 'help' | 'settings' | 'memorial' }) {
  const insets = useSafeAreaInsets();
  return <View style={{ paddingTop: insets.top, backgroundColor: '#0b131c',
    borderBottomWidth: 1, borderBottomColor: '#263b46' }}>
    <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 14,
      paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, borderRadius: 10, borderWidth: 1, borderColor: '#43505b', paddingHorizontal: 8,
        paddingVertical: 7, backgroundColor: '#101d27', boxShadow: 'inset 0 1px 0 #65748055, 0 3px 0 #03080d' }}>
        {panel ? <View accessible={false} importantForAccessibility="no-hide-descendants"
          style={{ width: 44, alignItems: 'center', gap: 22 }}><Screw /><Screw /></View>
          : <Link href="/settings" asChild>{headerKey('Ouvrir les paramètres', 'gear')}</Link>}
        <View accessible accessibilityRole="header" accessibilityLabel="Tamakoro, compagnon virtuel"
          style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <Image source={WORDMARK_SOURCE} accessible={false} contentFit="contain"
            style={{ width: 188, maxWidth: '100%', height: 30 }} />
          <Text accessible={false} style={{ color: '#91abb7', fontFamily: TERMINAL_FONT,
            fontSize: 8, letterSpacing: 2 }}>COMPAGNON VIRTUEL</Text>
        </View>
        {panel ? headerKey(panel === 'help' ? 'Fermer l’aide' : panel === 'settings' ? 'Fermer les paramètres' : 'Fermer le mémorial', '×',
          () => { if (router.canGoBack()) router.back(); else router.replace('/'); })
          : <Link href="/help" asChild>{headerKey('Ouvrir l’aide', '?')}</Link>}
      </View>
    </View>
  </View>;
}
