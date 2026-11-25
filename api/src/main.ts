import { loadConfig } from './config';
import { createPrisma } from './lib/db';
import { trustHops } from './lib/security';
import { buildServer } from './server';
import { expireOrders } from './services/orders';

const config = loadConfig();
const prisma = createPrisma();
const app = await buildServer(
  { prisma, config, checkDb: () => prisma.$queryRaw`SELECT 1` },
  // Detrás de un proxy la IP real llega en las cabeceras. Solo se confía en los saltos
  // indicados: confiar en toda la cadena permitiría falsificar la IP y saltarse el límite.
  { logger: true, trustProxy: trustHops(config.TRUST_PROXY_HOPS) },
);

// Además de la limpieza en cada petición, libera pedidos vencidos aunque nadie consulte.
const sweeper = setInterval(() => {
  expireOrders(prisma, config, new Date()).catch((error) => app.log.error(error));
}, 30_000);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    clearInterval(sweeper);
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
