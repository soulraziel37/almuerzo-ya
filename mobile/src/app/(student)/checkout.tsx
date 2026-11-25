import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useCreateOrder, useSlots } from '@/api/queries';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { SlotPicker } from '@/components/SlotPicker';
import { clp } from '@/lib/format';
import { useCart } from '@/store/cart';
import { useCartLines } from '@/store/useCartLines';
import { colors, spacing, type } from '@/theme/tokens';

export default function CheckoutScreen() {
  const { lines, count, total, exceeded } = useCartLines();
  const slots = useSlots();
  const createOrder = useCreateOrder();
  const [slotId, setSlotId] = useState<string>();

  const slot = slots.data?.find((s) => s.id === slotId && s.available);

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
        <SlotPicker slots={slots.data ?? []} selectedId={slot?.id} onSelect={setSlotId} />
        <Text style={styles.header}>
          Retiras en Casino central. Tienes hasta 30 min desde la hora elegida.
        </Text>
      </View>

      <GroupedList>
        <ListRow title="Total" trailing={<Text style={styles.total}>{clp(total)}</Text>} />
      </GroupedList>

      {createOrder.error ? <Notice error>{createOrder.error.message}</Notice> : null}
      <PrimaryButton
        title={slot ? `Reservar para las ${slot.time}` : 'Elige una hora de retiro'}
        disabled={!slot || count === 0 || exceeded.length > 0}
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
  amount: { ...type.body, color: colors.secondaryLabel },
  total: { ...type.headline, color: colors.label },
});
