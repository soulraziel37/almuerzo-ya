import type { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, type } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  title: string;
  /** `false` en pantallas que están fuera de la tab bar. */
  tabbed?: boolean;
}>;

export function Screen({ title, tabbed = true, children }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, tabbed && Platform.OS === 'web' && styles.webTabs]}>
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 16 },
  // En web, la tab bar de NativeTabs flota arriba y taparía el título.
  webTabs: { paddingTop: 76 },
  title: { ...type.largeTitle, color: colors.label },
});
