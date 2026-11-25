import cors from '@fastify/cors';
import Fastify, { type FastifyServerOptions } from 'fastify';
import { healthRoutes } from './routes/health';

export interface ServerDeps {
  checkDb: () => PromiseLike<unknown>;
}

export async function buildServer(deps: ServerDeps, options: FastifyServerOptions = {}) {
  const app = Fastify(options);
  // Prototipo en red local: la vista web de Expo llama desde otro puerto.
  await app.register(cors, { origin: true });
  healthRoutes(app, deps.checkDb);
  return app;
}
