import type { PrismaClient } from '../generated/prisma/client';
import { atLocalTime, dateColumn } from '../lib/dates';

// 6 franjas de 30 minutos entre las 12:00 y las 15:00.
const SLOT_EDGES = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'];

/** Almuerzos por franja. Valor de prueba: [POR DEFINIR] con el casino (§4). */
const SLOT_CAPACITY = 40;

/** Crea las franjas de un día si faltan; las que ya existen no se tocan. */
export async function ensureSlots(prisma: PrismaClient, date: string): Promise<void> {
  await prisma.pickupSlot.createMany({
    data: SLOT_EDGES.slice(0, -1).map((start, i) => ({
      date: dateColumn(date),
      startsAt: atLocalTime(date, start),
      endsAt: atLocalTime(date, SLOT_EDGES[i + 1]!),
      capacity: SLOT_CAPACITY,
    })),
    skipDuplicates: true,
  });
}
