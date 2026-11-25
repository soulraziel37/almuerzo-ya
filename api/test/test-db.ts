/** Base de datos exclusiva de los tests: se vacía en cada prueba. */
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://almuerzo:almuerzo@127.0.0.1:5432/almuerzo_test';

if (!new URL(TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error('TEST_DATABASE_URL debe apuntar a una base terminada en _test');
}
