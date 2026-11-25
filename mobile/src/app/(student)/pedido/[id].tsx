import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCancelOrder, useOrder, usePayOrder } from '@/api/queries';
import { Bar } from '@/components/Bar';
import { Confetti } from '@/components/Confetti';
import { ConfirmButton } from '@/components/ConfirmButton';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { OrderProgress } from '@/components/OrderProgress';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QrTicket } from '@/components/QrTicket';
import { Screen } from '@/components/Screen';
import type { OrderStatus } from '@/api/types';
import { clp, longDate, orderStatusLabel } from '@/lib/format';
import { pickupHint } from '@/lib/pickup';
import { useNow } from '@/lib/useNow';
import { brand, colors, radius, spacing, type } from '@/theme/tokens';

/** Tiempo restante, como `14:05`. */
function clock(ms: number): string {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error } = useOrder(id);
  const cancel = useCancelOrder();
  const pay = usePayOrder();
  const now = useNow();
  const [burst, setBurst] = useState(0);

  // Celebra cuando el pedido avanza con la pantalla abierta, no al abrir uno ya listo.
  const status = order?.status;
  const previous = useRef<OrderStatus>(undefined);
  useEffect(() => {
    const before = previous.current;
    previous.current = status;
    const advanced =
      (before === 'pending_payment' && status === 'paid') ||
      (before === 'paid' && status === 'delivered');
    if (advanced) setBurst((n) => n + 1);
  }, [status]);

  if (!order) {
    return (
      <Screen>
        <Notice error={!!error}>{error?.message ?? 'Cargando tu pedido…'}</Notice>
      </Screen>
    );
  }

  const pending = order.status === 'pending_payment';

  const closed = order.status === 'cancelled' || order.status === 'expired';
  const left = order.expiresAt ? Date.parse(order.expiresAt) - now : 0;
  const total = order.expiresAt ? Date.parse(order.expiresAt) - Date.parse(order.createdAt) : 1;

  return (
    <Screen>
      <View style={[styles.ticket, closed && styles.ticketOff]}>
        <View style={[styles.circle, styles.circleTop, closed && styles.circleTopOff]} />
        <View style={[styles.circle, styles.circleBottom, closed && styles.circleBottomOff]} />

        <Text accessibilityLiveRegion="polite" style={styles.status}>
          {orderStatusLabel(order)}
        </Text>
        {closed ? null : (
          <OrderProgress done={order.status === 'delivered' ? 3 : order.status === 'paid' ? 2 : 1} />
        )}

        {order.qrToken ? <QrTicket value={order.qrToken} code={order.shortCode} /> : null}
        <Text accessibilityLabel={`Código ${order.shortCode}`} style={styles.code}>
          {order.shortCode}
        </Text>

        {pending ? (
          <View style={styles.timer}>
            <Text style={styles.hint}>Reservado por {clock(left)} minutos más</Text>
            <Bar value={left / total} color={brand.text} track={brand.track} />
          </View>
        ) : null}
        {order.status === 'paid' ? (
          <>
            <Text style={styles.hintStrong}>{pickupHint(order, now)}</Text>
            <Text style={styles.hint}>Toca el código para ampliarlo.</Text>
          </>
        ) : null}
        {order.status === 'delivered' ? <Text style={styles.hintStrong}>¡Buen provecho!</Text> : null}
        <Confetti burst={burst} />
      </View>

      <GroupedList header="Retiro">
        <ListRow
          title={`${order.pickup.time} – ${order.pickup.endTime}`}
          subtitle={`${longDate(order.pickup.date)} · Casino central`}
        />
      </GroupedList>

      <GroupedList header="Detalle">
        {order.items.map((item) => (
          <ListRow
            key={item.menuId}
            title={`${item.qty} × Menú ${item.slot}`}
            subtitle={item.name}
            trailing={<Text style={styles.detail}>{clp(item.qty * item.unitPriceClp)}</Text>}
          />
        ))}
        <ListRow title="Total" trailing={<Text style={styles.total}>{clp(order.totalClp)}</Text>} />
      </GroupedList>

      {order.status === 'expired' ? (
        <Notice>
          {order.wasPaid
            ? 'Este pedido no se retiró a tiempo y su código ya no es válido. Consulta en el casino.'
            : 'Se acabó el tiempo para pagar. El stock quedó disponible nuevamente.'}
        </Notice>
      ) : null}
      {pay.error ? <Notice error>{pay.error.message}</Notice> : null}
      {cancel.error ? <Notice error>{cancel.error.message}</Notice> : null}

      {pending ? (
        <>
          <PrimaryButton
            title="Marcar como pagado"
            loading={pay.isPending}
            disabled={cancel.isPending}
            onPress={() => pay.mutate(order.id)}
          />
          <Notice>Prototipo: no se hace ningún cobro.</Notice>
          <ConfirmButton
            title="Cancelar pedido"
            question="¿Cancelar este pedido?"
            message="Se liberan tu almuerzo y tu hora de retiro."
            confirmLabel="Cancelar pedido"
            loading={cancel.isPending}
            isDisabled={pay.isPending}
            onConfirm={() => cancel.mutate(order.id)}
          />
        </>
      ) : (
        <PrimaryButton title="Volver al menú" variant="soft" onPress={() => router.dismissTo('/menu')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ticket: {
    backgroundColor: brand.base,
    borderRadius: 32,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
    overflow: 'hidden',
  },
  ticketOff: { backgroundColor: brand.muted },
  circle: { position: 'absolute', width: 320, height: 320, borderRadius: radius.pill },
  circleTop: { right: -130, top: -120, backgroundColor: brand.light },
  circleTopOff: { backgroundColor: brand.mutedLight },
  circleBottom: { left: -150, bottom: -140, backgroundColor: brand.deep },
  circleBottomOff: { backgroundColor: brand.mutedDeep },
  status: { ...type.title2, color: brand.text },
  code: { ...type.largeTitle, color: brand.text, fontVariant: ['tabular-nums'] },
  timer: { alignSelf: 'stretch', alignItems: 'center', gap: spacing.sm },
  hint: { ...type.subhead, color: brand.secondaryText, textAlign: 'center' },
  hintStrong: { ...type.headline, color: brand.text, textAlign: 'center' },
  detail: { ...type.subhead, color: colors.secondaryLabel },
  total: { ...type.headline, color: colors.label },
});
