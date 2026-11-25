import { SymbolView } from 'expo-symbols';
import { Children, type PropsWithChildren, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, size, spacing, type } from '@/theme/tokens';

type GroupedListProps = PropsWithChildren<{ header?: string; footer?: string }>;

/** Sección inset agrupada de iOS: tarjeta opaca con separadores entre filas. */
export function GroupedList({ header, footer, children }: GroupedListProps) {
  const rows = Children.toArray(children);

  return (
    <View style={styles.section}>
      {header ? (
        <Text accessibilityRole="header" style={styles.header}>
          {header}
        </Text>
      ) : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 && <View style={styles.separator} />}
            {row}
          </View>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

type ListRowProps = {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  /** Si se entrega, la fila es presionable y muestra el indicador de avance. */
  onPress?: () => void;
};

export function ListRow({ title, subtitle, trailing, onPress }: ListRowProps) {
  const content = (
    <>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {trailing}
      {onPress ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          tintColor={colors.separator}
        />
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { ...type.footnote, color: colors.secondaryLabel, paddingHorizontal: spacing.lg },
  footer: { ...type.footnote, color: colors.secondaryLabel, paddingHorizontal: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: spacing.lg,
    backgroundColor: colors.separator,
  },
  row: {
    minHeight: size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: { backgroundColor: colors.bg },
  texts: { flex: 1, gap: 2 },
  title: { ...type.body, color: colors.label },
  subtitle: { ...type.subhead, color: colors.secondaryLabel },
});
