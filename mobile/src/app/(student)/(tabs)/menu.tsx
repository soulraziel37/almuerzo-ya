import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { useOrders } from '@/api/queries';
import { ActiveOrder } from '@/components/ActiveOrder';
import { CartBar } from '@/components/CartBar';
import { MenuCard } from '@/components/MenuCard';
import { Notice } from '@/components/Notice';
import { Rise } from '@/components/Rise';
import { Screen } from '@/components/Screen';
import { longDate } from '@/lib/format';
import { untilCutoff } from '@/lib/pickup';
import { useNow } from '@/lib/useNow';
import { useCart } from '@/store/cart';
import { useSession } from '@/store/session';
import { useCartLines } from '@/store/useCartLines';
import { colors, radius, shadow, spacing, type } from '@/theme/tokens';

export default function MenuScreen() {
  const { data, error, isPending, count, total } = useCartLines();
  const orders = useOrders();
  const items = useCart((s) => s.items);
  const cartDate = useCart((s) => s.date);
  const setQty = useCart((s) => s.setQty);
  const name = useSession((s) => s.session?.user.name.split(' ')[0]);
  const now = useNow(15_000);

  const today = (orders.data ?? []).filter((o) => data && o.pickup.date === data.date);
  const active =
    today.find((o) => o.status === 'pending_payment') ?? today.find((o) => o.status === 'paid');
  const left = data?.cutoff ? untilCutoff(data.date, data.cutoff, now) : null;

  return (
    <Screen
      title={name ? `Hola, ${name}` : 'Menú de hoy'}
      floating={count > 0 ? <CartBar count={count} total={total} /> : null}>
      {isPending ? <Notice>Cargando el menú…</Notice> : null}
      {error ? <Notice error>{error.message}</Notice> : null}

      {data ? (
        <>
          <Text style={styles.date}>{longDate(data.date)}</Text>
          {active ? <ActiveOrder order={active} /> : null}

          <View style={styles.info}>
            <View style={styles.clock}>
              <SymbolView
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={20}
                tintColor={colors.accent}
              />
            </View>
            <View style={styles.infoTexts}>
              <Text style={styles.infoTitle}>
                {!data.reservationsOpen
                  ? `Las reservas cerraron a las ${data.cutoff}`
                  : left
                    ? `Reserva hasta las ${data.cutoff} · quedan ${left}`
                    : data.cutoff
                      ? 'Reservas abiertas'
                      : 'Reservas abiertas todo el día (modo de prueba)'}
              </Text>
              <Text style={styles.detail}>Retiro de 12:00 a 15:00 · Casino central</Text>
            </View>
          </View>

          {data.menus.length === 0 ? <Notice>Hoy no hay menús publicados.</Notice> : null}
          {data.menus.map((menu, index) => {
            const qty = cartDate === data.date ? (items[menu.id] ?? 0) : 0;
            const max = Math.min(
              data.maxPerMenu,
              menu.available,
              qty + Math.max(0, data.remainingToday - count),
            );
            return (
              <Rise key={menu.id} index={index}>
                <MenuCard
                  menu={menu}
                  qty={qty}
                  max={max}
                  canAdd={data.reservationsOpen && data.remainingToday > 0}
                  onChange={(next) => setQty(data.date, menu.id, next)}
                />
              </Rise>
            );
          })}

          {data.remainingToday === 0 ? (
            <Notice>{`Ya alcanzaste el máximo de ${data.maxPerDay} almuerzos por día.`}</Notice>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { ...type.subhead, color: colors.secondaryLabel, marginTop: -spacing.md },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.separator,
    boxShadow: shadow.card,
    backgroundColor: colors.card,
  },
  clock: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  infoTexts: { flex: 1, gap: 1 },
  infoTitle: { ...type.subhead, fontWeight: '600', color: colors.label },
  detail: { ...type.footnote, color: colors.secondaryLabel },
});
