import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { API_URL } from '@/api/client';
import type { Menu } from '@/api/types';
import { Bar } from '@/components/Bar';
import { Glass } from '@/components/Glass';
import { PressableScale } from '@/components/PressableScale';
import { Stepper } from '@/components/Stepper';
import { clp } from '@/lib/format';
import { colors, radius, shadow, size, spacing, type } from '@/theme/tokens';

const LOW_STOCK = 10;

export function stockText(menu: Menu): string {
  if (menu.available === 0) return 'Agotado';
  if (!menu.salesOpen) return 'Ventas pausadas';
  return menu.available <= LOW_STOCK ? `Últimos ${menu.available}` : `Quedan ${menu.available}`;
}

type MenuCardProps = {
  menu: Menu;
  /** Unidades en el carrito. */
  qty: number;
  max: number;
  /** `false` con las reservas cerradas o el máximo diario alcanzado. */
  canAdd: boolean;
  onChange: (qty: number) => void;
};

export function MenuCard({ menu, qty, max, canAdd, onChange }: MenuCardProps) {
  const unavailable = menu.available === 0 || !menu.salesOpen;
  const low = !unavailable && menu.available <= LOW_STOCK;

  return (
    <View style={[styles.card, qty > 0 && styles.chosen, unavailable && styles.unavailable]}>
      <View style={styles.photo}>
        {menu.photoUrl ? (
          <Image
            source={`${API_URL}${menu.photoUrl}`}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <SymbolView
            name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }}
            size={40}
            tintColor={colors.accent}
          />
        )}
        {unavailable ? (
          // Sin vidrio en tarjetas atenuadas: Liquid Glass falla bajo una opacidad menor.
          <View style={[styles.chip, styles.left, styles.offChip]}>
            <Text style={styles.chipText}>Menú {menu.slot}</Text>
          </View>
        ) : (
          <Glass style={[styles.chip, styles.left]}>
            <Text style={styles.chipText}>Menú {menu.slot}</Text>
          </Glass>
        )}
        {menu.isVegetarian ? (
          <View style={[styles.chip, styles.right, styles.vegChip]}>
            <Text style={styles.vegText}>Vegetariano</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View
          accessible
          accessibilityLabel={`Menú ${menu.slot}, ${menu.name}, ${menu.sides}, ${clp(menu.priceClp)}, ${stockText(menu)}`}
          style={styles.texts}>
          <Text style={styles.name}>{menu.name}</Text>
          <Text style={styles.sides}>{menu.sides}</Text>
        </View>

        <View style={styles.stock}>
          <Bar
            value={menu.stock > 0 ? menu.available / menu.stock : 0}
            color={low ? colors.warning : colors.accent}
            track={colors.neutralSoft}
          />
          <Text style={[styles.stockText, low && styles.low]}>{stockText(menu)}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.price}>{clp(menu.priceClp)}</Text>
          {qty > 0 ? (
            <Stepper value={qty} onChange={onChange} max={max} label={`Menú ${menu.slot}`} />
          ) : !unavailable && canAdd ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Agregar Menú ${menu.slot} al carrito`}
              accessibilityState={{ disabled: max < 1 }}
              disabled={max < 1}
              onPress={() => onChange(1)}
              style={[styles.add, max < 1 && styles.addOff]}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={18}
                tintColor={colors.onAccent}
              />
              <Text style={styles.addText}>Agregar</Text>
            </PressableScale>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.card,
    boxShadow: shadow.card,
  },
  chosen: { borderColor: colors.accent },
  unavailable: { opacity: 0.5 },
  photo: {
    height: 170,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    position: 'absolute',
    top: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  left: { left: spacing.md },
  right: { right: spacing.md },
  offChip: { backgroundColor: colors.card },
  chipText: { ...type.footnote, fontWeight: '600', color: colors.label },
  vegChip: { backgroundColor: colors.accentSoft },
  vegText: { ...type.footnote, fontWeight: '600', color: colors.accent },
  body: { padding: spacing.lg, gap: spacing.md },
  texts: { gap: spacing.xs },
  name: { ...type.title2, color: colors.label },
  sides: { ...type.subhead, color: colors.secondaryLabel },
  stock: { gap: spacing.xs },
  stockText: { ...type.footnote, color: colors.secondaryLabel },
  low: { color: colors.warning, fontWeight: '600' },
  footer: {
    minHeight: size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  price: { ...type.title2, color: colors.label, fontVariant: ['tabular-nums'] },
  add: {
    minHeight: size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  addOff: { opacity: 0.4 },
  addText: { ...type.headline, color: colors.onAccent },
});
