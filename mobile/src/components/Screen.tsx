import type { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabSlide } from '@/components/TabSlide';
import { colors, maxWidth, size, spacing, type } from '@/theme/tokens';
import { useTabBarClearance, useWebTabsOnTop } from '@/theme/useTabBarClearance';

const FLOATING_SPACE = size.button + spacing.lg;

type ScreenProps = PropsWithChildren<{
  /** Sin título, la pantalla usa el encabezado nativo del Stack. */
  title?: string;
  /** `false` en pantallas que están fuera de la tab bar. */
  tabbed?: boolean;
  /** Aprovecha el ancho en pantallas grandes. */
  wide?: boolean;
  /** Control que flota sobre el final de la pantalla. */
  floating?: ReactNode;
  /** Decoración detrás del contenido. */
  backdrop?: ReactNode;
}>;

export function Screen({
  title,
  tabbed = !!title,
  wide = false,
  floating,
  backdrop,
  children,
}: ScreenProps) {
  const clearance = useTabBarClearance();
  const tabsOnTop = useWebTabsOnTop();

  const screen = (
    <SafeAreaView
      style={styles.safeArea}
      edges={title ? ['top', 'left', 'right'] : ['left', 'right', 'bottom']}>
      {backdrop}
      <ScrollView
        // Con pestañas, el margen inferior se calcula aquí y no lo ajusta el sistema.
        contentInsetAdjustmentBehavior={tabbed ? 'never' : 'automatic'}
        scrollIndicatorInsets={tabbed ? { bottom: clearance } : undefined}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          wide && styles.wide,
          { paddingBottom: (tabbed ? clearance : spacing.lg) + (floating ? FLOATING_SPACE : 0) },
          tabbed && tabsOnTop && styles.webTabs,
        ]}>
        {title ? (
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </ScrollView>
      {floating ? (
        <View
          pointerEvents="box-none"
          style={[styles.floating, { bottom: tabbed ? clearance : spacing.lg }]}>
          {floating}
        </View>
      ) : null}
    </SafeAreaView>
  );

  return tabbed ? <TabSlide background={colors.bg}>{screen}</TabSlide> : screen;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    width: '100%',
    maxWidth: maxWidth.content,
    alignSelf: 'center',
  },
  wide: { maxWidth: maxWidth.wide },
  floating: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    width: '100%',
    maxWidth: maxWidth.content,
    marginHorizontal: 'auto',
  },
  // En web, la tab bar de NativeTabs flota arriba y taparía el título.
  webTabs: { paddingTop: 84 },
  title: { ...type.largeTitle, color: colors.label },
});
