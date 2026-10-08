import { Image } from 'expo-image';
import { View } from 'react-native';
import { DIGITAL_BACKGROUND_SOURCE } from '@/components/digital-art';

export function DigitalBackground() {
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', inset: 0, backgroundColor: '#090f18' }}>
    <Image source={DIGITAL_BACKGROUND_SOURCE} accessible={false} contentFit="cover"
      style={{ width: '100%', height: '100%' }} />
  </View>;
}
