import { useTodayMenu } from '@/api/queries';
import { useCart } from '@/store/cart';

/** El carrito cruzado con el menú vigente: precios y stock vienen siempre de la API. */
export function useCartLines() {
  const query = useTodayMenu();
  const date = useCart((s) => s.date);
  const items = useCart((s) => s.items);
  const menu = query.data;

  const lines = (menu && date === menu.date ? menu.menus : [])
    .filter((m) => (items[m.id] ?? 0) > 0)
    .map((m) => ({ menu: m, qty: items[m.id]! }));

  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.qty * line.menu.priceClp, 0);
  const fee = count > 0 ? (menu?.serviceFeeClp ?? 0) : 0;
  // El stock pudo bajar después de agregar al carrito.
  const exceeded = lines.filter((l) => !l.menu.salesOpen || l.qty > l.menu.available);

  const overDaily = !!menu && count > menu.remainingToday;

  return { ...query, lines, count, subtotal, fee, total: subtotal + fee, exceeded, overDaily };
}
