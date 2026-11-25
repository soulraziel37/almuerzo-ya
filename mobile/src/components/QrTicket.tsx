import { StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { colors, spacing } from '@/theme/tokens';

/** Código QR de retiro. El margen blanco es necesario para que la cámara lo lea. */
export function QrTicket({ value }: { value: string }) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Código QR de retiro" style={styles.box}>
      <QRCode value={value} size={220} color={colors.label} backgroundColor={colors.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.md, backgroundColor: colors.card },
});
