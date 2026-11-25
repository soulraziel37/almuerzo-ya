import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

/** Contadores en fila. */
export function Stats({ items }: { items: { label: string; value: number | string }[] }) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <View
          key={item.label}
          accessible
          accessibilityLabel={`${item.label}: ${item.value}`}
          style={styles.stat}>
          <Text style={styles.value}>{item.value}</Text>
          <Text style={styles.label}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.tile,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    boxShadow: shadow.card,
    padding: spacing.md,
    alignItems: 'center',
  },
  value: { ...type.title2, color: colors.label, fontVariant: ['tabular-nums'] },
  label: { ...type.caption, color: colors.secondaryLabel },
});
