import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireSession } from '../lib/auth';
import { AppError } from '../lib/errors';
import { readPhoto } from '../lib/uploads';
import type { ServerDeps } from '../server';
import { daySummary, deliverOrder, fridgeTrays, openFridge, verifyOrder } from '../services/delivery';
import {
  closeDay,
  createMenu,
  editMenu,
  todayStock,
  updateStock,
  weekMenus,
} from '../services/manage';
import { expireOrders } from '../services/orders';

const idParams = z.object({ id: z.uuid() });

const codeOrToken = z
  .object({
    token: z.string().max(500).optional(),
    code: z.string().max(20).optional(),
  })
  .refine((v) => !!v.token !== !!v.code);

const menuFields = z.object({
  name: z.string().trim().min(3).max(80),
  sides: z.string().trim().min(1).max(160),
  isVegetarian: z.boolean(),
  priceClp: z.number().int().min(0).max(100_000),
  photoBase64: z.string().optional(),
});

const newMenu = menuFields.extend({
  date: z.iso.date(),
  slot: z.union([z.literal(1), z.literal(2)]),
  initialStock: z.number().int().min(1).max(1000),
});

// Cabe una foto de 2 MB en base64.
const PHOTO_BODY_LIMIT = 3 * 1024 * 1024;

export function operatorRoutes(app: FastifyInstance, deps: ServerDeps) {
  const { prisma, config } = deps;
  const clock = deps.now ?? (() => new Date());
  const uploads = deps.uploadsDir ?? 'uploads';
  const operator = (request: FastifyRequest) =>
    requireSession(request, config.JWT_SECRET, ['operator', 'admin']);
  const sweep = () => expireOrders(prisma, config, clock());

  app.get('/operator/summary', async (request) => {
    await operator(request);
    return daySummary(prisma, clock());
  });

  app.post('/operator/verify', async (request) => {
    await operator(request);
    const input = codeOrToken.parse(request.body);
    await sweep();
    return verifyOrder(prisma, config, input, clock());
  });

  app.post('/operator/orders/:id/deliver', async (request) => {
    const { userId } = await operator(request);
    const { id } = idParams.parse(request.params);
    return deliverOrder(prisma, userId, id, clock());
  });

  app.get('/operator/fridge', async (request) => {
    await operator(request);
    return fridgeTrays(prisma, clock());
  });

  app.post('/operator/fridge/open', async (request) => {
    const { userId } = await operator(request);
    const input = codeOrToken.parse(request.body);
    await sweep();
    return openFridge(prisma, config, userId, input, clock());
  });

  app.get('/operator/stock', async (request) => {
    await operator(request);
    await sweep();
    return todayStock(prisma, clock());
  });

  app.patch('/operator/menus/:id/stock', async (request) => {
    await operator(request);
    const { id } = idParams.parse(request.params);
    const change = z
      .object({
        stockDelta: z.number().int().min(-500).max(500).optional(),
        salesOpen: z.boolean().optional(),
      })
      .parse(request.body);
    return updateStock(prisma, id, change, clock());
  });

  app.post('/operator/close-day', async (request) => {
    await operator(request);
    return closeDay(prisma, clock());
  });

  app.get('/operator/menus', async (request) => {
    await operator(request);
    return weekMenus(prisma, config, clock());
  });

  app.post('/operator/menus', { bodyLimit: PHOTO_BODY_LIMIT }, async (request, reply) => {
    await operator(request);
    const input = newMenu.parse(request.body);
    reply.code(201);
    return createMenu(prisma, uploads, input, clock());
  });

  app.put('/operator/menus/:id', { bodyLimit: PHOTO_BODY_LIMIT }, async (request) => {
    await operator(request);
    const { id } = idParams.parse(request.params);
    return editMenu(prisma, uploads, id, menuFields.parse(request.body), clock());
  });

  // Fotos de los platos: públicas, igual que el menú impreso.
  app.get('/uploads/:name', async (request, reply) => {
    const { name } = z.object({ name: z.string() }).parse(request.params);
    const photo = await readPhoto(uploads, name);
    if (!photo) throw new AppError(404, 'not_found', 'No disponible.');
    return reply.type('image/jpeg').header('X-Content-Type-Options', 'nosniff').send(photo);
  });
}
