import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useOrders } from '@/api/queries';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { clp, orderStatus } from '@/lib/format';
import { colors, type } from '@/theme/tokens';

export default function OrdersScreen() {
  const { data, error, isPending } = useOrders();

  return (
    <Screen title="Mis pedidos">
      {isPending ? <Notice>Cargando…</Notice> : null}
      {error ? <Notice error>{error.message}</Notice> : null}
      {data?.length === 0 ? <Notice>Todavía no tienes pedidos.</Notice> : null}
      {data && data.length > 0 ? (
        <GroupedList>
          {data.map((order) => (
            <ListRow
              key={order.id}
              title={`${order.shortCode} · ${order.pickup.time}`}
              subtitle={`${order.items.map((i) => `${i.qty} × Menú ${i.slot}`).join(', ')} · ${clp(order.totalClp)}`}
              trailing={
                <Text style={[styles.status, order.status === 'pending_payment' && styles.pending]}>
                  {orderStatus[order.status]}
                </Text>
              }
              onPress={() => router.push({ pathname: '/pedido/[id]', params: { id: order.id } })}
            />
          ))}
        </GroupedList>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { ...type.footnote, color: colors.secondaryLabel, maxWidth: 90, textAlign: 'right' },
  pending: { color: colors.warning, fontWeight: '600' },
});
