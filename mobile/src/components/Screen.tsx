import type { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, type } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  /** Sin título, la pantalla usa el encabezado nativo del Stack. */
  title?: string;
  /** `false` en pantallas que están fuera de la tab bar. */
  tabbed?: boolean;
}>;

export function Screen({ title, tabbed = !!title, children }: ScreenProps) {
  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={title ? ['top', 'left', 'right'] : ['left', 'right', 'bottom']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, tabbed && Platform.OS === 'web' && styles.webTabs]}>
        {title ? (
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  // En web, la tab bar de NativeTabs flota arriba y taparía el título.
  webTabs: { paddingTop: 76 },
  title: { ...type.largeTitle, color: colors.label },
});
