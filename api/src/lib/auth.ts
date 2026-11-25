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

/** Exige un token válido con uno de los roles indicados. */
export async function requireSession(
  request: FastifyRequest,
  secret: string,
  roles: Role[],
): Promise<Session> {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new AppError(401, 'no_session', 'Inicia sesión para continuar.');

  let session: Session;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ['HS256'] });
    session = { userId: payload.sub!, role: payload.role as Role };
  } catch {
    throw new AppError(401, 'invalid_session', 'Tu sesión expiró. Vuelve a entrar.');
  }

  if (!roles.includes(session.role)) {
    throw new AppError(403, 'forbidden', 'No tienes permiso para esta acción.');
  }
  return session;
}
