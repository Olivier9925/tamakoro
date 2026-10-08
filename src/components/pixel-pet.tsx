import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState, View, type ViewStyle } from 'react-native';
import Animated, { steps, useReducedMotion, type CSSAnimationKeyframes } from 'react-native-reanimated';
import { APPEARANCES, PET_SPRITES } from '@/components/pet-sprite-art';
import type { Appearance } from '@/game/pet';

export { APPEARANCES } from '@/components/pet-sprite-art';

const awakeTimeline = [[0, 0], [14, 1], [28, 0], [38, 4], [41, 0],
  [50, 2], [60, 0], [70, 1], [82, 0], [88, 3], [96, 0], [100, 0]];
const sleepTimeline = [[0, 0], [50, 1], [100, 0]];
function animations(count: number, timeline: number[][]) {
  return Array.from({ length: count }, (_, frame) => Object.fromEntries(
    timeline.map(([percent, current]) => [`${percent}%`, { opacity: current === frame ? 1 : 0 }])
  ) as CSSAnimationKeyframes<ViewStyle>);
}
const awakeAnimations = animations(5, awakeTimeline);
const sleepAnimations = animations(2, sleepTimeline);
const pixelSteps = steps(1, 'jump-end');

export function PixelPet({ appearance, sleeping = false, small = false, pixelSize }: {
  appearance: Appearance; sleeping?: boolean; small?: boolean; pixelSize?: number;
}) {
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReducedMotion(value);
    });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    const state = AppState.addEventListener('change', value => setActive(value === 'active'));
    return () => { mounted = false; motion.remove(); state.remove(); };
  }, []);
  const size = pixelSize ?? (small ? 4 : 12);
  const sources = PET_SPRITES[appearance][sleeping ? 'asleep' : 'awake'];
  const keyframes = sleeping ? sleepAnimations : awakeAnimations;
  const animate = !small && !reducedMotion;
  return <View accessible accessibilityLabel={`Tamakoro ${APPEARANCES[appearance].label}${sleeping ? ' endormi' : ''}`}
    style={{ width: size * 16, height: size * 17 }}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', inset: 0 }}>
      {(animate ? sources : sources.slice(0, 1)).map((source, index) =>
        <Animated.View key={`${sleeping}-${index}`} style={{ position: 'absolute', inset: 0,
          opacity: index === 0 ? 1 : 0,
          animationName: animate ? keyframes[index] : 'none',
          animationDuration: sleeping ? '4s' : '8s',
          animationIterationCount: 'infinite', animationTimingFunction: pixelSteps,
          animationPlayState: active ? 'running' : 'paused' }}>
          <Image source={source} contentFit="fill" accessible={false} transition={0}
            style={{ width: '100%', height: '100%' }} />
        </Animated.View>)}
    </View>
  </View>;
}
