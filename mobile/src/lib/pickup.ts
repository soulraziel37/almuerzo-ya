import type { Order } from '@/api/types';

/** Se asume que el teléfono está en la hora del casino. */
const at = (date: string, time: string) => new Date(`${date}T${time}:00`).getTime();

function duration(ms: number): string {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return rest ? `${Math.floor(minutes / 60)} h ${rest} min` : `${minutes / 60} h`;
}

/** Cuánto falta para el retiro de un pedido pagado. */
export function pickupHint(order: Pick<Order, 'pickup'>, now: number): string {
  const { date, time, endTime } = order.pickup;
  const start = at(date, time);
  if (now < start) return `Retiras a las ${time}, en ${duration(start - now)}.`;
  if (now < at(date, endTime)) return `Es tu hora: retira hasta las ${endTime}.`;
  return 'Tu hora ya pasó. Retíralo antes del cierre del casino.';
}

/** Cuánto falta para el cierre de reservas, o `null` si esa hora ya pasó. */
export function untilCutoff(date: string, cutoff: string, now: number): string | null {
  const left = at(date, cutoff) - now;
  return left > 0 ? duration(left) : null;
}
