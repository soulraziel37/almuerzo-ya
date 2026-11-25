import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, size, spacing, type } from '@/theme/tokens';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  /** `soft` para la acción secundaria. */
  variant?: 'filled' | 'soft';
  disabled?: boolean;
  loading?: boolean;
};

/** Botón en cápsula de 52 pt. */
export function PrimaryButton({
  title,
  onPress,
  variant = 'filled',
  disabled = false,
  loading = false,
}: PrimaryButtonProps) {
  const inactive = disabled || loading;
  const textColor = variant === 'filled' ? colors.card : colors.accent;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'soft' && styles.soft,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
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
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  text: { ...type.headline },
});
