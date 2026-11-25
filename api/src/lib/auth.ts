import type { FastifyRequest } from 'fastify';
import { jwtVerify, SignJWT } from 'jose';
import type { Role } from '../generated/prisma/client';
import { AppError } from './errors';

export interface Session {
  userId: string;
  role: Role;
}

const key = (secret: string) => new TextEncoder().encode(secret);

export function signSession(session: Session, secret: string): Promise<string> {
  return new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(key(secret));
}

/** Sesión del token de la petición, o `null` si falta o no es válido. */
export async function verifySession(
  request: FastifyRequest,
  secret: string,
): Promise<Session | null> {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'] });
    return { userId: payload.sub!, role: payload.role as Role };
  } catch {
    return null;
  }
}

/** Exige un token válido con uno de los roles indicados. */
export async function requireSession(
  request: FastifyRequest,
  secret: string,
  roles: Role[],
): Promise<Session> {
  if (!/^Bearer .+$/.test(request.headers.authorization ?? '')) {
    throw new AppError(401, 'no_session', 'Inicia sesión para continuar.');
  }
  const session = await verifySession(request, secret);
  if (!session) {
    throw new AppError(401, 'invalid_session', 'Tu sesión expiró. Vuelve a entrar.');
  }

  if (!roles.includes(session.role)) {
    throw new AppError(403, 'forbidden', 'No tienes permiso para esta acción.');
  }
  return session;
}
