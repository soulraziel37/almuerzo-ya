import bcrypt from 'bcryptjs';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import { atLocalTime, dateColumn } from '../src/lib/dates';
import { createPrisma } from '../src/lib/db';
import { hashQr, verifyQr } from '../src/lib/qr';
import { buildServer } from '../src/server';
import { expireOrders } from '../src/services/orders';
import { TEST_DATABASE_URL } from './test-db';

const prisma = createPrisma(TEST_DATABASE_URL);
const config = loadConfig({ JWT_SECRET: 'secreto-de-prueba', QR_SECRET: 'qr-de-prueba',
  // Los tests hacen muchos ingresos desde la misma dirección.
  AUTH_RATE_LIMIT_PER_MINUTE: '10000',
  RATE_LIMIT_PER_MINUTE: '10000',
});
const DATE = '2026-11-24';

let clock = atLocalTime(DATE, '10:00');
const app = await buildServer({
  prisma,
  config,
  checkDb: async () => 1,
  now: () => clock,
});

let ids: { menu: string; slot: string; ana: string; beto: string };

beforeEach(async () => {
  clock = atLocalTime(DATE, '10:00');
  await prisma.$executeRaw`
    TRUNCATE "Payment", "OrderItem", "Order", "Menu", "PickupSlot", "User" CASCADE`;
  const date = dateColumn(DATE);
  const menu = await prisma.menu.create({
    data: {
      date,
      slot: 1,
      name: 'Pollo con arroz',
      sides: 'Ensalada',
      priceClp: 3500,
      initialStock: 5,
      status: 'published',
    },
  });
  const slot = await prisma.pickupSlot.create({
    data: {
      date,
      startsAt: atLocalTime(DATE, '12:00'),
      endsAt: atLocalTime(DATE, '12:30'),
      capacity: 3,
    },
  });
  const student = (name: string) =>
    prisma.user.create({ data: { name, email: `${name}@example.edu`, role: 'student' } });
  const [ana, beto] = [await student('ana'), await student('beto')];
  await prisma.user.create({
    data: {
      name: 'Operador',
      email: 'op@example.edu',
      role: 'operator',
      loginId: 'OP-0001',
      passwordHash: await bcrypt.hash('clave-de-prueba', 4),
    },
  });
  ids = { menu: menu.id, slot: slot.id, ana: ana.id, beto: beto.id };
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

async function login(userId: string) {
  const res = await app.inject({ method: 'POST', url: '/auth/mock/login', payload: { userId } });
  return { authorization: `Bearer ${res.json().token}` };
}

function order(headers: { authorization: string }, qty = 1, extra: object = {}) {
  return app.inject({
    method: 'POST',
    url: '/orders',
    headers,
    payload: {
      items: [{ menuId: ids.menu, qty }],
      pickupSlotId: ids.slot,
      paymentMethod: 'webpay',
      ...extra,
    },
  });
}

const stock = () => prisma.menu.findUniqueOrThrow({ where: { id: ids.menu } });
const booked = async () =>
  (await prisma.pickupSlot.findUniqueOrThrow({ where: { id: ids.slot } })).bookedCount;

describe('reserva de stock', () => {
  it('crea el pedido pendiente, calcula el total y baja el stock', async () => {
    const ana = await login(ids.ana);
    const res = await order(ana, 2);

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ status: 'pending_payment', totalClp: 7000 });
    expect(res.json().shortCode).toMatch(/^[0-9A-F]{4}-\d{2}$/);
    expect(res.json()).not.toHaveProperty('qrTokenHash');
    expect((await stock()).reservedCount).toBe(2);
    expect(await booked()).toBe(1);

    const menu = await app.inject({ url: '/menus/today', headers: ana });
    expect(menu.json().menus[0].available).toBe(3);
  });

  it('no sobrevende cuando llegan pedidos simultáneos', async () => {
    await prisma.pickupSlot.update({ where: { id: ids.slot }, data: { capacity: 20 } });
    const ana = await login(ids.ana);
    const results = await Promise.all(Array.from({ length: 8 }, () => order(ana, 1)));

    expect(results.filter((r) => r.statusCode === 201)).toHaveLength(5);
    expect(results.filter((r) => r.json().code === 'out_of_stock')).toHaveLength(3);
    expect((await stock()).reservedCount).toBe(5);
    expect(await booked()).toBe(5);
  });

  it('respeta el cupo de la franja y revierte la reserva', async () => {
    await prisma.pickupSlot.update({ where: { id: ids.slot }, data: { capacity: 1 } });
    await order(await login(ids.ana), 1);
    const res = await order(await login(ids.beto), 2);

    expect(res.json().code).toBe('slot_full');
    expect((await stock()).reservedCount).toBe(1);
  });

  it('rechaza más del máximo por menú y las ventas pausadas', async () => {
    const ana = await login(ids.ana);
    expect((await order(ana, 6)).json().code).toBe('max_qty');

    await prisma.menu.update({ where: { id: ids.menu }, data: { salesOpen: false } });
    expect((await order(ana, 1)).json().code).toBe('out_of_stock');
  });

  it('cierra las reservas a las 11:30', async () => {
    clock = atLocalTime(DATE, '11:30');
    const res = await order(await login(ids.ana));
    expect(res.json().code).toBe('reservations_closed');
  });
});

describe('liberación de stock', () => {
  it('expira a los 15 minutos y devuelve stock y cupo una sola vez', async () => {
    const ana = await login(ids.ana);
    const { id } = (await order(ana, 3)).json();

    clock = atLocalTime(DATE, '10:14');
    expect(await expireOrders(prisma, config, clock)).toBe(0);

    clock = atLocalTime(DATE, '10:15');
    const counts = await Promise.all([
      expireOrders(prisma, config, clock),
      expireOrders(prisma, config, clock),
    ]);
    expect(counts[0]! + counts[1]!).toBe(1);
    expect((await stock()).reservedCount).toBe(0);
    expect(await booked()).toBe(0);

    const res = await app.inject({ url: `/orders/${id}`, headers: ana });
    expect(res.json()).toMatchObject({ status: 'expired', expiresAt: null });
  });

  it('cancelar devuelve el stock y repetirlo no resta dos veces', async () => {
    const ana = await login(ids.ana);
    const { id } = (await order(ana, 2)).json();
    const cancel = () => app.inject({ method: 'POST', url: `/orders/${id}/cancel`, headers: ana });

    expect((await cancel()).json().status).toBe('cancelled');
    await cancel();
    expect((await stock()).reservedCount).toBe(0);
    expect(await booked()).toBe(0);
  });
});

describe('pago simulado', () => {
  const pay = (headers: { authorization: string }, id: string) =>
    app.inject({ method: 'POST', url: `/orders/${id}/pay`, headers });

  it('marca pagado, pasa la reserva a venta y entrega un QR firmado', async () => {
    const ana = await login(ids.ana);
    const { id, shortCode } = (await order(ana, 2)).json();
    const res = await pay(ana, id);

    expect(res.json()).toMatchObject({ status: 'paid', expiresAt: null });
    expect(await stock()).toMatchObject({ reservedCount: 0, soldCount: 2 });
    const { qrToken } = res.json();
    expect(verifyQr(qrToken, config.QR_SECRET)).toEqual({ orderId: id, shortCode });
    expect(verifyQr(qrToken, 'otro-secreto')).toBeNull();
    expect(verifyQr(`${qrToken}x`, config.QR_SECRET)).toBeNull();
    const saved = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(saved.qrTokenHash).toBe(hashQr(qrToken));
  });

  it('pagar dos veces a la vez no vende doble', async () => {
    const ana = await login(ids.ana);
    const { id } = (await order(ana, 2)).json();
    const results = await Promise.all([pay(ana, id), pay(ana, id)]);

    expect(results.map((r) => r.statusCode)).toEqual([200, 200]);
    expect((await stock()).soldCount).toBe(2);
    expect(await prisma.payment.count({ where: { orderId: id } })).toBe(1);
  });

  it('un pedido pagado no expira ni se puede cancelar', async () => {
    const ana = await login(ids.ana);
    const { id } = (await order(ana, 1)).json();
    await pay(ana, id);

    clock = atLocalTime(DATE, '11:00');
    expect(await expireOrders(prisma, config, clock)).toBe(0);
    const cancel = await app.inject({ method: 'POST', url: `/orders/${id}/cancel`, headers: ana });
    expect(cancel.json().status).toBe('paid');
    expect((await stock()).soldCount).toBe(1);
  });

  it('no deja pagar un pedido expirado ni uno ajeno', async () => {
    const ana = await login(ids.ana);
    const { id } = (await order(ana, 1)).json();
    expect((await pay(await login(ids.beto), id)).statusCode).toBe(404);

    clock = atLocalTime(DATE, '10:15');
    const res = await pay(ana, id);
    expect(res.json().code).toBe('order_not_payable');
    expect(await stock()).toMatchObject({ reservedCount: 0, soldCount: 0 });
  });
});

describe('acceso', () => {
  it('un estudiante no ve ni cancela pedidos ajenos', async () => {
    const { id } = (await order(await login(ids.ana))).json();
    const beto = await login(ids.beto);

    expect((await app.inject({ url: `/orders/${id}`, headers: beto })).statusCode).toBe(404);
    const cancel = await app.inject({ method: 'POST', url: `/orders/${id}/cancel`, headers: beto });
    expect(cancel.statusCode).toBe(404);
    expect((await stock()).reservedCount).toBe(1);
  });

  it('exige sesión de estudiante', async () => {
    expect((await app.inject({ url: '/menus/today' })).statusCode).toBe(401);

    const res = await app.inject({
      method: 'POST',
      url: '/auth/operator/login',
      payload: { loginId: 'op-0001', password: 'clave-de-prueba' },
    });
    expect(res.statusCode).toBe(200);
    const operator = { authorization: `Bearer ${res.json().token}` };
    expect((await app.inject({ url: '/menus/today', headers: operator })).statusCode).toBe(403);
  });

  it('rechaza una contraseña incorrecta y el ingreso mock en modo entra', async () => {
    const bad = await app.inject({
      method: 'POST',
      url: '/auth/operator/login',
      payload: { loginId: 'OP-0001', password: 'otra' },
    });
    expect(bad.statusCode).toBe(401);

    const entra = await buildServer({
      prisma,
      config: { ...config, AUTH_MODE: 'entra' },
      checkDb: async () => 1,
    });
    expect((await entra.inject({ url: '/auth/mock/users' })).statusCode).toBe(404);
    await entra.close();
  });
});
