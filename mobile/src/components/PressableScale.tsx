import type { PropsWithChildren } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING = { mass: 0.4, damping: 14, stiffness: 260 };

type PressableScaleProps = PropsWithChildren<
  Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle> }
>;

/** Pressable que se hunde con un resorte al tocarlo. */
export function PressableScale({ style, children, ...props }: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(event) => {
        if (!reduceMotion) scale.set(withSpring(0.965, SPRING));
        props.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.set(withSpring(1, SPRING));
        props.onPressOut?.(event);
      }}
      style={[style, animated]}>
      {children}
    </AnimatedPressable>
  );
}
