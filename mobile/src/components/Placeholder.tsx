import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, radius, type } from '@/theme/tokens';

/** Pantalla vacía de la fase 1; cada una se reemplaza en su fase. */
export function Placeholder({ title, phase }: { title: string; phase: number }) {
  return (
    <Screen title={title}>
      <View style={styles.card}>
        <Text style={styles.text}>Pantalla en construcción (fase {phase}).</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 20 },
  text: { ...type.body, color: colors.secondaryLabel },
});
