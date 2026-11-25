import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/PressableScale';
import { clp, lunches } from '@/lib/format';
import { colors, radius, shadow, size, spacing, type } from '@/theme/tokens';

/** Carrito flotante: late cada vez que se agrega algo. */
export function CartBar({ count, total }: { count: number; total: number }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const previous = useRef(0);

  useEffect(() => {
    if (count > previous.current && !reduceMotion) {
      scale.set(
        withSequence(
          withTiming(1.05, { duration: 110 }),
          withSpring(1, { mass: 0.5, damping: 9, stiffness: 220 }),
        ),
      );
    }
    previous.current = count;
  }, [count, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Animated.View style={style}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Ver carrito, ${lunches(count)}, ${clp(total)}`}
        onPress={() => router.push('/carrito')}
        style={styles.bar}>
        <View style={styles.count}>
          <Text style={styles.countText}>{count}</Text>
        </View>
        <Text style={styles.label}>Ver carrito</Text>
        <Text style={styles.total}>{clp(total)}</Text>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={16}
          tintColor={colors.onAccent}
        />
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: size.button,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    boxShadow: shadow.floating,
  },
  count: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.onAccent,
  },
  countText: { ...type.subhead, fontWeight: '700', color: colors.accent, fontVariant: ['tabular-nums'] },
  label: { ...type.headline, color: colors.onAccent, flex: 1 },
  total: { ...type.headline, color: colors.onAccent, fontVariant: ['tabular-nums'] },
});
