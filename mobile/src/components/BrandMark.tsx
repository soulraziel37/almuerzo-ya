import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { brand, shadow } from '@/theme/tokens';

function Steam({ size, left, delay }: { size: number; left: number; delay: number }) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(reduceMotion ? 0.35 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.set(
      withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1),
      ),
    );
  }, [delay, reduceMotion, progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7,
      transform: [{ translateY: size * (0.06 - p * 0.14) }],
    };
  });

  return (
    <Animated.View style={[styles.steam, { left, top: size * 0.2 }, style]}>
      <Svg width={size * 0.1} height={size * 0.2} viewBox="0 0 5 10">
        <Path d="M2 9C2 6.5 4 5.5 4 1" stroke={brand.text} strokeWidth={1.6} strokeLinecap="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

/** Logo del canvas: un plato hondo con vapor en movimiento. */
export function BrandMark({ size = 76 }: { size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: size, height: size, borderRadius: size * 0.24 }]}>
      <Svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
        <Path
          d="M3 11h18a9 9 0 0 1-18 0zM8 21h8"
          stroke={brand.text}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      <Steam size={size} left={size * 0.39} delay={0} />
      <Steam size={size} left={size * 0.52} delay={900} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.base,
    boxShadow: shadow.floating,
  },
  steam: { position: 'absolute' },
});
