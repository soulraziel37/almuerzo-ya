import { usePathname } from 'expo-router';
import { useRoute } from 'expo-router/react-navigation';
import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet, useWindowDimensions, View, type ColorValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/** Pestañas de cada rol, en el orden de la barra. */
const GROUPS = [
  ['menu', 'pedidos', 'perfil'],
  ['escanear', 'refri', 'stock', 'menus'],
];

const DURATION = 280;

// Última pestaña mostrada: define el lado de una pantalla que se monta por primera vez.
let lastTab: string | undefined;

/** Hacia qué lado queda `tab` respecto de `active`: 1 derecha, -1 izquierda, 0 ninguno. */
function side(tab: string, active: string | undefined): number {
  const group = GROUPS.find((g) => g.includes(tab));
  if (!group || !active || !group.includes(active)) return 0;
  return Math.sign(group.indexOf(tab) - group.indexOf(active));
}

/**
 * Desliza el contenido al cambiar de pestaña. La tab bar nativa no anima el cambio, así
 * que cada pantalla espera fuera de lugar, hacia su lado, y entra al ser elegida.
 *
 * Solo se mueve, sin cambiar la opacidad: Liquid Glass deja de dibujarse si una vista
 * contenedora llega a opacidad 0.
 */
export function TabSlide({ background, children }: PropsWithChildren<{ background: ColorValue }>) {
  const { name } = useRoute();
  const active = usePathname().slice(1);
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const distance = width * 0.45;

  const start = reduceMotion ? 0 : side(name, lastTab);
  const offset = useSharedValue(start * distance);

  useEffect(() => {
    // Una pantalla apilada encima (carrito, validar) no mueve las pestañas.
    if (!GROUPS.some((g) => g.includes(active))) return;

    if (active === name) {
      lastTab = name;
      offset.set(withTiming(0, { duration: DURATION, easing: Easing.out(Easing.cubic) }));
      return;
    }
    const direction = side(name, active);
    if (direction !== 0 && !reduceMotion) offset.set(direction * distance);
  }, [active, name, distance, reduceMotion, offset]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Animated.View style={[styles.content, style]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  content: { flex: 1 },
});
