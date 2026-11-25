import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { signSession } from '../src/lib/auth';
import { atLocalTime, dateColumn } from '../src/lib/dates';
import { createPrisma } from '../src/lib/db';
import { buildServer } from '../src/server';
import { TEST_DATABASE_URL } from './test-db';

const prisma = createPrisma(TEST_DATABASE_URL);
const config = loadConfig({ JWT_SECRET: 'secreto-de-prueba', QR_SECRET: 'qr-de-prueba',
  // Los tests hacen muchos ingresos desde la misma dirección.
  AUTH_RATE_LIMIT_PER_MINUTE: '10000',
  RATE_LIMIT_PER_MINUTE: '10000',
});
const DATE = '2026-11-24';
const uploadsDir = await mkdtemp(path.join(tmpdir(), 'almuerzo-'));

let clock = atLocalTime(DATE, '10:00');
const app = await buildServer({
  prisma,
  config,
  uploadsDir,
  checkDb: async () => 1,
  now: () => clock,
});

type Auth = { authorization: string };
let menuId: string;
let slotId: string;
let student: Auth;
let operator: Auth;

beforeEach(async () => {
  clock = atLocalTime(DATE, '10:00');
  await prisma.$executeRaw`
    TRUNCATE "Payment", "OrderItem", "Order", "Menu", "PickupSlot", "User" CASCADE`;
  const date = dateColumn(DATE);
  menuId = (
    await prisma.menu.create({
      data: {
        date,
        slot: 1,
        name: 'Pollo con arroz',
        sides: 'Ensalada',
        priceClp: 3500,
        initialStock: 10,
        status: 'published',
      },
    })
  ).id;
  slotId = (
    await prisma.pickupSlot.create({
      data: {
        date,
        startsAt: atLocalTime(DATE, '12:00'),
        endsAt: atLocalTime(DATE, '12:30'),
        capacity: 10,
      },
    })
  ).id;
  const auth = async (role: 'student' | 'operator', name: string): Promise<Auth> => {
    const user = await prisma.user.create({
      data: { name, email: `${name}@example.edu`, role },
    });
    const token = await signSession({ userId: user.id, role }, config.JWT_SECRET);
    return { authorization: `Bearer ${token}` };
  };
  student = await auth('student', 'ana');
  operator = await auth('operator', 'olga');
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
  await rm(uploadsDir, { recursive: true, force: true });
});

async function reserve(qty = 1) {
  const res = await app.inject({
    method: 'POST',
    url: '/orders',
    headers: student,
    payload: { items: [{ menuId, qty }], pickupSlotId: slotId },
  });
  return res.json() as { id: string; shortCode: string };
}

async function paidOrder(qty = 1) {
  const { id } = await reserve(qty);
  const res = await app.inject({ method: 'POST', url: `/orders/${id}/pay`, headers: student });
  return res.json() as { id: string; shortCode: string; qrToken: string };
}

const post = (url: string, payload?: object, headers = operator) =>
  app.inject({ method: 'POST', url, headers, payload });
const verify = async (payload: object) => (await post('/operator/verify', payload)).json();
const deliver = (id: string) => post(`/operator/orders/${id}/deliver`);

describe('validar y entregar', () => {
  it('valida el QR, entrega una sola vez y avisa si ya fue entregado', async () => {
    const order = await paidOrder(2);
    expect(await verify({ token: order.qrToken })).toMatchObject({
      result: 'valid',
      order: { student: 'ana', shortCode: order.shortCode },
    });

    const results = await Promise.all([deliver(order.id), deliver(order.id)]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([200, 409]);
    expect(results.find((r) => r.statusCode === 409)!.json().code).toBe('already_delivered');

    const again = await verify({ token: order.qrToken });
    expect(again.result).toBe('delivered');
    expect(again.message).toBe('Este pedido se entregó hoy a las 10:00.');
    const summary = await app.inject({ url: '/operator/summary', headers: operator });
    expect(summary.json()).toEqual({ delivered: 1, pending: 0 });
  });

  it('acepta el código corto en minúsculas', async () => {
    const order = await paidOrder();
    const res = await verify({ code: ` ${order.shortCode.toLowerCase()} ` });
    expect(res.result).toBe('valid');
  });

  it('rechaza QR alterados, pedidos sin pagar y de otro día', async () => {
    const paid = await paidOrder();
    expect((await verify({ token: `${paid.qrToken}x` })).result).toBe('invalid');

    const pending = await reserve();
    expect((await verify({ code: pending.shortCode })).result).toBe('invalid');
    expect((await deliver(pending.id)).statusCode).toBe(409);

    clock = atLocalTime('2026-11-25', '12:00');
    expect((await verify({ token: paid.qrToken })).message).toBe('El pedido no es para hoy.');
    expect((await deliver(paid.id)).statusCode).toBe(409);
  });

  it('un estudiante no puede validar ni entregar', async () => {
    const order = await paidOrder();
    const res = await post(`/operator/orders/${order.id}/deliver`, undefined, student);
    expect(res.statusCode).toBe(403);
    expect((await post('/operator/verify', { code: 'X' }, student)).statusCode).toBe(403);
  });
});

describe('refrigerador', () => {
  const trays = async () =>
    (await app.inject({ url: '/operator/fridge', headers: operator })).json() as {
      id: string;
      student: string;
      codeEnd: string;
    }[];
  const open = async (payload: object) => (await post('/operator/fridge/open', payload)).json();

  it('muestra solo los pagados de hoy y no revela el código completo', async () => {
    const paid = await paidOrder(2);
    await reserve();
    const list = await trays();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      id: paid.id,
      student: 'ana',
      codeEnd: paid.shortCode.slice(-2),
      items: [{ slot: 1, name: 'Pollo con arroz', qty: 2, photoUrl: null }],
    });
    expect(JSON.stringify(list)).not.toContain(paid.shortCode);

    clock = atLocalTime('2026-11-25', '09:00');
    expect(await trays()).toEqual([]);
  });

  it('el QR abre una sola vez, aunque se lea dos veces a la vez', async () => {
    const paid = await paidOrder();
    const results = await Promise.all([
      open({ token: paid.qrToken }),
      open({ token: paid.qrToken }),
    ]);
    expect(results.filter((r) => r.opened)).toHaveLength(1);
    expect(results.find((r) => r.opened)).toMatchObject({ order: { id: paid.id } });
    expect(results.find((r) => !r.opened).message).toContain('entreg');
    expect(await trays()).toEqual([]);
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: paid.id } });
    expect(saved).toMatchObject({ status: 'delivered' });
    expect(saved.deliveredById).not.toBeNull();
  });

  it('no abre con un pedido sin pagar, un QR alterado ni una sesión de estudiante', async () => {
    const pending = await reserve();
    expect(await open({ code: pending.shortCode })).toEqual({
      opened: false,
      message: 'El pedido no está pagado.',
    });
    const paid = await paidOrder();
    expect((await open({ token: `${paid.qrToken}x` })).opened).toBe(false);
    const asStudent = await post('/operator/fridge/open', { token: paid.qrToken }, student);
    expect(asStudent.statusCode).toBe(403);
    expect((await app.inject({ url: '/operator/fridge', headers: student })).statusCode).toBe(403);
    expect(await trays()).toHaveLength(1);

    // El código escrito también abre.
    expect((await open({ code: paid.shortCode.toLowerCase() })).opened).toBe(true);
  });
});

describe('stock y cierre', () => {
  const patch = (payload: object) =>
    app.inject({
      method: 'PATCH',
      url: `/operator/menus/${menuId}/stock`,
      headers: operator,
      payload,
    });

  it('ajusta el stock sin bajar de lo comprometido', async () => {
    await paidOrder(2);
    await reserve(1);
    expect((await patch({ stockDelta: -7 })).json()).toMatchObject({
      initialStock: 3,
      available: 0,
    });
    expect((await patch({ stockDelta: -1 })).json().code).toBe('stock_rejected');
    expect((await patch({ stockDelta: 5 })).json().available).toBe(5);
  });

  it('pausar ventas impide reservar', async () => {
    expect((await patch({ salesOpen: false })).json().salesOpen).toBe(false);
    expect(await reserve()).toMatchObject({ code: 'out_of_stock' });
  });

  it('cerrar el día expira pendientes y no retirados', async () => {
    const paid = await paidOrder(2);
    const pending = await reserve(1);
    const res = await post('/operator/close-day');

    expect(res.json()).toEqual({ released: 1, notPickedUp: 1 });
    const orders = await prisma.order.findMany({ where: { id: { in: [paid.id, pending.id] } } });
    expect(orders.every((o) => o.status === 'expired')).toBe(true);
    const menu = await prisma.menu.findUniqueOrThrow({ where: { id: menuId } });
    expect(menu).toMatchObject({ status: 'closed', reservedCount: 0, soldCount: 2 });
    expect((await verify({ code: paid.shortCode })).message).toContain('no se retiró');
    expect((await verify({ code: pending.shortCode })).message).toBe('El pedido expiró.');
    expect((await patch({ salesOpen: true })).statusCode).toBe(409);
  });
});

describe('menús de la semana', () => {
  const dish = { name: 'Charquicán', sides: 'Pan', isVegetarian: false, priceClp: 3000 };
  const create = (extra: object) =>
    post('/operator/menus', { ...dish, date: '2026-11-25', slot: 1, initialStock: 50, ...extra });

  it('crea un menú programado y no permite duplicarlo ni usar fechas pasadas', async () => {
    expect((await create({})).json()).toMatchObject({ state: 'scheduled', available: 50 });
    expect((await create({})).json().code).toBe('menu_exists');
    expect((await create({ date: '2026-11-23' })).json().code).toBe('past_date');

    const week = await app.inject({ url: '/operator/menus', headers: operator });
    expect(week.json().days).toHaveLength(5);
    expect(week.json().days[2].menus[0].name).toBe('Charquicán');
  });

  it('edita el plato sin cambiar el total ni el nombre en pedidos existentes', async () => {
    const order = await paidOrder();
    const res = await app.inject({
      method: 'PUT',
      url: `/operator/menus/${menuId}`,
      headers: operator,
      payload: { ...dish, priceClp: 9000 },
    });
    expect(res.json()).toMatchObject({ name: 'Charquicán', priceClp: 9000 });
    const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved.totalClp).toBe(3500);
    const detail = await app.inject({ url: `/orders/${order.id}`, headers: student });
    expect(detail.json().items[0].name).toBe('Pollo con arroz');
    expect((await verify({ code: order.shortCode })).order.items[0].name).toBe('Pollo con arroz');
  });

  it('guarda la foto JPEG, la sirve y rechaza otros archivos', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const res = await create({ photoBase64: jpeg.toString('base64') });
    const photo = await app.inject({ url: res.json().photoUrl });
    expect(photo.statusCode).toBe(200);
    expect(photo.rawPayload.equals(jpeg)).toBe(true);

    const bad = await create({ slot: 2, photoBase64: Buffer.from('<html>').toString('base64') });
    expect(bad.json().code).toBe('invalid_photo');
    expect((await app.inject({ url: '/uploads/..%2Fpackage.json' })).statusCode).toBe(404);
  });
});
