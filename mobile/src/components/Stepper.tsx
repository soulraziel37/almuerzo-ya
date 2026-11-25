import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, size, type } from '@/theme/tokens';

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  step?: number;
  /** Qué se está contando; lo lee VoiceOver. */
  label: string;
};

const icons = {
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
} as const;

export function Stepper({ value, onChange, min = 0, max, step = 1, label }: StepperProps) {
  const button = (icon: keyof typeof icons, action: string, next: number) => {
    const disabled = next < min || next > max;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${action} ${label}`}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={() => onChange(next)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <SymbolView
          name={icons[icon]}
          size={18}
          tintColor={disabled ? colors.separator : colors.accent}
        />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {button('minus', 'Quitar', value - step)}
      <Text accessibilityLabel={`${value} ${label}`} accessibilityLiveRegion="polite" style={styles.value}>
        {value}
      </Text>
      {button('plus', 'Agregar', value + step)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: radius.pill,
  },
  button: { width: size.touch, height: size.touch, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.5 },
  value: {
    ...type.headline,
    color: colors.label,
    minWidth: 36,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
