import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export interface QrPayload {
  orderId: string;
  shortCode: string;
}

const signature = (body: string, secret: string) =>
  createHmac('sha256', secret).update(body).digest();

/** Contenido del QR: `datos.firma`, en base64url. Es determinista para un pedido. */
export function signQr({ orderId, shortCode }: QrPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify({ orderId, shortCode })).toString('base64url');
  return `${body}.${signature(body, secret).toString('base64url')}`;
}

/** Devuelve los datos solo si la firma es válida. */
export function verifyQr(token: string, secret: string): QrPayload | null {
  const [body, mac, ...rest] = token.split('.');
  if (!body || !mac || rest.length > 0) return null;

  const expected = signature(body, secret);
  const received = Buffer.from(mac, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const { orderId, shortCode } = JSON.parse(Buffer.from(body, 'base64url').toString());
    return typeof orderId === 'string' && typeof shortCode === 'string'
      ? { orderId, shortCode }
      : null;
  } catch {
    return null;
  }
}

/** Lo que se guarda en la base: nunca el token completo. */
export function hashQr(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
