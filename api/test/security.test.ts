import type { FastifyServerOptions } from 'fastify';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config';
import type { PrismaClient } from '../src/generated/prisma/client';
import { trustHops } from '../src/lib/security';
import { buildServer } from '../src/server';

const prisma = { user: { findMany: async () => [] } } as unknown as PrismaClient;

const server = (env: Record<string, string> = {}, options: FastifyServerOptions = {}) =>
  buildServer(
    {
      prisma,
      config: loadConfig({
        JWT_SECRET: 'secreto-de-prueba',
        QR_SECRET: 'qr-de-prueba',
        RATE_LIMIT_PER_MINUTE: '5',
        AUTH_RATE_LIMIT_PER_MINUTE: '2',
        ...env,
      }),
      checkDb: async () => 1,
    },
    options,
  );

type Server = Awaited<ReturnType<typeof server>>;

const get = (app: Server, url: string, ip = '10.0.0.1', headers: Record<string, string> = {}) =>
  app.inject({ url, remoteAddress: ip, headers });

describe('límite por IP', () => {
  it('rechaza el exceso sin afectar a otras direcciones', async () => {
    const app = await server();
    for (let i = 0; i < 5; i++) expect((await get(app, '/menus/today')).statusCode).toBe(401);

    const blocked = await get(app, '/menus/today');
    expect(blocked.statusCode).toBe(429);
    expect(blocked.json().code).toBe('too_many_requests');
    expect(blocked.headers['retry-after']).toBeDefined();
    expect((await get(app, '/menus/today', '10.0.0.2')).statusCode).toBe(401);
  });

  it('es más estricto al iniciar sesión', async () => {
    const app = await server();
    const codes = [];
    for (let i = 0; i < 3; i++) codes.push((await get(app, '/auth/mock/users')).statusCode);
    expect(codes).toEqual([200, 200, 429]);
  });

  it('no limita la comprobación de salud', async () => {
    const app = await server();
    for (let i = 0; i < 10; i++) expect((await get(app, '/health')).statusCode).toBe(200);
  });

  it('ignora X-Forwarded-For si no hay un proxy de confianza', async () => {
    const app = await server();
    const codes = [];
    for (let i = 0; i < 3; i++) {
      const spoof = { 'x-forwarded-for': `1.2.3.${i}` };
      codes.push((await get(app, '/auth/mock/users', '10.0.0.1', spoof)).statusCode);
    }
    expect(codes).toEqual([200, 200, 429]);
  });

  it('con un proxy solo cuenta la dirección que este agrega', async () => {
    const app = await server({}, { trustProxy: trustHops(1) });
    const codes = [];
    for (let i = 0; i < 3; i++) {
      // El cliente inventa la primera dirección; el proxy agrega la real al final.
      const spoof = { 'x-forwarded-for': `1.2.3.${i}, 200.0.0.1` };
      codes.push((await get(app, '/auth/mock/users', '10.0.0.9', spoof)).statusCode);
    }
    expect(codes).toEqual([200, 200, 429]);
  });
});

describe('protecciones generales', () => {
  it('envía cabeceras de seguridad', async () => {
    const res = await get(await server(), '/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
  });

  it('restringe los orígenes web cuando se indican', async () => {
    const app = await server({ CORS_ORIGINS: 'https://demo.example' });
    const allowed = await get(app, '/health', '10.0.0.1', { origin: 'https://demo.example' });
    expect(allowed.headers['access-control-allow-origin']).toBe('https://demo.example');
    const other = await get(app, '/health', '10.0.0.1', { origin: 'https://otro.example' });
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rechaza cuerpos demasiado grandes', async () => {
    const app = await server();
    const res = await app.inject({
      method: 'POST',
      url: '/auth/operator/login',
      payload: { loginId: 'x'.repeat(40_000), password: 'x' },
    });
    expect(res.statusCode).toBe(413);
  });
});
