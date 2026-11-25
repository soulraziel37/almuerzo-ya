import { Host, Switch } from '@expo/ui';
import { StyleSheet, Text, View } from 'react-native';

import { colors, size, spacing, type } from '@/theme/tokens';

type ToggleRowProps = {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/** Fila con el interruptor nativo (SwiftUI en iOS). */
export function ToggleRow({ title, value, onValueChange, disabled }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <Host matchContents seedColor={colors.switchOn} colorScheme="light">
        <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: { ...type.body, color: colors.label, flexShrink: 1 },
});
