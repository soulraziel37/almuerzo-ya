import type { FastifyInstance } from 'fastify';

export function healthRoutes(app: FastifyInstance, checkDb: () => PromiseLike<unknown>) {
  app.get('/health', async (request, reply) => {
    try {
      await checkDb();
      return { status: 'ok', db: 'ok' };
    } catch (error) {
      request.log.error(error);
      return reply.code(503).send({ status: 'error', db: 'unreachable' });
    }
  });
}
