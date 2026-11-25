import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, glass, radius } from '@/theme/tokens';
import { useReduceTransparency } from '@/theme/useReduceTransparency';

type GlassProps = ViewProps & {
  /** Reacciona al toque (solo Liquid Glass). Para controles presionables. */
  interactive?: boolean;
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
export function Glass({ interactive = false, style, children, ...props }: GlassProps) {
  const reduceTransparency = useReduceTransparency();

  if (!reduceTransparency && Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView {...props} isInteractive={interactive} style={[styles.shape, style]}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      {...props}
      style={[
        styles.shape,
        styles.border,
        reduceTransparency ? styles.opaque : styles.translucent,
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
});
