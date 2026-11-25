import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { brand, radius, spacing, type } from '@/theme/tokens';

const STEPS = ['Reservado', 'Pagado', 'Retirado'] as const;

function Pulse() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    progress.set(
      withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }), -1),
    );
  }, [reduceMotion, progress]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.get()),
    transform: [{ scale: 1 + progress.get() * 0.9 }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.dot, styles.pulse, style]} />;
}

/** Avance del pedido. `done` es cuántos pasos ya ocurrieron; el siguiente late. */
export function OrderProgress({ done }: { done: 1 | 2 | 3 }) {
  return (
    <View
      accessible
      accessibilityLabel={`Paso ${done} de ${STEPS.length}: ${STEPS[done - 1]}`}
      style={styles.row}>
      {STEPS.map((step, i) => {
        const reached = i < done;
        return (
          <View key={step} style={styles.step}>
            {i > 0 ? <View style={[styles.line, reached && styles.lineOn]} /> : null}
            <View style={styles.dotBox}>
              {i === done ? <Pulse /> : null}
              <View style={[styles.dot, reached ? styles.dotOn : styles.dotOff]}>
                {reached ? (
                  <SymbolView
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={14}
                    tintColor={brand.base}
                  />
                ) : null}
              </View>
            </View>
            <Text style={[styles.label, !reached && styles.labelOff]}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 26;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'stretch' },
  step: { flex: 1, alignItems: 'center', gap: spacing.xs },
  line: {
    position: 'absolute',
    top: DOT / 2 - 1.5,
    left: '-50%',
    right: '50%',
    marginHorizontal: DOT / 2 + 4,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: brand.track,
  },
  lineOn: { backgroundColor: brand.text },
  dotBox: { width: DOT, height: DOT },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotOn: { backgroundColor: brand.text },
  dotOff: { backgroundColor: brand.deep, borderWidth: 2, borderColor: brand.light },
  pulse: { position: 'absolute', backgroundColor: brand.text },
  label: { ...type.footnote, fontWeight: '600', color: brand.text },
  labelOff: { color: brand.secondaryText, fontWeight: '400' },
});
