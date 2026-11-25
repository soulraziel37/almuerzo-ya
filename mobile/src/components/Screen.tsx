import { useEffect, useRef, type PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, Text, type ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TabSlide } from '@/components/TabSlide';
import { colors, spacing, type } from '@/theme/tokens';
import { useTabBarClearance } from '@/theme/useTabBarClearance';

type ScreenProps = PropsWithChildren<{
  /** Sin título, la pantalla usa el encabezado nativo del Stack. */
  title?: string;
  /** `false` en pantallas que están fuera de la tab bar. */
  tabbed?: boolean;
  /** Cada vez que este número sube, la pantalla se desplaza hasta el final. */
  revealEnd?: number;
}>;

export function Screen({ title, tabbed = !!title, revealEnd = 0, children }: ScreenProps) {
  const clearance = useTabBarClearance();
  const scroll = useRef<ScrollViewInstance>(null);
  const previous = useRef(revealEnd);

  useEffect(() => {
    const grew = revealEnd > previous.current;
    previous.current = revealEnd;
    if (!grew) return;
    // Se espera a que lo recién agregado tenga tamaño.
    const timer = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 150);
    return () => clearTimeout(timer);
  }, [revealEnd]);

  const screen = (
    <SafeAreaView
      style={styles.safeArea}
      edges={title ? ['top', 'left', 'right'] : ['left', 'right', 'bottom']}>
      <ScrollView
        ref={scroll}
        // Con pestañas, el margen inferior se calcula aquí y no lo ajusta el sistema.
        contentInsetAdjustmentBehavior={tabbed ? 'never' : 'automatic'}
        scrollIndicatorInsets={tabbed ? { bottom: clearance } : undefined}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          tabbed && { paddingBottom: clearance },
          tabbed && Platform.OS === 'web' && styles.webTabs,
        ]}>
        {title ? (
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );

  return tabbed ? <TabSlide background={colors.bg}>{screen}</TabSlide> : screen;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg },
  // En web, la tab bar de NativeTabs flota arriba y taparía el título.
  webTabs: { paddingTop: 76 },
  title: { ...type.largeTitle, color: colors.label },
});
