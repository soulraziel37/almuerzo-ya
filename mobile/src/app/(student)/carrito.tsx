import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { API_URL } from '@/api/client';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Stepper } from '@/components/Stepper';
import { clp, lunches } from '@/lib/format';
import { useCart } from '@/store/cart';
import { useCartLines } from '@/store/useCartLines';
import { colors, radius, type } from '@/theme/tokens';

export default function CartScreen() {
  const { data, error, lines, count, subtotal, fee, total, exceeded, overDaily } = useCartLines();
  const setQty = useCart((s) => s.setQty);

  if (!data) {
    return (
      <Screen>
        <Notice error={!!error}>{error?.message ?? 'Cargando…'}</Notice>
      </Screen>
    );
  }

  if (count === 0) {
    return (
      <Screen>
        <Text accessibilityRole="header" style={styles.emptyTitle}>
          Tu carrito está vacío
        </Text>
        <Notice>{`Elige un menú antes de las ${data.cutoff} para asegurar tu almuerzo.`}</Notice>
        <PrimaryButton title="Ver menú de hoy" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <GroupedList header={`Almuerzos · ${count}`} footer="Cada pedido genera un código QR de retiro.">
        {lines.map(({ menu, qty }) => (
          <ListRow
            key={menu.id}
            title={`Menú ${menu.slot}`}
            subtitle={`${menu.name} · ${clp(menu.priceClp)}`}
            leading={
              menu.photoUrl ? (
                <Image source={`${API_URL}${menu.photoUrl}`} style={styles.thumb} contentFit="cover" />
              ) : undefined
            }
            trailing={
              <Stepper
                value={qty}
                onChange={(next) => setQty(data.date, menu.id, next)}
                max={Math.max(
                  qty,
                  Math.min(data.maxPerMenu, menu.available, qty + data.remainingToday - count),
                )}
                label={`Menú ${menu.slot}`}
              />
            }
          />
        ))}
        <ListRow title="Agregar otro menú" onPress={() => router.back()} />
      </GroupedList>

      <GroupedList header="Resumen">
        <ListRow title={`Subtotal (${count})`} trailing={<Text style={styles.amount}>{clp(subtotal)}</Text>} />
        <ListRow title="Cargo por servicio" trailing={<Text style={styles.amount}>{clp(fee)}</Text>} />
        <ListRow title="Total" trailing={<Text style={styles.total}>{clp(total)}</Text>} />
      </GroupedList>

      {exceeded.map(({ menu }) => (
        <Notice key={menu.id} error>
          {menu.salesOpen
            ? `Solo quedan ${menu.available} del Menú ${menu.slot}. Ajusta la cantidad.`
            : `Las ventas del Menú ${menu.slot} están pausadas.`}
        </Notice>
      ))}
      {overDaily ? (
        <Notice error>
          {`Hoy puedes reservar ${data.remainingToday} más (máximo ${data.maxPerDay} por día).`}
        </Notice>
      ) : null}
      {!data.reservationsOpen ? (
        <Notice error>{`Las reservas cerraron a las ${data.cutoff}.`}</Notice>
      ) : null}

      <PrimaryButton
        title={`Ir a pagar · ${lunches(count)}`}
        disabled={exceeded.length > 0 || overDaily || !data.reservationsOpen}
        onPress={() => router.push('/checkout')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyTitle: { ...type.title2, color: colors.label, textAlign: 'center' },
  thumb: { width: 52, height: 52, borderRadius: radius.tile },
  amount: { ...type.body, color: colors.secondaryLabel },
  total: { ...type.headline, color: colors.label },
});
