import Fastify, { type FastifyError, type FastifyServerOptions } from 'fastify';
import { ZodError } from 'zod';
import type { Config } from './config';
import type { PrismaClient } from './generated/prisma/client';
import { AppError } from './lib/errors';
import { registerSecurity } from './lib/security';
import { authRoutes } from './routes/auth';
import { healthRoutes } from './routes/health';
import { operatorRoutes } from './routes/operator';
import { studentRoutes } from './routes/student';

export interface ServerDeps {
  prisma: PrismaClient;
  config: Config;
  checkDb: () => PromiseLike<unknown>;
  /** Reloj inyectable para los tests. */
  now?: () => Date;
  /** Carpeta de las fotos de platos. */
  uploadsDir?: string;
}

export async function buildServer(deps: ServerDeps, options: FastifyServerOptions = {}) {
  // Cuerpos pequeños por defecto; solo las rutas con foto aceptan más.
  const app = Fastify({ bodyLimit: 32 * 1024, ...options });
  await registerSecurity(app, deps.config);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ code: error.code, message: error.message });
    }
    if (error instanceof ZodError) {
      return reply.code(400).send({ code: 'invalid_request', message: 'Datos inválidos.' });
    }
    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ code: 'bad_request', message: error.message });
    }
    request.log.error(error);
    return reply
      .code(500)
      .send({ code: 'internal', message: 'Algo salió mal. Intenta de nuevo.' });
  });

  healthRoutes(app, deps.checkDb);
  authRoutes(app, deps);
  studentRoutes(app, deps);
  operatorRoutes(app, deps);
  return app;
}
