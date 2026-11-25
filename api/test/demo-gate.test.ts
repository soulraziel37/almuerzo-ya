import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import type { PrismaClient } from '../src/generated/prisma/client';
import { buildServer } from '../src/server';

const base = { JWT_SECRET: 'secreto-de-prueba', QR_SECRET: 'qr-de-prueba' };
const prisma = { user: { findMany: async () => [] } } as unknown as PrismaClient;

const server = (env: Record<string, string> = {}) =>
  buildServer({ prisma, config: loadConfig({ ...base, ...env }), checkDb: async () => 1 });

type Server = Awaited<ReturnType<typeof server>>;
const users = (app: Server, code?: string) =>
  app.inject({ url: '/auth/mock/users', headers: code ? { 'x-demo-code': code } : {} });

describe('clave de demo', () => {
  it('sin clave configurada no pide nada', async () => {
    const app = await server();
    expect((await users(app)).statusCode).toBe(200);
  });

  it('exige la clave correcta para listar usuarios e iniciar sesión', async () => {
    const app = await server({ DEMO_ACCESS_CODE: 'almuerzo-demo' });

    expect((await users(app)).json().code).toBe('demo_code');
    expect((await users(app, 'otra-clave')).statusCode).toBe(401);
    expect((await users(app, 'almuerzo-demo')).statusCode).toBe(200);
    for (const url of ['/auth/mock/login', '/auth/operator/login']) {
      const res = await app.inject({ method: 'POST', url, payload: {} });
      expect(res.json().code).toBe('demo_code');
    }
    expect((await app.inject({ url: '/health' })).statusCode).toBe(200);
  });

  it('bloquea tras demasiados intentos fallidos', async () => {
    const app = await server({
      DEMO_ACCESS_CODE: 'almuerzo-demo',
      AUTH_RATE_LIMIT_PER_MINUTE: '100',
    });
    for (let i = 0; i < 20; i++) await users(app, 'mala');
    expect((await users(app, 'almuerzo-demo')).statusCode).toBe(429);
  });

  it('publicada en Render no arranca sin clave', () => {
    expect(() => loadConfig({ ...base, RENDER: 'true' })).toThrow(/DEMO_ACCESS_CODE/);
    const published = { RENDER: 'true', DEMO_ACCESS_CODE: 'almuerzo-demo' };
    expect(() => loadConfig({ ...base, ...published })).toThrow(/JWT_SECRET/);
    const strong = { JWT_SECRET: 'a'.repeat(40), QR_SECRET: 'b'.repeat(40) };
    expect(() => loadConfig({ ...published, ...strong })).not.toThrow();
    expect(loadConfig({ ...base, DEMO_ACCESS_CODE: '' }).DEMO_ACCESS_CODE).toBeUndefined();
  });
});
