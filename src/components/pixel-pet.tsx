import { Image } from 'expo-image';
import { View, type ViewStyle } from 'react-native';
import Animated, { steps, type CSSAnimationKeyframes } from 'react-native-reanimated';
import { APPEARANCES, petSprites, SPRITE_SIZE } from '@/components/pet-sprite-art';
import { GROWTH_STAGES, type Appearance } from '@/game/pet';
import { useAnimationPolicy } from '@/hooks/use-animation-policy';

export { APPEARANCES } from '@/components/pet-sprite-art';

const awakeTimeline = [[0, 0], [10, 1], [20, 0], [30, 4], [34, 0],
  [44, 2], [52, 0], [62, 1], [72, 0], [80, 3], [88, 0], [100, 0]];
const actionTimelines = {
  feed: [[0, 0], [12, 1], [30, 2], [52, 3], [74, 4], [100, 0]],
  hydrate: [[0, 0], [12, 1], [32, 2], [54, 3], [76, 4], [100, 0]],
  play: [[0, 0], [12, 1], [30, 2], [50, 3], [72, 4], [100, 0]],
  clean: [[0, 0], [14, 1], [34, 2], [54, 3], [76, 4], [100, 0]],
};
const sleepTimeline = [[0, 0], [50, 1], [100, 0]];
function animations(count: number, timeline: number[][]) {
  return Array.from({ length: count }, (_, frame) => Object.fromEntries(
    timeline.map(([percent, current]) => [`${percent}%`, { opacity: current === frame ? 1 : 0 }])
  ) as CSSAnimationKeyframes<ViewStyle>);
}
const awakeAnimations = animations(5, awakeTimeline);
const sleepAnimations = animations(2, sleepTimeline);
const pixelSteps = steps(1, 'jump-end');

export function PixelPet({ appearance, stageIndex = 0, sleeping = false, small = false, pixelSize, action = null, actionKey = '' }: {
  appearance: Appearance; stageIndex?: number; sleeping?: boolean; small?: boolean; pixelSize?: number;
  action?: 'feed' | 'hydrate' | 'play' | 'clean' | null;
  actionKey?: string;
}) {
  const { reducedMotion, active } = useAnimationPolicy();
  const size = pixelSize ?? (small ? 2 : 6);
  const sources = petSprites(appearance, stageIndex, action)[sleeping ? 'asleep' : 'awake'];
  const keyframes = sleeping ? sleepAnimations : action ? animations(sources.length, actionTimelines[action]) : awakeAnimations;
  const animate = !small && !reducedMotion;
  return <View accessible accessibilityLabel={`Tamakoro ${APPEARANCES[appearance].label}, ${GROWTH_STAGES[stageIndex].label}${sleeping ? ', endormi' : ''}`}
    style={{ width: size * SPRITE_SIZE, height: size * SPRITE_SIZE }}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', inset: 0 }}>
      {(animate ? sources : sources.slice(0, 1)).map((source, index) =>
        <Animated.View key={`${stageIndex}-${sleeping}-${actionKey}-${index}`} style={{ position: 'absolute', inset: 0,
          opacity: index === 0 ? 1 : 0,
          animationName: animate ? keyframes[index] : 'none',
          animationDuration: sleeping ? '4s' : action ? '3s' : '8s',
          animationIterationCount: 'infinite', animationTimingFunction: pixelSteps,
          animationPlayState: active ? 'running' : 'paused' }}>
          <Image source={source} contentFit="fill" accessible={false} transition={0}
            style={{ width: '100%', height: '100%' }} />
        </Animated.View>)}
    </View>
  </View>;
}
