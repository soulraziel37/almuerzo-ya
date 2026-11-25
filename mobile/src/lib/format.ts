import type { OrderStatus } from '@/api/types';

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

export function lunches(count: number): string {
  return `${count} ${count === 1 ? 'almuerzo' : 'almuerzos'}`;
}

export const orderStatus: Record<OrderStatus, string> = {
  pending_payment: 'Pendiente de pago',
  paid: 'Listo para retirar',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  expired: 'Expirado',
};
