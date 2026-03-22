import type { FastifyReply, FastifyRequest } from 'fastify';

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await (request as any).jwtVerify();
  } catch {
    return reply.code(401).send({ message: 'Nao autorizado' });
  }
}

export function requireRole(roles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      await (request as any).jwtVerify();
      const role = (request.user as { role?: string } | undefined)?.role;
      if (!role || !roles.includes(role)) {
        return reply.code(403).send({ message: 'Acesso negado' });
      }
    } catch {
      return reply.code(401).send({ message: 'Nao autorizado' });
    }
  };
}
