import type { Config } from '../config';
import type { Prisma, PrismaClient } from '../generated/prisma/client';
import { dateColumn, localDate, localTime } from '../lib/dates';
import { AppError } from '../lib/errors';
import { hashQr, verifyQr } from '../lib/qr';

const include = {
  items: { include: { menu: true }, orderBy: { menu: { slot: 'asc' } } },
  pickupSlot: true,
  user: { select: { name: true } },
} satisfies Prisma.OrderInclude;

type Record_ = Prisma.OrderGetPayload<{ include: typeof include }>;

const ticket = (order: Record_) => ({
  id: order.id,
  shortCode: order.shortCode,
  student: order.user.name,
  pickup: {
    time: localTime(order.pickupSlot.startsAt),
    endTime: localTime(order.pickupSlot.endsAt),
  },
  items: order.items.map((i) => ({ slot: i.menu.slot, name: i.menu.name, qty: i.qty })),
});

export type Verification =
  | { result: 'valid'; order: ReturnType<typeof ticket> }
  | { result: 'delivered'; message: string; order: ReturnType<typeof ticket> }
  | { result: 'invalid'; message: string };

const invalid = (message: string): Verification => ({ result: 'invalid', message });

function evaluate(order: Record_, today: string): Verification {
  if (order.status === 'delivered') {
    const when = order.deliveredAt!;
    const day = localDate(when) === today ? 'hoy' : `el ${localDate(when)}`;
    return {
      result: 'delivered',
      message: `Este pedido se entregó ${day} a las ${localTime(when)}.`,
      order: ticket(order),
    };
  }
  if (order.pickupSlot.date.toISOString().slice(0, 10) !== today) {
    return invalid('El pedido no es para hoy.');
  }
  if (order.status === 'pending_payment') return invalid('El pedido no está pagado.');
  if (order.status === 'cancelled') return invalid('El pedido fue cancelado.');
  if (order.status === 'expired') return invalid('El pedido expiró.');
  return { result: 'valid', order: ticket(order) };
}

/** Revisa un QR escaneado o un código corto, sin cambiar nada. */
export async function verifyOrder(
  prisma: PrismaClient,
  config: Config,
  input: { token?: string; code?: string },
  now: Date,
): Promise<Verification> {
  let order: Record_ | null = null;

  if (input.token) {
    const payload = verifyQr(input.token, config.QR_SECRET);
    if (!payload) return invalid('Ese código QR no es de Almuerzo Ya o fue alterado.');
    order = await prisma.order.findFirst({
      where: { shortCode: payload.shortCode, qrTokenHash: hashQr(input.token) },
      include,
    });
  } else if (input.code) {
    order = await prisma.order.findUnique({
      where: { shortCode: input.code.trim().toUpperCase() },
      include,
    });
  }

  return order ? evaluate(order, localDate(now)) : invalid('No existe un pedido con ese código.');
}

/** Canje de un solo uso: solo un UPDATE puede pasar el pedido de `paid` a `delivered`. */
export async function deliverOrder(
  prisma: PrismaClient,
  operatorId: string,
  orderId: string,
  now: Date,
) {
  const today = localDate(now);
  const changed = await prisma.order.updateMany({
    where: { id: orderId, status: 'paid', pickupSlot: { date: dateColumn(today) } },
    data: { status: 'delivered', deliveredAt: now, deliveredById: operatorId },
  });

  if (changed.count !== 1) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include });
    if (!order) throw new AppError(404, 'order_not_found', 'No encontramos ese pedido.');
    if (order.status === 'delivered') {
      throw new AppError(409, 'already_delivered', 'Ya fue entregado.');
    }
    const check = evaluate(order, today);
    throw new AppError(
      409,
      'not_deliverable',
      check.result === 'invalid' ? check.message : 'El pedido no se puede entregar.',
    );
  }
  return { deliveredAt: localTime(now) };
}

export async function daySummary(prisma: PrismaClient, now: Date) {
  const date = dateColumn(localDate(now));
  const count = (status: 'paid' | 'delivered') =>
    prisma.order.count({ where: { status, pickupSlot: { date } } });
  const [delivered, pending] = await Promise.all([count('delivered'), count('paid')]);
  return { delivered, pending };
}
