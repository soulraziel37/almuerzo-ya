import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/server';

describe('GET /health', () => {
  it('responde ok cuando la base de datos contesta', async () => {
    const app = await buildServer({ checkDb: async () => 1 });
    const res = await app.inject({ url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', db: 'ok' });
  });

  it('responde 503 si la base de datos no está disponible', async () => {
    const app = await buildServer({
      checkDb: async () => {
        throw new Error('sin conexión');
      },
    });
    const res = await app.inject({ url: '/health' });
    expect(res.statusCode).toBe(503);
  });
});
