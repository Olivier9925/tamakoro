import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { INCUBATOR_SOURCES } from '@/components/incubator-art';
import { IncubatorEffects } from '@/components/incubator-effects';
import { PixelPet } from '@/components/pixel-pet';
import type { Appearance } from '@/game/pet';

export function IncubatorScene({ appearance, sleeping = false, height }: { appearance: Appearance; sleeping?: boolean; height?: number }) {
  const [width, setWidth] = useState(320);
  return <View onLayout={event => setWidth(event.nativeEvent.layout.width)}
    style={{ width: '100%', height, aspectRatio: height ? undefined : 360 / 400, overflow: 'hidden', borderRadius: 20, backgroundColor: '#0c1822' }}>
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', inset: 0 }}>
      <Image source={sleeping ? INCUBATOR_SOURCES.asleep : INCUBATOR_SOURCES.awake}
        contentFit="fill" accessible={false} style={{ width: '100%', height: '100%' }} />
    </View>
    <IncubatorEffects sleeping={sleeping} />
    <View style={{ position: 'absolute', top: '18.5%', height: '6.25%', left: '25%', right: '25%',
      alignItems: 'center', justifyContent: 'center' }}>
      <Text numberOfLines={1} maxFontSizeMultiplier={1.2}
        style={{ color: '#d8e3e9', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }}>CŒUR D’INCUBATION</Text>
    </View>
    <View style={{ position: 'absolute', top: '36%', bottom: '21%', left: '20%', right: '20%',
      justifyContent: 'flex-end', alignItems: 'center' }}>
      <PixelPet appearance={appearance} sleeping={sleeping}
        pixelSize={Math.max(1, Math.floor(Math.min(width / 32, (height ?? width * 400 / 360) * 0.43 / 17)))} />
    </View>
  </View>;
}
