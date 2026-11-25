import { useEffect } from 'react';
import { StyleSheet, View, type ColorValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { radius } from '@/theme/tokens';

type BarProps = {
  /** De 0 a 1. */
  value: number;
  color: ColorValue;
  track: ColorValue;
  height?: number;
};

/** Barra de avance que se anima al cambiar. Es decorativa: el dato va en texto al lado. */
export function Bar({ value, color, track, height = 6 }: BarProps) {
  const reduceMotion = useReducedMotion();
  const target = Math.max(0, Math.min(1, value));
  const scale = useSharedValue(reduceMotion ? target : 0);

  useEffect(() => {
    scale.set(
      reduceMotion ? target : withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [target, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: scale.get() }] }));
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.track, { height, backgroundColor: track }]}>
      <Animated.View style={[styles.bar, { backgroundColor: color }, style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { borderRadius: radius.pill, overflow: 'hidden', alignSelf: 'stretch' },
  bar: { flex: 1, borderRadius: radius.pill, transformOrigin: 'left' },
});
