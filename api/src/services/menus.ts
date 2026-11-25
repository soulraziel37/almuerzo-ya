import type { Config } from '../config';
import type { Prisma, PrismaClient } from '../generated/prisma/client';
import { atLocalTime, dateColumn, localDate, localTime } from '../lib/dates';
import { ensureSlots } from './slots';

export function reservationsOpen(config: Config, now: Date): boolean {
  if (!config.ENFORCE_RESERVATION_WINDOW) return true;
  return now < atLocalTime(localDate(now), config.RESERVATION_CUTOFF);
}

/**
 * Almuerzos que ya ocupan el máximo diario del estudiante: sin pagar, pagados y entregados,
 * además de los pagados que no se retiraron. Los cancelados o vencidos sin pagar no cuentan.
 */
export async function lunchesToday(
  db: Prisma.TransactionClient,
  userId: string,
  date: string,
): Promise<number> {
  const { _sum } = await db.orderItem.aggregate({
    _sum: { qty: true },
    where: {
      order: {
        userId,
        pickupSlot: { date: dateColumn(date) },
        OR: [
          { status: { in: ['pending_payment', 'paid', 'delivered'] } },
          { status: 'expired', paidAt: { not: null } },
        ],
      },
    },
  });
  return _sum.qty ?? 0;
}

export async function todayMenu(prisma: PrismaClient, config: Config, userId: string, now: Date) {
  const date = localDate(now);
  const [menus, taken] = await Promise.all([
    prisma.menu.findMany({
      where: { date: dateColumn(date), status: { in: ['published', 'scheduled'] } },
      orderBy: { slot: 'asc' },
    }),
    lunchesToday(prisma, userId, date),
  ]);

  return {
    date,
    reservationsOpen: reservationsOpen(config, now),
    cutoff: config.RESERVATION_CUTOFF,
    serviceFeeClp: config.SERVICE_FEE_CLP,
    maxPerMenu: config.MAX_QTY_PER_MENU,
    maxPerDay: config.MAX_LUNCHES_PER_DAY,
    remainingToday: Math.max(0, config.MAX_LUNCHES_PER_DAY - taken),
    menus: menus.map((menu) => ({
      id: menu.id,
      slot: menu.slot,
      name: menu.name,
      sides: menu.sides,
      isVegetarian: menu.isVegetarian,
      priceClp: menu.priceClp,
      salesOpen: menu.salesOpen,
      photoUrl: menu.photoUrl,
      stock: menu.initialStock,
      available: Math.max(0, menu.initialStock - menu.reservedCount - menu.soldCount),
    })),
  };
}

export async function todaySlots(prisma: PrismaClient, config: Config, now: Date) {
  const date = localDate(now);
  const find = () =>
    prisma.pickupSlot.findMany({
      where: { date: dateColumn(date) },
      orderBy: { startsAt: 'asc' },
    });
  let slots = await find();
  // El seed solo cubre la semana en que arrancó la API: después se crean al usarlas.
  if (slots.length === 0 && (await prisma.menu.count({ where: { date: dateColumn(date) } })) > 0) {
    await ensureSlots(prisma, date);
    slots = await find();
  }

  return slots.map((slot) => {
    const remaining = Math.max(0, slot.capacity - slot.bookedCount);
    const past = config.ENFORCE_RESERVATION_WINDOW && slot.startsAt <= now;
    return {
      id: slot.id,
      time: localTime(slot.startsAt),
      endTime: localTime(slot.endsAt),
      capacity: slot.capacity,
      remaining,
      available: remaining > 0 && !past,
    };
  });
}
