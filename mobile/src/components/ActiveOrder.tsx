import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import type { Order } from '@/api/types';
import { PressableScale } from '@/components/PressableScale';
import { pickupHint } from '@/lib/pickup';
import { useNow } from '@/lib/useNow';
import { brand, radius, spacing, type } from '@/theme/tokens';

/** Acceso directo al pedido de hoy, sin pasar por "Mis pedidos". */
export function ActiveOrder({ order }: { order: Order }) {
  const now = useNow(15_000);
  const pending = order.status === 'pending_payment';
  const title = pending ? 'Tienes un pedido sin pagar' : 'Tu almuerzo te espera';
  const detail = pending ? 'Confírmalo antes de que se libere.' : pickupHint(order, now);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail} Ver pedido ${order.shortCode}`}
      onPress={() => router.push({ pathname: '/pedido/[id]', params: { id: order.id } })}
      style={styles.card}>
      <View style={styles.circle} />
      <View style={styles.icon}>
        <SymbolView
          name={{ ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' }}
          size={26}
          tintColor={brand.base}
        />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
        tintColor={brand.text}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: brand.base,
  },
  circle: {
    position: 'absolute',
    right: -50,
    top: -70,
    width: 180,
    height: 180,
    borderRadius: radius.pill,
    backgroundColor: brand.light,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.text,
  },
  texts: { flex: 1, gap: 2 },
  title: { ...type.headline, color: brand.text },
  detail: { ...type.subhead, color: brand.secondaryText },
});
