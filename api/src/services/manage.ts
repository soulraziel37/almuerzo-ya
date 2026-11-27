import type { Config } from '../config';
import { Prisma, type Menu, type PrismaClient } from '../generated/prisma/client';
import { dateColumn, localDate, workWeek } from '../lib/dates';
import { AppError } from '../lib/errors';
import { savePhoto } from '../lib/uploads';
import { releaseOrder } from './orders';

export type MenuState = 'published' | 'scheduled' | 'closed';

/** El estado visible depende del día: un menú programado queda publicado al llegar su fecha. */
export function menuState(menu: Menu, today: string): MenuState {
  const date = menu.date.toISOString().slice(0, 10);
  if (menu.status === 'closed' || date < today) return 'closed';
  return date === today ? 'published' : 'scheduled';
}

const serialize = (menu: Menu, today: string) => ({
  id: menu.id,
  date: menu.date.toISOString().slice(0, 10),
  slot: menu.slot,
  name: menu.name,
  sides: menu.sides,
  isVegetarian: menu.isVegetarian,
  priceClp: menu.priceClp,
  photoUrl: menu.photoUrl,
  state: menuState(menu, today),
  salesOpen: menu.salesOpen,
  initialStock: menu.initialStock,
  reserved: menu.reservedCount,
  sold: menu.soldCount,
  available: Math.max(0, menu.initialStock - menu.reservedCount - menu.soldCount),
});

export async function todayStock(prisma: PrismaClient, now: Date) {
  const today = localDate(now);
  const menus = await prisma.menu.findMany({
    where: { date: dateColumn(today) },
    orderBy: { slot: 'asc' },
  });
  return { date: today, menus: menus.map((m) => serialize(m, today)) };
}

export async function updateStock(
  prisma: PrismaClient,
  id: string,
  change: { stockDelta?: number; salesOpen?: boolean },
  now: Date,
) {
  const today = localDate(now);
  const delta = change.stockDelta ?? 0;
  const salesOpen = change.salesOpen ?? null;
  // Se ajusta por diferencia y con condición: nunca queda bajo lo ya reservado o vendido.
  const updated = await prisma.$executeRaw`
    UPDATE "Menu"
    SET "initialStock" = "initialStock" + ${delta},
        "salesOpen" = COALESCE(${salesOpen}::boolean, "salesOpen")
    WHERE "id" = ${id}::uuid
      AND "date" = ${today}::date
      AND "status" <> 'closed'
      AND "initialStock" + ${delta} >= "reservedCount" + "soldCount"`;

  const menu = await prisma.menu.findUnique({ where: { id } });
  if (!menu) throw new AppError(404, 'menu_not_found', 'Ese menú no existe.');
  if (updated !== 1) {
    throw new AppError(
      409,
      'stock_rejected',
      menuState(menu, today) === 'published'
        ? 'No puede quedar bajo lo ya reservado y vendido.'
        : 'Solo se ajusta el stock de un menú abierto de hoy.',
    );
  }
  return serialize(menu, today);
}

/**
 * Cierra el día: no se vende más, se liberan las reservas sin pagar y los pedidos
 * pagados sin retirar quedan expirados (reembolso [POR DEFINIR], §4). No se deshace.
 */
export async function closeDay(prisma: PrismaClient, now: Date) {
  const date = dateColumn(localDate(now));
  await prisma.menu.updateMany({ where: { date }, data: { status: 'closed', salesOpen: false } });

  const unpaid = await prisma.order.findMany({
    where: { status: 'pending_payment', pickupSlot: { date } },
    select: { id: true },
  });
  let released = 0;
  for (const { id } of unpaid) {
    if (await releaseOrder(prisma, id, 'expired')) released++;
  }
  const notPickedUp = await prisma.order.updateMany({
    where: { status: 'paid', pickupSlot: { date } },
    data: { status: 'expired' },
  });
  return { released, notPickedUp: notPickedUp.count };
}

/**
 * Solo en modo de prueba: vuelve a abrir las ventas de hoy tras "Cerrar día". Los pedidos que
 * expiraron al cerrar siguen expirados.
 */
export async function reopenDay(prisma: PrismaClient, now: Date) {
  const date = dateColumn(localDate(now));
  const { count } = await prisma.menu.updateMany({
    where: { date, status: 'closed' },
    data: { status: 'published', salesOpen: true },
  });
  return { reopened: count };
}

export async function weekMenus(prisma: PrismaClient, config: Config, now: Date) {
  const today = localDate(now);
  const dates = workWeek(today);
  const menus = await prisma.menu.findMany({
    where: { date: { in: dates.map(dateColumn) } },
    orderBy: [{ date: 'asc' }, { slot: 'asc' }],
  });
  return {
    today,
    cutoff: config.ENFORCE_RESERVATION_WINDOW ? config.RESERVATION_CUTOFF : null,
    days: dates.map((date) => ({
      date,
      menus: menus.map((m) => serialize(m, today)).filter((m) => m.date === date),
    })),
  };
}

export interface MenuInput {
  name: string;
  sides: string;
  isVegetarian: boolean;
  priceClp: number;
  photoBase64?: string;
}

export async function createMenu(
  prisma: PrismaClient,
  uploadsDir: string,
  input: MenuInput & { date: string; slot: number; initialStock: number },
  now: Date,
) {
  const today = localDate(now);
  if (input.date < today) {
    throw new AppError(400, 'past_date', 'No se puede publicar un menú en una fecha pasada.');
  }
  const { photoBase64, date, ...data } = input;
  const taken = () =>
    new AppError(409, 'menu_exists', `Ese día ya tiene un Menú ${input.slot}.`);
  const where = { date_slot: { date: dateColumn(date), slot: input.slot } };
  if (await prisma.menu.findUnique({ where })) throw taken();

  const photoUrl = photoBase64 ? await savePhoto(uploadsDir, photoBase64) : null;
  try {
    const menu = await prisma.menu.create({
      data: {
        ...data,
        date: dateColumn(date),
        photoUrl,
        status: date === today ? 'published' : 'scheduled',
      },
    });
    return serialize(menu, today);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw taken();
    }
    throw error;
  }
}

/** Cambia el plato. El precio nuevo no afecta a los pedidos ya creados. */
export async function editMenu(
  prisma: PrismaClient,
  uploadsDir: string,
  id: string,
  input: MenuInput,
  now: Date,
) {
  const today = localDate(now);
  const current = await prisma.menu.findUnique({ where: { id } });
  if (!current) throw new AppError(404, 'menu_not_found', 'Ese menú no existe.');
  if (menuState(current, today) === 'closed') {
    throw new AppError(409, 'menu_closed', 'Un menú finalizado no se puede editar.');
  }
  const { photoBase64, ...data } = input;
  const photoUrl = photoBase64 ? await savePhoto(uploadsDir, photoBase64) : undefined;
  const menu = await prisma.menu.update({ where: { id }, data: { ...data, photoUrl } });
  return serialize(menu, today);
}
