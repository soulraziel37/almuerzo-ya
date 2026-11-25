import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import type { PrismaClient } from '../src/generated/prisma/client';
import { buildServer } from '../src/server';

const deps = {
  prisma: {} as PrismaClient,
  config: loadConfig({ JWT_SECRET: 'secreto-de-prueba' }),
};

describe('GET /health', () => {
  it('responde ok cuando la base de datos contesta', async () => {
    const app = await buildServer({ ...deps, checkDb: async () => 1 });
    const res = await app.inject({ url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('responde 503 si la base de datos no está disponible', async () => {
    const app = await buildServer({
      ...deps,
      checkDb: async () => {
        throw new Error('sin conexión');
      },
    });
    const res = await app.inject({ url: '/health' });
    expect(res.statusCode).toBe(503);
  });
});
