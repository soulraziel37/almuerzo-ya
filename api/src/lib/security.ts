import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import type { Config } from '../config';
import { AppError } from './errors';

const WINDOW = '1 minute';

/** Límite más estricto para las rutas de inicio de sesión. */
export const authLimit = (config: Config) => ({
  config: { rateLimit: { max: config.AUTH_RATE_LIMIT_PER_MINUTE, timeWindow: WINDOW } },
});

/** Confía solo en los primeros `hops` proxies; con 0 no se confía en ninguno. */
export const trustHops = (hops: number) => (_address: string, hop: number) => hop < hops;

/** Cabeceras de seguridad, orígenes permitidos y límite de peticiones por IP. */
export async function registerSecurity(app: FastifyInstance, config: Config) {
  await app.register(helmet, {
    // Las fotos de los platos se muestran en la web, que corre en otro origen.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // La app nativa no envía `Origin`. Para navegadores se puede cerrar la lista con
  // CORS_ORIGINS; sin ella (uso local) se acepta cualquiera. No se usan cookies.
  await app.register(cors, {
    origin: config.CORS_ORIGINS ?? true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH'],
  });

  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_PER_MINUTE,
    timeWindow: WINDOW,
    // El monitor de salud no debe consumir el cupo ni ser rechazado.
    allowList: (request) => request.url === '/health',
    errorResponseBuilder: () =>
      new AppError(429, 'too_many_requests', 'Demasiadas peticiones. Espera un momento.'),
  });
}
