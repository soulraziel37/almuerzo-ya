import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { brand } from '@/theme/tokens';

const DURATION = 1900;

type Piece = { x: number; y: number; spin: number; size: number; color: string };

function makePieces(): Piece[] {
  return Array.from({ length: 30 }, (_, i) => {
    const angle = Math.PI * (0.15 + 0.7 * Math.random());
    const power = 120 + Math.random() * 190;
    return {
      x: Math.cos(angle) * power,
      y: -Math.sin(angle) * power,
      spin: (Math.random() - 0.5) * 1400,
      size: 6 + Math.random() * 6,
      color: brand.confetti[i % brand.confetti.length]!,
    };
  });
}

function Flake({ piece }: { piece: Piece }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withTiming(1, { duration: DURATION, easing: Easing.out(Easing.quad) }));
  }, [progress]);

  const style = useAnimatedStyle(() => {
    const p = progress.get();
    return {
      opacity: p < 0.7 ? 1 : (1 - p) / 0.3,
      transform: [
        { translateX: piece.x * p },
        { translateY: piece.y * Math.min(1, p * 1.6) + 360 * p * p },
        { rotate: `${piece.spin * p}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.flake,
        { width: piece.size, height: piece.size * 0.6, backgroundColor: piece.color },
        style,
      ]}
    />
  );
}

function Burst() {
  const [pieces, setPieces] = useState(makePieces);

  useEffect(() => {
    const timer = setTimeout(() => setPieces([]), DURATION + 100);
    return () => clearTimeout(timer);
  }, []);

  return pieces.map((piece, i) => <Flake key={i} piece={piece} />);
}

/** Lluvia de papel picado cada vez que cambia `burst` (0 no muestra nada). */
export function Confetti({ burst }: { burst: number }) {
  const reduceMotion = useReducedMotion();
  if (!burst || reduceMotion) return null;
  return (
    <View pointerEvents="none" style={styles.layer}>
      <Burst key={burst} />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  flake: { position: 'absolute', borderRadius: 2 },
});
