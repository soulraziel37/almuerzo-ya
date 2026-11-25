import { router } from 'expo-router';

import { useOrders } from '@/api/queries';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { Screen } from '@/components/Screen';
import { StatusPill } from '@/components/StatusPill';
import { clp, orderStatusLabel, orderTone } from '@/lib/format';

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
                <StatusPill label={orderStatusLabel(order)} tone={orderTone(order)} />
              }
              onPress={() => router.push({ pathname: '/pedido/[id]', params: { id: order.id } })}
            />
          ))}
        </GroupedList>
      ) : null}
    </Screen>
  );
}
