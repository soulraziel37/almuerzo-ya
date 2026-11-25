import { StyleSheet, Text } from 'react-native';

import { colors, type } from '@/theme/tokens';

/** Texto de apoyo o de error bajo el contenido. */
export function Notice({ children, error = false }: { children: string; error?: boolean }) {
  return (
    <Text
      accessibilityRole={error ? 'alert' : 'text'}
      accessibilityLiveRegion={error ? 'assertive' : 'polite'}
      style={[styles.text, error && styles.error]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { ...type.subhead, color: colors.secondaryLabel, textAlign: 'center' },
  error: { color: colors.danger },
});
