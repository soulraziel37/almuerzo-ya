import { Host } from '@expo/ui';
import { Button, ConfirmationDialog, Text } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  disabled,
  font,
  frame,
  padding,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import type { ConfirmButtonProps } from '@/components/ConfirmButton.types';
import { type } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';

/**
 * Botón con confirmación nativa: en iOS 26 el sistema la muestra como una burbuja
 * anclada al botón.
 */
export function ConfirmButton({
  title,
  message,
  question,
  confirmLabel,
  loading = false,
  isDisabled = false,
  onConfirm,
}: ConfirmButtonProps) {
  const [presented, setPresented] = useState(false);
  const theme = usePalette();

  return (
    <Host matchContents={{ vertical: true }} style={styles.host}>
      <ConfirmationDialog
        title={question}
        titleVisibility="visible"
        isPresented={presented}
        onIsPresentedChange={setPresented}>
        <ConfirmationDialog.Trigger>
          <Button
            onPress={() => setPresented(true)}
            modifiers={[
              buttonStyle('bordered'),
              buttonBorderShape('capsule'),
              controlSize('large'),
              tint(theme.danger),
              disabled(loading || isDisabled),
            ]}>
            <Text
              modifiers={[
                font({ size: type.headline.fontSize, weight: 'semibold' }),
                frame({ maxWidth: 10000 }),
                padding({ vertical: 6 }),
              ]}>
              {loading ? 'Procesando…' : title}
            </Text>
          </Button>
        </ConfirmationDialog.Trigger>
        <ConfirmationDialog.Actions>
          <Button label={confirmLabel} role="destructive" onPress={onConfirm} />
          <Button label="Volver" role="cancel" />
        </ConfirmationDialog.Actions>
        <ConfirmationDialog.Message>
          <Text>{message}</Text>
        </ConfirmationDialog.Message>
      </ConfirmationDialog>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: { alignSelf: 'stretch' },
});
