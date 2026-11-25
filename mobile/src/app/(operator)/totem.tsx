import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import { FridgeStation } from '@/components/FridgeStation';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { leaveFullscreen } from '@/lib/fullscreen';
import { useNow } from '@/lib/useNow';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

/** El refrigerador a pantalla completa, sin las pestañas del operador. */
export default function TotemScreen() {
  const now = new Date(useNow(5000));
  useEffect(() => leaveFullscreen, []);

  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <Screen wide>
      <View style={styles.header}>
        <BrandMark size={52} />
        <View style={styles.texts}>
          <Text accessibilityRole="header" style={styles.title}>
            Retira tu almuerzo
          </Text>
          <Text style={styles.detail}>Casino central</Text>
        </View>
        <Text style={styles.clock}>{clock}</Text>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Salir del modo tótem"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/refri'))}
          style={styles.exit}>
          <Text style={styles.exitText}>Salir</Text>
        </PressableScale>
      </View>
      <FridgeStation large />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingTop: spacing.lg },
  texts: { flex: 1 },
  title: { ...type.title2, color: colors.label },
  detail: { ...type.subhead, color: colors.secondaryLabel },
  clock: { ...type.title2, color: colors.label, fontVariant: ['tabular-nums'] },
  exit: {
    minHeight: size.touch,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  exitText: { ...type.subhead, fontWeight: '600', color: colors.accent },
});
