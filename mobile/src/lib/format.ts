import type { Order, OrderStatus } from '@/api/types';
import type { Tone } from '@/components/StatusPill';

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const months = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** `3500` → `$3.500` */
export function clp(amount: number): string {
  return `$${String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

/** `2026-11-24` → `Martes 24 de noviembre` */
export function longDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return `${days[date.getUTCDay()]} ${date.getUTCDate()} de ${months[date.getUTCMonth()]}`;
}

/** `2026-11-24` → `Mar 24` */
export function shortDay(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  return `${days[date.getUTCDay()]!.slice(0, 3)} ${date.getUTCDate()}`;
}

export function lunches(count: number): string {
  return `${count} ${count === 1 ? 'almuerzo' : 'almuerzos'}`;
}

const orderStatus: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Listo para retirar',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};

/** Tono de la etiqueta de estado de un pedido. */
export function orderTone(order: Pick<Order, 'status' | 'wasPaid'>): Tone {
  if (order.status === 'paid') return 'good';
  if (order.status === 'pending_payment') return 'warning';
  if (order.status === 'expired' && order.wasPaid) return 'danger';
  return 'neutral';
}

export function orderStatusLabel(order: Pick<Order, 'status' | 'wasPaid'>): string {
  return order.status === 'expired' && order.wasPaid ? 'No retirado' : orderStatus[order.status];
}
