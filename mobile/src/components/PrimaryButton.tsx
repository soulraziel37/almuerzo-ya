import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  /** `soft` para la acción secundaria, `danger` para las que no se deshacen. */
  variant?: 'filled' | 'soft' | 'danger';
  disabled?: boolean;
  loading?: boolean;
};

const TEXT = { filled: colors.onAccent, soft: colors.accent, danger: colors.danger } as const;

/** Botón en cápsula de 52 pt. */
export function PrimaryButton({
  title,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  const inactive = disabled || loading;
  // Deshabilitado es gris: un verde atenuado se confunde con un botón activo.
  const textColor = disabled ? colors.secondaryLabel : TEXT[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={[
        styles.button,
        variant === 'soft' && styles.soft,
        variant === 'danger' && styles.danger,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: size.button,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soft: { backgroundColor: colors.accentSoft },
  danger: { backgroundColor: colors.dangerSoft },
  disabled: { backgroundColor: colors.neutralSoft },
  text: { ...type.headline },
});
