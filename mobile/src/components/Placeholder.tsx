import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, radius, spacing, type } from '@/theme/tokens';

/** Pantalla aún vacía; cada una se reemplaza en su fase. */
export function Placeholder({
  title,
  phase,
  children,
}: PropsWithChildren<{ title: string; phase: number }>) {
  return (
    <Screen title={title}>
      <View style={styles.card}>
        <Text style={styles.text}>Pantalla en construcción (fase {phase}).</Text>
      </View>
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: spacing.xl },
  text: { ...type.body, color: colors.secondaryLabel },
});
