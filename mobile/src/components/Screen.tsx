import type { PropsWithChildren } from 'react';
import { Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, type } from '@/theme/tokens';

export function Screen({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
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
  // En web, la tab bar de NativeTabs flota arriba y taparía el título.
  content: { padding: 16, paddingTop: Platform.OS === 'web' ? 76 : 16, gap: 16 },
  title: { ...type.largeTitle, color: colors.label },
});
