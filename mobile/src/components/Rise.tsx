import { useEffect, type PropsWithChildren } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/**
 * Entrada escalonada: el contenido sube a su lugar. Solo se mueve, porque Liquid Glass deja
 * de dibujarse si un contenedor llega a opacidad 0.
 */
export function Rise({ index = 0, children }: PropsWithChildren<{ index?: number }>) {
  const reduceMotion = useReducedMotion();
  const offset = useSharedValue(reduceMotion ? 0 : 28 + index * 14);

  useEffect(() => {
    offset.set(
      withDelay(index * 60, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) })),
    );
  }, [index, offset]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.get() }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
