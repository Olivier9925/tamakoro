import { Image } from 'expo-image';
import { View, type ViewStyle } from 'react-native';
import Animated, { steps, type CSSAnimationKeyframes } from 'react-native-reanimated';
import { HARDWARE_FRAME_COUNT, HARDWARE_SOURCES } from '@/components/incubator-effects-art';
import { useAnimationPolicy } from '@/hooks/use-animation-policy';

const frameAnimations = Array.from({ length: HARDWARE_FRAME_COUNT }, (_, frame) =>
  Object.fromEntries(Array.from({ length: HARDWARE_FRAME_COUNT + 1 }, (_, step) =>
    [`${step * 100 / HARDWARE_FRAME_COUNT}%`, { opacity: step % HARDWARE_FRAME_COUNT === frame ? 1 : 0 }]
  )) as CSSAnimationKeyframes<ViewStyle>);
const pixelSteps = steps(1, 'jump-end');

export function IncubatorEffects({ sleeping }: { sleeping: boolean }) {
  const { reducedMotion, active } = useAnimationPolicy();
  if (reducedMotion) return null;
  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden
    importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', inset: 0 }}>
    {HARDWARE_SOURCES[sleeping ? 'asleep' : 'awake'].map((source, frame) =>
      <Animated.View key={frame} style={{ position: 'absolute', inset: 0,
        opacity: frame === 0 ? 1 : 0, animationName: frameAnimations[frame],
        animationDuration: sleeping ? '3200ms' : '1600ms',
        animationTimingFunction: pixelSteps, animationIterationCount: 'infinite',
        animationPlayState: active ? 'running' : 'paused' }}>
        <Image source={source} transition={0} contentFit="fill" accessible={false}
          style={{ width: '100%', height: '100%' }} />
      </Animated.View>)}
  </View>;
}
