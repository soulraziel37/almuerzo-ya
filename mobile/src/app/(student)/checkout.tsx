import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCreateOrder, useSlots } from '@/api/queries';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PressableScale } from '@/components/PressableScale';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { quietestSlot, SlotPicker } from '@/components/SlotPicker';
import { clp } from '@/lib/format';
import { useCart } from '@/store/cart';
import { useCartLines } from '@/store/useCartLines';
import { colors, radius, size, spacing, type } from '@/theme/tokens';

export default function CheckoutScreen() {
  const { lines, count, total, exceeded, overDaily } = useCartLines();
  const slots = useSlots();
  const createOrder = useCreateOrder();
  const [slotId, setSlotId] = useState<string>();

  const slot = slots.data?.find((s) => s.id === slotId && s.available && s.remaining >= count);

  const quietest = quietestSlot(slots.data ?? [], count);

  const reserve = () => {
    if (!slot) return;
    createOrder.mutate(
      {
        items: lines.map((l) => ({ menuId: l.menu.id, qty: l.qty })),
        pickupSlotId: slot.id,
      },
      {
        onSuccess: (order) => {
          useCart.getState().clear();
          router.dismissAll();
          router.push({ pathname: '/pedido/[id]', params: { id: order.id } });
        },
      },
    );
  };

  return (
    <Screen>
      <GroupedList header="Tu pedido">
        {lines.map(({ menu, qty }) => (
          <ListRow
            key={menu.id}
            title={`${qty} × Menú ${menu.slot}`}
            subtitle={menu.name}
            trailing={<Text style={styles.amount}>{clp(qty * menu.priceClp)}</Text>}
          />
        ))}
      </GroupedList>

      <View style={styles.section}>
        <Text accessibilityRole="header" style={styles.header}>
          Hora de retiro
        </Text>
        {slots.error ? <Notice error>{slots.error.message}</Notice> : null}
        {quietest && quietest.id !== slot?.id ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={`Elegir la hora con menos reservas: ${quietest.time}`}
            onPress={() => setSlotId(quietest.id)}
            style={styles.tip}>
            <SymbolView
              name={{ ios: 'bolt.fill', android: 'bolt', web: 'bolt' }}
              size={18}
              tintColor={colors.warning}
            />
            <Text style={styles.tipText}>Menos fila a las {quietest.time}</Text>
            <Text style={styles.tipAction}>Elegir</Text>
          </PressableScale>
        ) : null}
        <SlotPicker slots={slots.data ?? []} needed={count} selectedId={slot?.id} onSelect={setSlotId} />
        <Text style={styles.header}>
          La barra muestra cuánto se ha reservado. Retiras en Casino central. Tienes hasta 30 min desde la hora elegida.
        </Text>
      </View>

      <GroupedList>
        <ListRow title="Total" trailing={<Text style={styles.total}>{clp(total)}</Text>} />
      </GroupedList>

      {createOrder.error ? <Notice error>{createOrder.error.message}</Notice> : null}
      <PrimaryButton
        title={slot ? `Reservar para las ${slot.time}` : 'Elige una hora de retiro'}
        disabled={!slot || count === 0 || exceeded.length > 0 || overDaily}
        loading={createOrder.isPending}
        onPress={reserve}
      />
      <Notice>Tu almuerzo queda reservado mientras confirmas el pago.</Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  header: { ...type.footnote, color: colors.secondaryLabel, paddingHorizontal: spacing.lg },
  tip: {
    minHeight: size.touch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.tile,
    backgroundColor: colors.sand,
  },
  tipText: { ...type.subhead, flex: 1, fontWeight: '600', color: colors.label },
  tipAction: { ...type.subhead, fontWeight: '600', color: colors.accent },
  amount: { ...type.body, color: colors.secondaryLabel },
  total: { ...type.headline, color: colors.label },
});
