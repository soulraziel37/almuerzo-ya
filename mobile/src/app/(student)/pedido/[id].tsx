import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCancelOrder, useOrder, usePayOrder } from '@/api/queries';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QrTicket } from '@/components/QrTicket';
import { Screen } from '@/components/Screen';
import { clp, longDate, orderStatus } from '@/lib/format';
import { colors, radius, spacing, type } from '@/theme/tokens';

/** Tiempo restante hasta `until`, como `14:05`. */
function useCountdown(until: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!until) return null;
  const seconds = Math.max(0, Math.round((Date.parse(until) - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, error } = useOrder(id);
  const cancel = useCancelOrder();
  const pay = usePayOrder();
  const remaining = useCountdown(order?.expiresAt);
  const [confirming, setConfirming] = useState(false);

  if (!order) {
    return (
      <Screen>
        <Notice error={!!error}>{error?.message ?? 'Cargando tu pedido…'}</Notice>
      </Screen>
    );
  }

  const pending = order.status === 'pending_payment';

  return (
    <Screen>
      <View style={styles.ticket}>
        <Text style={[styles.status, pending && styles.pending]}>{orderStatus[order.status]}</Text>
        {order.qrToken ? <QrTicket value={order.qrToken} /> : null}
        <Text accessibilityLabel={`Código ${order.shortCode}`} style={styles.code}>
          {order.shortCode}
        </Text>
        {pending ? <Text style={styles.detail}>Reservado por {remaining} minutos más</Text> : null}
        {order.qrToken ? (
          <Text style={styles.detail}>Sube el brillo de la pantalla para escanear más rápido.</Text>
        ) : null}
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
        <Notice>Se acabó el tiempo para pagar. El stock quedó disponible nuevamente.</Notice>
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
          <PrimaryButton
            title={confirming ? 'Confirmar cancelación' : 'Cancelar pedido'}
            variant="soft"
            loading={cancel.isPending}
            disabled={pay.isPending}
            onPress={() => (confirming ? cancel.mutate(order.id) : setConfirming(true))}
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
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  status: { ...type.headline, color: colors.accent },
  pending: { color: colors.warning },
  code: { ...type.largeTitle, color: colors.label, fontVariant: ['tabular-nums'] },
  detail: { ...type.subhead, color: colors.secondaryLabel },
  total: { ...type.headline, color: colors.label },
});
