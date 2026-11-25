import { Host, Switch } from '@expo/ui';
import { StyleSheet, View } from 'react-native';

import { size, spacing } from '@/theme/tokens';
import { usePalette } from '@/theme/usePalette';

type ToggleRowProps = {
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/**
 * Fila con el interruptor nativo (SwiftUI en iOS). El título es la etiqueta del propio
 * interruptor, así VoiceOver lo lee junto con su estado.
 */
export function ToggleRow({ title, value, onValueChange, disabled }: ToggleRowProps) {
  const theme = usePalette();

  return (
    <View style={styles.row}>
      <Host matchContents={{ vertical: true }} seedColor={theme.switchOn} style={styles.host}>
        <Switch label={title} value={value} onValueChange={onValueChange} disabled={disabled} />
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.touch,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  host: { alignSelf: 'stretch' },
});
