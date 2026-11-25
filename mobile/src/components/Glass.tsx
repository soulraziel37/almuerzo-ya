import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, glass, radius, scanner } from '@/theme/tokens';
import { useReduceTransparency } from '@/theme/useReduceTransparency';

type GlassProps = ViewProps & {
  /** Reacciona al toque (solo Liquid Glass). Para controles presionables. */
  interactive?: boolean;
  /** `dark` para controles sobre la cámara. */
  tone?: 'light' | 'dark';
};

// `backdropFilter` no existe en los tipos de React Native, pero react-native-web lo aplica.
const webBlur = {
  backdropFilter: glass.webFilter,
  WebkitBackdropFilter: glass.webFilter,
} as ViewStyle;

/**
 * Superficie para controles flotantes: Liquid Glass en iOS 26+, desenfoque en web,
 * translúcida en el resto y opaca con "Reducir transparencia".
 */
export function Glass({ interactive = false, tone = 'light', style, children, ...props }: GlassProps) {
  const reduceTransparency = useReduceTransparency();

  if (!reduceTransparency && Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView
        {...props}
        isInteractive={interactive}
        colorScheme={tone}
        style={[styles.shape, style]}>
        {children}
      </GlassView>
    );
  }

  const dark = tone === 'dark';
  return (
    <View
      {...props}
      style={[
        styles.shape,
        styles.border,
        dark && styles.darkBorder,
        reduceTransparency
          ? dark
            ? styles.darkOpaque
            : styles.opaque
          : dark
            ? styles.darkTranslucent
            : styles.translucent,
        !reduceTransparency && Platform.OS === 'web' && webBlur,
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  shape: { borderRadius: radius.pill },
  border: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator },
  opaque: { backgroundColor: colors.card },
  translucent: { backgroundColor: glass.fill },
  darkBorder: { borderWidth: 1, borderColor: scanner.glassBorder },
  darkOpaque: { backgroundColor: scanner.glassOpaque },
  darkTranslucent: { backgroundColor: scanner.glassFill },
});
