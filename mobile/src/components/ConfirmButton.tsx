import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ConfirmButtonProps } from '@/components/ConfirmButton.types';
import { Glass } from '@/components/Glass';
import { PrimaryButton } from '@/components/PrimaryButton';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

/** Versión para web y Android: imita la burbuja de iOS bajo el botón. */
export function ConfirmButton({
  title,
  question,
  message,
  confirmLabel,
  loading = false,
  isDisabled = false,
  onConfirm,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.container}>
      <PrimaryButton
        title={title}
        variant="danger"
        loading={loading}
        disabled={isDisabled}
        onPress={() => setOpen((value) => !value)}
      />
      {open ? (
        <Glass accessibilityViewIsModal style={styles.bubble}>
          <Text accessibilityRole="header" style={styles.question}>
            {question}
          </Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.action}
            onPress={() => {
              setOpen(false);
              onConfirm();
            }}>
            <Text style={styles.destructive}>{confirmLabel}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.action} onPress={() => setOpen(false)}>
            <Text style={styles.cancel}>Volver</Text>
          </Pressable>
        </Glass>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', gap: spacing.sm },
  bubble: {
    alignSelf: 'center',
    width: '88%',
    maxWidth: 320,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.card,
    backgroundColor: colors.card,
  },
  question: { ...type.headline, color: colors.label, textAlign: 'center' },
  message: { ...type.footnote, color: colors.secondaryLabel, textAlign: 'center' },
  action: {
    minHeight: size.touch,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destructive: { ...type.headline, color: colors.danger },
  cancel: { ...type.body, color: colors.label },
});
