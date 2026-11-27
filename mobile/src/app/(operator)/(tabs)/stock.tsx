import { StyleSheet, Text, View } from 'react-native';

import {
  useCloseDay,
  useReopenDay,
  useStock,
  useSummary,
  useUpdateStock,
  type ManagedMenu,
} from '@/api/operator';
import { ConfirmButton } from '@/components/ConfirmButton';
import { GroupedList, ListRow } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { Stats } from '@/components/Stats';
import { Stepper } from '@/components/Stepper';
import { ToggleRow } from '@/components/ToggleRow';
import { longDate } from '@/lib/format';
import { colors, radius, spacing, type } from '@/theme/tokens';

const LOW_STOCK = 10;

function stateText(menu: ManagedMenu): string {
  if (menu.state === 'closed') return 'Día cerrado';
  if (!menu.salesOpen) return 'Ventas pausadas';
  if (menu.available === 0) return 'Agotado';
  return menu.available <= LOW_STOCK ? 'Stock bajo' : 'A la venta';
}

export default function StockScreen() {
  const stock = useStock();
  const summary = useSummary();
  const update = useUpdateStock();
  const closeDay = useCloseDay();
  const reopenDay = useReopenDay();

  const menus = stock.data?.menus ?? [];
  const open = menus.some((m) => m.state !== 'closed');
  const sold = menus.reduce((sum, m) => sum + m.sold, 0);
  const error = stock.error ?? update.error ?? closeDay.error ?? reopenDay.error;
  const canReopen = !open && menus.length > 0 && !!stock.data?.canReopen;

  return (
    <Screen title="Control de stock">
      {stock.data ? (
        <Text style={styles.date}>{longDate(stock.data.date)} · Casino central</Text>
      ) : null}
      <Stats
        items={[
          { label: 'Vendidos', value: sold },
          { label: 'Entregados', value: summary.data?.delivered ?? '–' },
          { label: 'Por retirar', value: summary.data?.pending ?? '–' },
        ]}
      />
      {error ? <Notice error>{error.message}</Notice> : null}
      {stock.data && menus.length === 0 ? <Notice>Hoy no hay menús.</Notice> : null}

      {menus.map((menu) => {
        const committed = menu.reserved + menu.sold;
        const progress = menu.initialStock > 0 ? committed / menu.initialStock : 0;
        const low = menu.available <= LOW_STOCK;
        const closed = menu.state === 'closed';
        return (
          <GroupedList key={menu.id} header={`Menú ${menu.slot} · ${stateText(menu)}`}>
            <View style={styles.detail}>
              <Text style={styles.name}>{menu.name}</Text>
              <View style={styles.numbers}>
                <Text style={styles.number}>Stock {menu.initialStock}</Text>
                <Text style={styles.number}>Vendidos {menu.sold}</Text>
                <Text style={[styles.number, low && styles.low]}>Disponibles {menu.available}</Text>
              </View>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: menu.initialStock, now: committed }}
                style={styles.track}>
                <View
                  style={[styles.bar, low && styles.lowBar, { width: `${Math.min(1, progress) * 100}%` }]}
                />
              </View>
              {menu.reserved > 0 ? (
                <Text style={styles.number}>{menu.reserved} reservados sin pagar</Text>
              ) : null}
            </View>
            {closed ? null : (
              <ListRow
                title="Ajustar stock"
                trailing={
                  <Stepper
                    value={menu.initialStock}
                    min={committed}
                    max={1000}
                    label={`unidades del Menú ${menu.slot}`}
                    onChange={(next) =>
                      update.mutate({ id: menu.id, stockDelta: next - menu.initialStock })
                    }
                  />
                }
              />
            )}
            {closed ? null : (
              <ToggleRow
                title="Ventas abiertas"
                value={menu.salesOpen}
                onValueChange={(salesOpen) => update.mutate({ id: menu.id, salesOpen })}
              />
            )}
          </GroupedList>
        );
      })}

      {closeDay.data ? (
        <Notice>{`Día cerrado. Reservas liberadas: ${closeDay.data.released}. Pedidos sin retirar: ${closeDay.data.notPickedUp}.`}</Notice>
      ) : null}
      {open ? (
        <ConfirmButton
          title="Cerrar día"
          question="¿Cerrar el día?"
          message="No se puede deshacer: se detienen las ventas y los pedidos sin retirar expiran."
          confirmLabel="Cerrar día"
          loading={closeDay.isPending}
          onConfirm={() => closeDay.mutate(undefined)}
        />
      ) : null}
      {canReopen ? (
        <PrimaryButton
          title="Reabrir día (modo de prueba)"
          variant="soft"
          loading={reopenDay.isPending}
          onPress={() => reopenDay.mutate(undefined, { onSuccess: () => closeDay.reset() })}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  date: { ...type.subhead, color: colors.secondaryLabel },
  detail: { padding: spacing.lg, gap: spacing.sm },
  name: { ...type.headline, color: colors.label },
  numbers: { flexDirection: 'row', justifyContent: 'space-between' },
  number: { ...type.footnote, color: colors.secondaryLabel },
  low: { color: colors.warning, fontWeight: '600' },
  track: { height: 8, borderRadius: radius.pill, backgroundColor: colors.bg, overflow: 'hidden' },
  bar: { height: 8, backgroundColor: colors.switchOn },
  lowBar: { backgroundColor: colors.warning },
});
