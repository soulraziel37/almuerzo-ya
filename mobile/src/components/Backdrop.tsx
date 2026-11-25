import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

/** Círculos del canvas detrás del ingreso, con una deriva lenta. */
export function Backdrop() {
  const reduceMotion = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    drift.set(
      withRepeat(withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [reduceMotion, drift]);

  const green = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.get() * 26 }, { translateY: drift.get() * 14 }],
  }));
  const sand = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.get() * -30 }, { translateY: drift.get() * 34 }],
  }));

  return (
    <View pointerEvents="none" style={styles.fill}>
      <Animated.View style={[styles.circle, styles.green, green]} />
      <Animated.View style={[styles.circle, styles.sand, sand]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999 },
  green: { left: -60, top: -120, width: 520, height: 420, backgroundColor: colors.accentSoft },
  sand: { right: -90, top: 40, width: 260, height: 260, backgroundColor: colors.sand },
});
