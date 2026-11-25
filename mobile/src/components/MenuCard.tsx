import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Menu } from '@/api/types';
import { Glass } from '@/components/Glass';
import { clp } from '@/lib/format';
import { colors, radius, spacing, type } from '@/theme/tokens';

const LOW_STOCK = 10;

export function stockText(menu: Menu): string {
  if (menu.available === 0) return 'Agotado';
  if (!menu.salesOpen) return 'Ventas pausadas';
  return menu.available <= LOW_STOCK ? `Últimos ${menu.available}` : `Quedan ${menu.available}`;
}

type MenuCardProps = { menu: Menu; selected: boolean; onSelect: () => void };

export function MenuCard({ menu, selected, onSelect }: MenuCardProps) {
  const unavailable = menu.available === 0 || !menu.salesOpen;
  const low = !unavailable && menu.available <= LOW_STOCK;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: unavailable }}
      accessibilityLabel={`Menú ${menu.slot}, ${menu.name}, ${clp(menu.priceClp)}, ${stockText(menu)}`}
      disabled={unavailable}
      onPress={onSelect}
      style={[styles.card, selected && styles.selected, unavailable && styles.unavailable]}>
      <View style={styles.photo}>
        <SymbolView
          name={{ ios: 'fork.knife', android: 'restaurant', web: 'restaurant' }}
          size={40}
          tintColor={colors.accent}
        />
        {low ? (
          <View style={[styles.chip, styles.lowChip]}>
            <Text style={[styles.chipText, styles.lowText]}>{stockText(menu)}</Text>
          </View>
        ) : (
          <Glass style={styles.chip}>
            <Text style={styles.chipText}>{stockText(menu)}</Text>
          </Glass>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.label}>Menú {menu.slot}</Text>
          {menu.isVegetarian ? <Text style={styles.veg}>VEG</Text> : null}
        </View>
        <Text style={styles.name}>{menu.name}</Text>
        <Text style={styles.sides}>{menu.sides}</Text>
        <Text style={styles.price}>{clp(menu.priceClp)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'transparent',
  },
  selected: { borderColor: colors.accent },
  unavailable: { opacity: 0.5 },
  photo: {
    height: 110,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  lowChip: { backgroundColor: colors.warning },
  chipText: { ...type.footnote, fontWeight: '600', color: colors.label },
  lowText: { color: colors.card },
  body: { padding: spacing.lg, gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  label: { ...type.footnote, fontWeight: '600', color: colors.secondaryLabel },
  veg: {
    ...type.caption,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 6,
    borderRadius: spacing.xs,
    overflow: 'hidden',
  },
  name: { ...type.title2, color: colors.label },
  sides: { ...type.subhead, color: colors.secondaryLabel },
  price: { ...type.headline, color: colors.label, marginTop: spacing.xs },
});
