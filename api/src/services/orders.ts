import { randomBytes, randomInt } from 'node:crypto';
import type { Config } from '../config';
import { Prisma, type PaymentMethod, type PrismaClient } from '../generated/prisma/client';
import { dateColumn, localDate, localTime } from '../lib/dates';
import { AppError } from '../lib/errors';
import { hashQr, signQr } from '../lib/qr';
import { lunchesToday, reservationsOpen } from './menus';

export interface NewOrder {
  items: { menuId: string; qty: number }[];
  pickupSlotId: string;
  paymentMethod: PaymentMethod;
}

const orderInclude = {
  items: { include: { menu: true }, orderBy: { menu: { slot: 'asc' } } },
  pickupSlot: true,
} satisfies Prisma.OrderInclude;

type OrderRecord = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/** Lo que ve la app: nunca incluye `qrTokenHash`. */
export function serializeOrder(order: OrderRecord, config: Config) {
  return {
    id: order.id,
    shortCode: order.shortCode,
    status: order.status,
    paymentMethod: order.paymentMethod,
    totalClp: order.totalClp,
    createdAt: order.createdAt.toISOString(),
    /** Distingue un pedido pagado y no retirado de uno que venció sin pagarse. */
    wasPaid: order.paidAt !== null,
    expiresAt:
      order.status === 'pending_payment'
        ? new Date(order.createdAt.getTime() + config.ORDER_TTL_MINUTES * 60_000).toISOString()
        : null,
    pickup: {
      date: order.pickupSlot.date.toISOString().slice(0, 10),
      time: localTime(order.pickupSlot.startsAt),
      endTime: localTime(order.pickupSlot.endsAt),
    },
    items: order.items.map((item) => ({
      menuId: item.menuId,
      slot: item.menu.slot,
      name: item.menuName,
      qty: item.qty,
      unitPriceClp: item.unitPriceClp,
    })),
  };
}

/** Código corto legible, p. ej. `A7F3-29`. */
function shortCode(): string {
  return `${randomBytes(2).toString('hex').toUpperCase()}-${String(randomInt(100)).padStart(2, '0')}`;
}

/**
 * Crea el pedido en `pending_payment` reservando stock y un cupo de retiro.
 * Cada reserva es un UPDATE condicional dentro de la transacción: si otro pedido
 * se llevó las últimas unidades, no afecta filas y todo se revierte.
 */
export async function createOrder(
  prisma: PrismaClient,
  config: Config,
  userId: string,
  input: NewOrder,
  now: Date,
) {
  if (!reservationsOpen(config, now)) {
    throw new AppError(
      409,
      'reservations_closed',
      `Las reservas de hoy cerraron a las ${config.RESERVATION_CUTOFF}.`,
    );
  }

  // Orden fijo de bloqueo para que dos pedidos simultáneos no se bloqueen entre sí.
  const items = [...input.items].sort((a, b) => a.menuId.localeCompare(b.menuId));
  if (new Set(items.map((i) => i.menuId)).size !== items.length) {
    throw new AppError(400, 'duplicated_menu', 'El pedido repite un menú.');
  }
  if (items.some((i) => i.qty > config.MAX_QTY_PER_MENU)) {
    throw new AppError(400, 'max_qty', `Máximo ${config.MAX_QTY_PER_MENU} almuerzos por menú.`);
  }

  const today = localDate(now);
  const count = items.reduce((sum, item) => sum + item.qty, 0);

  const reserve = () =>
    prisma.$transaction(async (tx) => {
      // Los pedidos de un mismo estudiante se crean de a uno: así el máximo diario no se
      // puede saltar enviando varios a la vez.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR NO KEY UPDATE`;
      const left = config.MAX_LUNCHES_PER_DAY - (await lunchesToday(tx, userId, today));
      if (count > left) {
        throw new AppError(
          409,
          'max_per_day',
          left > 0
            ? `Hoy puedes reservar hasta ${left} más (máximo ${config.MAX_LUNCHES_PER_DAY} por día).`
            : `Ya alcanzaste el máximo de ${config.MAX_LUNCHES_PER_DAY} almuerzos por día.`,
        );
      }

      let totalClp = config.SERVICE_FEE_CLP;
      const lines: { menuId: string; menuName: string; qty: number; unitPriceClp: number }[] = [];

      for (const { menuId, qty } of items) {
        const updated = await tx.$executeRaw`
          UPDATE "Menu" SET "reservedCount" = "reservedCount" + ${qty}
          WHERE "id" = ${menuId}::uuid
            AND "date" = ${today}::date
            AND "status" IN ('published', 'scheduled')
            AND "salesOpen"
            AND "initialStock" - "reservedCount" - "soldCount" >= ${qty}`;
        if (updated !== 1) {
          const menu = await tx.menu.findUnique({ where: { id: menuId } });
          throw new AppError(
            409,
            'out_of_stock',
            menu ? `No quedan suficientes de "${menu.name}".` : 'Ese menú ya no existe.',
          );
        }
        const menu = await tx.menu.findUniqueOrThrow({ where: { id: menuId } });
        lines.push({ menuId, menuName: menu.name, qty, unitPriceClp: menu.priceClp });
        totalClp += menu.priceClp * qty;
      }

      // Con la ventana activa tampoco se aceptan franjas que ya empezaron.
      const startsAfter = config.ENFORCE_RESERVATION_WINDOW ? now : new Date(0);
      const booked = await tx.$executeRaw`
        UPDATE "PickupSlot" SET "bookedCount" = "bookedCount" + ${count}
        WHERE "id" = ${input.pickupSlotId}::uuid
          AND "date" = ${today}::date
          AND "startsAt" > ${startsAfter}
          AND "bookedCount" + ${count} <= "capacity"`;
      if (booked !== 1) {
        throw new AppError(409, 'slot_full', 'Esa hora de retiro no tiene cupos para tu pedido.');
      }

      return tx.order.create({
        data: {
          shortCode: shortCode(),
          userId,
          pickupSlotId: input.pickupSlotId,
          paymentMethod: input.paymentMethod,
          totalClp,
          createdAt: now,
          items: { create: lines },
        },
        include: orderInclude,
      });
    });

  for (let attempt = 1; ; attempt++) {
    try {
      return serializeOrder(await reserve(), config);
    } catch (error) {
      // El código corto chocó con uno existente: se repite la transacción completa.
      const collision =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
      if (!collision || attempt >= 3) throw error;
    }
  }
}

/**
 * Pasa un pedido sin pagar a `expired` o `cancelled` y devuelve stock y cupo.
 * El cambio de estado condicional garantiza que se libere una sola vez.
 */
export function releaseOrder(
  prisma: PrismaClient,
  orderId: string,
  status: 'expired' | 'cancelled',
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: 'pending_payment' },
      data: { status },
    });
    if (changed.count !== 1) return false;

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { orderBy: { menuId: 'asc' } } },
    });
    for (const item of order.items) {
      await tx.menu.update({
        where: { id: item.menuId },
        data: { reservedCount: { decrement: item.qty } },
      });
    }
    await tx.pickupSlot.update({
      where: { id: order.pickupSlotId },
      data: { bookedCount: { decrement: order.items.reduce((sum, i) => sum + i.qty, 0) } },
    });
    return true;
  });
}

/**
 * Libera los pedidos que no se pagaron a tiempo y devuelve cuántos fueron. También vence los
 * pagados de días anteriores que no se retiraron, aunque nadie haya cerrado el día (§4).
 */
export async function expireOrders(prisma: PrismaClient, config: Config, now: Date) {
  const today = dateColumn(localDate(now));
  const limit = new Date(now.getTime() - config.ORDER_TTL_MINUTES * 60_000);
  const stale = await prisma.order.findMany({
    where: {
      status: 'pending_payment',
      OR: [{ createdAt: { lte: limit } }, { pickupSlot: { date: { lt: today } } }],
    },
    select: { id: true },
  });
  let expired = 0;
  for (const { id } of stale) {
    if (await releaseOrder(prisma, id, 'expired')) expired++;
  }
  await prisma.order.updateMany({
    where: { status: 'paid', pickupSlot: { date: { lt: today } } },
    data: { status: 'expired' },
  });
  return expired;
}

export async function listOrders(prisma: PrismaClient, config: Config, userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return orders.map((order) => serializeOrder(order, config));
}

/** Un pedido ajeno se responde igual que uno inexistente. */
export async function getOrder(prisma: PrismaClient, config: Config, userId: string, id: string) {
  const order = await prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
  if (!order) throw new AppError(404, 'order_not_found', 'No encontramos ese pedido.');
  return {
    ...serializeOrder(order, config),
    // El QR solo se entrega en el detalle de un pedido pagado y sin retirar.
    qrToken:
      order.status === 'paid'
        ? signQr({ orderId: order.id, shortCode: order.shortCode }, config.QR_SECRET)
        : null,
  };
}

/**
 * Pago simulado del prototipo: marca el pedido como pagado sin pasar por una pasarela.
 * La reserva pasa a venta. Repetirlo sobre un pedido ya pagado no cambia nada.
 */
export async function payOrder(
  prisma: PrismaClient,
  config: Config,
  userId: string,
  id: string,
  now: Date,
) {
  await getOrder(prisma, config, userId, id); // valida que sea suyo

  await prisma.$transaction(async (tx) => {
    // El cambio condicional compite con la expiración y la cancelación: solo uno gana.
    const changed = await tx.order.updateMany({
      where: { id, status: 'pending_payment' },
      data: { status: 'paid', paidAt: now },
    });
    if (changed.count !== 1) return;

    const order = await tx.order.findUniqueOrThrow({
      where: { id },
      include: { items: { orderBy: { menuId: 'asc' } } },
    });
    for (const item of order.items) {
      await tx.menu.update({
        where: { id: item.menuId },
        data: {
          reservedCount: { decrement: item.qty },
          soldCount: { increment: item.qty },
        },
      });
    }
    const token = signQr({ orderId: id, shortCode: order.shortCode }, config.QR_SECRET);
    await tx.order.update({ where: { id }, data: { qrTokenHash: hashQr(token) } });
    await tx.payment.create({
      data: {
        orderId: id,
        provider: order.paymentMethod,
        status: 'approved',
        amountClp: order.totalClp,
        rawResponse: { simulated: true },
        createdAt: now,
      },
    });
  });

  const result = await getOrder(prisma, config, userId, id);
  if (result.status !== 'paid' && result.status !== 'delivered') {
    throw new AppError(409, 'order_not_payable', 'Este pedido ya no se puede pagar.');
  }
  return result;
}
