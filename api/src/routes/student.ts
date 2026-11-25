import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireSession } from '../lib/auth';
import type { ServerDeps } from '../server';
import { todayMenu, todaySlots } from '../services/menus';
import {
  createOrder,
  expireOrders,
  getOrder,
  listOrders,
  releaseOrder,
} from '../services/orders';

const newOrderSchema = z.object({
  items: z
    .array(z.object({ menuId: z.uuid(), qty: z.number().int().positive() }))
    .min(1)
    .max(2),
  pickupSlotId: z.uuid(),
  paymentMethod: z.enum(['apple_pay', 'webpay']),
});

const idParams = z.object({ id: z.uuid() });

export function studentRoutes(app: FastifyInstance, { prisma, config, now }: ServerDeps) {
  const clock = now ?? (() => new Date());
  const student = (request: FastifyRequest) =>
    requireSession(request, config.JWT_SECRET, ['student']);
  // Antes de leer o reservar se liberan los pedidos vencidos: el stock queda al día.
  const sweep = () => expireOrders(prisma, config, clock());

  app.get('/menus/today', async (request) => {
    await student(request);
    await sweep();
    return todayMenu(prisma, config, clock());
  });

  app.get('/pickup-slots/today', async (request) => {
    await student(request);
    await sweep();
    return todaySlots(prisma, config, clock());
  });

  app.post('/orders', async (request, reply) => {
    const { userId } = await student(request);
    const input = newOrderSchema.parse(request.body);
    await sweep();
    reply.code(201);
    return createOrder(prisma, config, userId, input, clock());
  });

  app.get('/orders', async (request) => {
    const { userId } = await student(request);
    await sweep();
    return listOrders(prisma, config, userId);
  });

  app.get('/orders/:id', async (request) => {
    const { userId } = await student(request);
    const { id } = idParams.parse(request.params);
    await sweep();
    return getOrder(prisma, config, userId, id);
  });

  app.post('/orders/:id/cancel', async (request) => {
    const { userId } = await student(request);
    const { id } = idParams.parse(request.params);
    await getOrder(prisma, config, userId, id); // valida que sea suyo
    await releaseOrder(prisma, id, 'cancelled');
    return getOrder(prisma, config, userId, id);
  });
}
