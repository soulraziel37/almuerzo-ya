import type { Config } from '../config';
import type { PrismaClient } from '../generated/prisma/client';
import { atLocalTime, dateColumn, localDate, localTime } from '../lib/dates';

export function reservationsOpen(config: Config, now: Date): boolean {
  if (!config.ENFORCE_RESERVATION_WINDOW) return true;
  return now < atLocalTime(localDate(now), config.RESERVATION_CUTOFF);
}

export async function todayMenu(prisma: PrismaClient, config: Config, now: Date) {
  const date = localDate(now);
  const menus = await prisma.menu.findMany({
    where: { date: dateColumn(date), status: { in: ['published', 'scheduled'] } },
    orderBy: { slot: 'asc' },
  });

  return {
    date,
    reservationsOpen: reservationsOpen(config, now),
    cutoff: config.RESERVATION_CUTOFF,
    serviceFeeClp: config.SERVICE_FEE_CLP,
    maxPerMenu: config.MAX_QTY_PER_MENU,
    menus: menus.map((menu) => ({
      id: menu.id,
      slot: menu.slot,
      name: menu.name,
      sides: menu.sides,
      isVegetarian: menu.isVegetarian,
      priceClp: menu.priceClp,
      salesOpen: menu.salesOpen,
      photoUrl: menu.photoUrl,
      available: Math.max(0, menu.initialStock - menu.reservedCount - menu.soldCount),
    })),
  };
}

export async function todaySlots(prisma: PrismaClient, config: Config, now: Date) {
  const slots = await prisma.pickupSlot.findMany({
    where: { date: dateColumn(localDate(now)) },
    orderBy: { startsAt: 'asc' },
  });

  return slots.map((slot) => {
    const remaining = Math.max(0, slot.capacity - slot.bookedCount);
    const past = config.ENFORCE_RESERVATION_WINDOW && slot.startsAt <= now;
    return {
      id: slot.id,
      time: localTime(slot.startsAt),
      endTime: localTime(slot.endsAt),
      remaining,
      available: remaining > 0 && !past,
    };
  });
}
