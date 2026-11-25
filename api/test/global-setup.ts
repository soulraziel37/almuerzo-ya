import { execSync } from 'node:child_process';
import { createPrisma } from '../src/lib/db';
import { TEST_DATABASE_URL } from './test-db';

/** Crea la base de tests si falta y le aplica las migraciones. */
export default async function setup() {
  const url = new URL(TEST_DATABASE_URL);
  const name = url.pathname.slice(1);
  url.pathname = '/postgres';

  const admin = createPrisma(url.toString());
  try {
    const found = await admin.$queryRaw<unknown[]>`
      SELECT 1 FROM pg_database WHERE datname = ${name}`;
    if (found.length === 0) await admin.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  } catch (error) {
    throw new Error('No hay base de datos: ejecuta `docker compose up -d db`.', { cause: error });
  } finally {
    await admin.$disconnect();
  }

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
