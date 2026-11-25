import bcrypt from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { User } from '../generated/prisma/client';
import { signSession } from '../lib/auth';
import { demoGate } from '../lib/demo-gate';
import { AppError } from '../lib/errors';
import { authLimit } from '../lib/security';
import type { ServerDeps } from '../server';

// Se compara contra esto cuando el ID no existe, para responder en un tiempo parecido.
const DUMMY_HASH = bcrypt.hashSync('sin-usuario', 10);

export function authRoutes(app: FastifyInstance, { prisma, config }: ServerDeps) {
  const sessionFor = async (user: User) => ({
    token: await signSession({ userId: user.id, role: user.role }, config.JWT_SECRET),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });

  const gate = demoGate(config.DEMO_ACCESS_CODE);
  const limit = authLimit(config);

  const requireMock = () => {
    if (config.AUTH_MODE !== 'mock') throw new AppError(404, 'not_found', 'No disponible.');
  };

  app.get('/auth/mock/users', limit, async (request) => {
    requireMock();
    gate(request);
    return prisma.user.findMany({
      where: { role: 'student' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
  });

  app.post('/auth/mock/login', limit, async (request) => {
    requireMock();
    gate(request);
    const { userId } = z.object({ userId: z.uuid() }).parse(request.body);
    const user = await prisma.user.findFirst({ where: { id: userId, role: 'student' } });
    if (!user) throw new AppError(401, 'invalid_user', 'Ese usuario de prueba no existe.');
    return sessionFor(user);
  });

  app.post('/auth/operator/login', limit, async (request) => {
    gate(request);
    const { loginId, password } = z
      .object({ loginId: z.string().trim().min(1).max(40), password: z.string().min(1).max(100) })
      .parse(request.body);
    const user = await prisma.user.findUnique({ where: { loginId: loginId.toUpperCase() } });
    const matches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user?.passwordHash || !matches || user.role === 'student') {
      throw new AppError(401, 'invalid_credentials', 'ID o contraseña incorrectos.');
    }
    return sessionFor(user);
  });
}
