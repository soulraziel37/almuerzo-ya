import { createPrisma } from './lib/db';
import { buildServer } from './server';

const prisma = createPrisma();
const app = await buildServer({ checkDb: () => prisma.$queryRaw`SELECT 1` }, { logger: true });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  });
}

await app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
