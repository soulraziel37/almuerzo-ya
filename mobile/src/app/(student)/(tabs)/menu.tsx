import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTodayMenu } from '@/api/queries';
import { MenuCard } from '@/components/MenuCard';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { longDate } from '@/lib/format';
import { useCart } from '@/store/cart';
import { colors, spacing, type } from '@/theme/tokens';

export default function MenuScreen() {
  const { data, error, isPending } = useTodayMenu();
  const cartDate = useCart((s) => s.date);
  const cartItems = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const [selectedId, setSelectedId] = useState<string>();

  const available = data?.menus.filter((m) => m.salesOpen && m.available > 0) ?? [];
  const selected = available.find((m) => m.id === selectedId) ?? available[0];
  const items = data && cartDate === data.date ? cartItems : {};
  const inCart = selected ? (items[selected.id] ?? 0) : 0;
  const total = Object.values(items).reduce((sum, qty) => sum + qty, 0);
  const atMax = !!data && !!selected && inCart >= Math.min(data.maxPerMenu, selected.available);

  // Al agregar al carrito aparece "Ver carrito" al final: se desplaza para mostrarlo.
  return (
    <Screen title="Menú del día" revealEnd={total}>
      {isPending ? <Notice>Cargando el menú…</Notice> : null}
      {error ? <Notice error>{error.message}</Notice> : null}

      {data ? (
        <>
          <View style={styles.info}>
            <Text style={styles.date}>{longDate(data.date)}</Text>
            <Text style={styles.detail}>
              {data.reservationsOpen
                ? `Reservas hasta las ${data.cutoff}`
                : `Las reservas cerraron a las ${data.cutoff}`}
            </Text>
            <Text style={styles.detail}>Retiro de 12:00 a 15:00 · Casino central</Text>
          </View>

          {data.menus.length === 0 ? <Notice>Hoy no hay menús publicados.</Notice> : null}
          {data.menus.map((menu) => (
            <MenuCard
              key={menu.id}
              menu={menu}
              selected={menu.id === selected?.id}
              onSelect={() => setSelectedId(menu.id)}
            />
          ))}

          {selected && data.reservationsOpen ? (
            <PrimaryButton
              title={atMax ? 'Máximo en el carrito' : `Agregar Menú ${selected.slot} al carrito`}
              disabled={atMax}
              onPress={() => setQty(data.date, selected.id, inCart + 1)}
            />
          ) : null}
          {total > 0 ? (
            <PrimaryButton
              title={`Ver carrito (${total})`}
              variant="soft"
              onPress={() => router.push('/carrito')}
            />
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { gap: spacing.xs },
  date: { ...type.headline, color: colors.label },
  detail: { ...type.subhead, color: colors.secondaryLabel },
});
