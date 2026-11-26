import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { API_URL } from '@/api/client';
import type { Tray } from '@/api/operator';
import { fridge, radius, shadow, spacing, type } from '@/theme/tokens';

const PER_SHELF = 3;
const MIN_SHELVES = 3;

type FridgeProps = {
  trays: Tray[];
  /** Pedido que se está retirando: su bandeja se destaca y la puerta queda abierta. */
  openId?: string;
  /** Más alto, para el tótem. */
  large?: boolean;
};

function TrayCard({ tray, mine, large }: { tray: Tray; mine: boolean; large: boolean }) {
  const reduceMotion = useReducedMotion();
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!mine || reduceMotion) {
      lift.set(0);
      return;
    }
    lift.set(
      withRepeat(
        withSequence(withTiming(1, { duration: 380 }), withTiming(0, { duration: 380 })),
        -1,
      ),
    );
  }, [mine, reduceMotion, lift]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() * -5 }, { scale: 1 + lift.get() * 0.03 }],
  }));
  const photo = tray.items.find((i) => i.photoUrl)?.photoUrl;

  return (
    <Animated.View
      accessible
      accessibilityLabel={`Bandeja de ${tray.student}, código terminado en ${tray.codeEnd}${mine ? ', retirar' : ''}`}
      style={[styles.tray, mine && styles.mine, style]}>
      <View style={[styles.photo, large && styles.photoLarge]}>
        {photo ? (
          <Image source={`${API_URL}${photo}`} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
      </View>
      <View style={[styles.label, mine && styles.labelMine]}>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={styles.student}>
          {tray.student}
        </Text>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.4} style={styles.detail}>
          {tray.items.map((i) => `${i.qty}×M${i.slot}`).join(' ')} · {tray.codeEnd}
        </Text>
      </View>
    </Animated.View>
  );
}

/** Refrigerador con puerta de vidrio: una bandeja etiquetada por cada pedido sin retirar. */
export function Fridge({ trays, openId, large = false }: FridgeProps) {
  const open = !!openId;
  const reduceMotion = useReducedMotion();
  const angle = useSharedValue(0);
  const light = useSharedValue(0);

  useEffect(() => {
    const ease = { duration: 750, easing: Easing.out(Easing.cubic) };
    angle.set(reduceMotion ? (open ? -106 : 0) : withTiming(open ? -106 : 0, ease));
    light.set(reduceMotion ? (open ? 1 : 0) : withTiming(open ? 1 : 0, { duration: 450 }));
  }, [open, reduceMotion, angle, light]);

  const door = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateY: `${angle.get()}deg` }],
  }));
  // Encendida al abrir; cerrada queda una luz tenue para ver las bandejas.
  const lamp = useAnimatedStyle(() => ({ opacity: 0.16 + light.get() * 0.84 }));

  const shelves = Math.max(MIN_SHELVES, Math.ceil(trays.length / PER_SHELF));

  return (
    <View style={styles.cabinet}>
      <View style={styles.top}>
        <Text style={styles.brand}>Reserva UM</Text>
        <View style={styles.display}>
          <View style={[styles.led, { backgroundColor: open ? fridge.open : fridge.locked }]} />
          <Text style={styles.displayText}>{open ? 'Abierta' : 'Bloqueada'}</Text>
        </View>
      </View>

      <View style={styles.inside}>
        <View style={styles.back}>
          <Animated.View style={[styles.lamp, lamp]} />
        </View>
        {Array.from({ length: shelves }, (_, s) => (
          <View key={s} style={[styles.shelf, large && styles.shelfLarge]}>
            {Array.from({ length: PER_SHELF }, (_, i) => {
              const tray = trays[s * PER_SHELF + i];
              return (
                <View key={tray?.id ?? `vacio-${i}`} style={styles.space}>
                  {tray ? <TrayCard tray={tray} mine={tray.id === openId} large={large} /> : null}
                </View>
              );
            })}
          </View>
        ))}
        {trays.length === 0 ? (
          <View pointerEvents="none" style={styles.empty}>
            <Text style={[styles.emptyText, open && styles.emptyLit]}>Refrigerador vacío</Text>
          </View>
        ) : null}

        <Animated.View pointerEvents="none" style={[styles.door, door]}>
          <View style={[styles.shine, styles.shineWide]} />
          <View style={[styles.shine, styles.shineThin]} />
          <View style={styles.handle} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabinet: {
    backgroundColor: fridge.cabinet,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: fridge.cabinetEdge,
    padding: spacing.md,
    gap: spacing.md,
    boxShadow: shadow.floating,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  brand: { ...type.headline, color: fridge.text },
  display: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    backgroundColor: fridge.display,
  },
  led: { width: 9, height: 9, borderRadius: radius.pill },
  displayText: { ...type.footnote, fontWeight: '600', color: fridge.displayText },
  inside: { borderRadius: radius.tile },
  back: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.tile,
    overflow: 'hidden',
    backgroundColor: fridge.inside,
  },
  lamp: { ...StyleSheet.absoluteFill, backgroundColor: fridge.lit },
  shelf: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 112,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderBottomWidth: 5,
    borderBottomColor: fridge.shelf,
  },
  shelfLarge: { minHeight: 148 },
  space: { flex: 1, justifyContent: 'flex-end' },
  tray: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  mine: { borderColor: fridge.mineEdge },
  photo: { height: 52, backgroundColor: fridge.cabinet },
  photoLarge: { height: 84 },
  label: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, backgroundColor: fridge.label },
  labelMine: { backgroundColor: fridge.mine },
  student: { ...type.caption, fontWeight: '700', color: fridge.text },
  detail: { ...type.caption, color: fridge.text },
  empty: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...type.subhead, color: fridge.lit },
  emptyLit: { color: fridge.text },
  door: {
    ...StyleSheet.absoluteFill,
    transformOrigin: 'left',
    borderRadius: radius.tile,
    borderWidth: 4,
    borderColor: fridge.frame,
    backgroundColor: fridge.glass,
    overflow: 'hidden',
  },
  shine: { position: 'absolute', top: -60, bottom: -60, backgroundColor: fridge.shine, transform: [{ rotate: '18deg' }] },
  shineWide: { left: '16%', width: 46 },
  shineThin: { left: '36%', width: 14 },
  handle: {
    position: 'absolute',
    right: 8,
    top: '32%',
    width: 8,
    height: '36%',
    borderRadius: radius.pill,
    backgroundColor: fridge.cabinet,
    boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
  },
});
