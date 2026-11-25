import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { AppError } from './errors';

const MAX_FAILURES = 20;
const WINDOW_MS = 10 * 60_000;

const digest = (text: string) => createHash('sha256').update(text).digest();

/**
 * Candado de la demo publicada: sin la clave no se puede iniciar sesión, y los intentos
 * fallidos por dirección se limitan. Sin `code` configurado (uso local) no hace nada.
 */
export function demoGate(code: string | undefined, now: () => number = Date.now) {
  const failures = new Map<string, { count: number; since: number }>();

  return function check(request: FastifyRequest) {
    if (!code) return;

    let record = failures.get(request.ip);
    if (record && now() - record.since > WINDOW_MS) {
      failures.delete(request.ip);
      record = undefined;
    }
    if (record && record.count >= MAX_FAILURES) {
      throw new AppError(429, 'too_many_attempts', 'Demasiados intentos. Espera unos minutos.');
    }

    const header = request.headers['x-demo-code'];
    const given = typeof header === 'string' ? header : '';
    if (given && timingSafeEqual(digest(given), digest(code))) return;

    // Pedir la clave por primera vez no cuenta como intento fallido.
    if (given) {
      failures.set(request.ip, {
        count: (record?.count ?? 0) + 1,
        since: record?.since ?? now(),
      });
    }
    throw new AppError(
      401,
      'demo_code',
      given ? 'La clave de demo no es correcta.' : 'Escribe la clave de demo.',
    );
  };
}
