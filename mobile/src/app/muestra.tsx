import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Glass } from '@/components/Glass';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Stepper } from '@/components/Stepper';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

const menus = ['Menú 1', 'Menú 2'] as const;

/** Pantalla de muestra del design system (fase 2). */
export default function ComponentShowcase() {
  const [menu, setMenu] = useState<(typeof menus)[number]>('Menú 1');
  const [quantity, setQuantity] = useState(1);
  const [taps, setTaps] = useState(0);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  return (
    <Screen title="Componentes" tabbed={false}>
      {/* Fondo con color para que se note el vidrio. */}
      <View style={styles.hero}>
        <View style={styles.circleLarge} />
        <View style={styles.circleSmall} />
        <Glass interactive style={styles.glassButton}>
          <Pressable accessibilityRole="button" onPress={back} style={styles.glassTouch}>
            <Text style={styles.glassText}>Volver</Text>
          </Pressable>
        </Glass>
        <Glass style={styles.chip}>
          <Text style={styles.chipText}>Quedan 42</Text>
        </Glass>
      </View>

      <Segmented options={menus} value={menu} onChange={setMenu} accessibilityLabel="Menú" />

      <GroupedList header="Pedido" footer="Máximo 5 por menú.">
        <ListRow title={menu} subtitle="Ensalada, pan y jugo" />
        <ListRow
          title="Cantidad"
          trailing={<Stepper value={quantity} onChange={setQuantity} max={5} label="almuerzos" />}
        />
        <ListRow title="Fila presionable" subtitle={`Toques: ${taps}`} onPress={() => setTaps(taps + 1)} />
      </GroupedList>

      <GroupedList header="Estados de stock">
        <ListRow title="Disponible" trailing={<Text style={[styles.state, styles.ok]}>Quedan 42</Text>} />
        <ListRow title="Bajo" trailing={<Text style={[styles.state, styles.low]}>Últimos 8</Text>} />
        <ListRow title="Sin stock" trailing={<Text style={[styles.state, styles.out]}>Agotado</Text>} />
      </GroupedList>

      <PrimaryButton title="Agregar al carrito" onPress={() => setTaps(taps + 1)} />
      <PrimaryButton title="Acción secundaria" variant="soft" onPress={() => setTaps(taps + 1)} />
      <PrimaryButton title="Deshabilitado" disabled onPress={() => {}} />
      <PrimaryButton title="Cargando" loading onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 180,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.accentSoft,
    padding: spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  circleLarge: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    left: -30,
    top: -40,
  },
  circleSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: radius.pill,
    backgroundColor: colors.warning,
    left: 60,
    bottom: -50,
  },
  glassButton: { minHeight: size.touch },
  glassTouch: { minHeight: size.touch, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  glassText: { ...type.headline, color: colors.label },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipText: { ...type.footnote, fontWeight: '600', color: colors.label },
  state: { ...type.subhead, fontWeight: '600' },
  ok: { color: colors.accent },
  low: { color: colors.warning },
  out: { color: colors.danger },
});
