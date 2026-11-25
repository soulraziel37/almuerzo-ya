import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { PressableScale } from '@/components/PressableScale';
import { palette } from '@/theme/palette';
import { radius, spacing, type } from '@/theme/tokens';

type QrTicketProps = { value: string; code: string };

/**
 * Código QR de retiro. El margen blanco es necesario para que la cámara lo lea; al tocarlo se
 * muestra a pantalla completa sobre blanco, que se lee mejor.
 */
export function QrTicket({ value, code }: QrTicketProps) {
  const [large, setLarge] = useState(false);
  const { width, height } = useWindowDimensions();

  const qr = (side: number) => (
    <QRCode value={value} size={side} color={palette.light.label} backgroundColor={palette.light.card} />
  );

  return (
    <>
      <PressableScale
        accessibilityRole="imagebutton"
        accessibilityLabel="Código QR de retiro. Toca para ampliarlo"
        onPress={() => setLarge(true)}
        style={styles.box}>
        {qr(210)}
      </PressableScale>

      <Modal visible={large} animationType="fade" onRequestClose={() => setLarge(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar el código ampliado"
          onPress={() => setLarge(false)}
          style={styles.full}>
          {qr(Math.min(width - 48, height - 220, 520))}
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.hint}>Toca para cerrar</Text>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.md, backgroundColor: palette.light.card, borderRadius: radius.tile },
  full: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: palette.light.card,
  },
  code: { ...type.largeTitle, color: palette.light.label, fontVariant: ['tabular-nums'] },
  hint: { ...type.subhead, color: palette.light.secondaryLabel },
});
