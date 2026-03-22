import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { authGuard } from '../../middleware/auth.js';
import { pool, redis } from '../../db/index.js';
import {
  issueAuthTokens,
  revokeRefreshToken,
  userPublicProfile
} from './tokens.js';

const registerSchema = z.object({
  fullName: z.string().min(3),
  email: z.email(),
  phone: z.string().min(8),
  password: z.string().min(6),
  role: z.enum(['passenger', 'driver', 'admin'])
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20)
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [body.email, body.phone]);
    if (existing.rows[0]) return reply.code(409).send({ message: 'Email ou telefone ja cadastrado' });

    const hash = await bcrypt.hash(body.password, 10);

    const userResult = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role`,
      [body.fullName, body.email, body.phone, hash, body.role]
    );

    const user = userResult.rows[0];

    if (body.role === 'passenger') {
      await pool.query('INSERT INTO riders (user_id) VALUES ($1)', [user.id]);
    }

    if (body.role === 'driver') {
      await pool.query('INSERT INTO drivers (user_id, document_status) VALUES ($1, $2)', [user.id, 'approved']);
    }

    const tokens = await issueAuthTokens(reply, { id: user.id, role: user.role, email: user.email });
    return reply.code(201).send({
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role },
      ...tokens
    });
  });

  app.post('/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [body.email]);
    const user = result.rows[0];
    if (!user) return reply.code(401).send({ message: 'Credenciais invalidas' });

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) return reply.code(401).send({ message: 'Credenciais invalidas' });
    if (!user.is_active) return reply.code(403).send({ message: 'Usuario inativo' });

    const tokens = await issueAuthTokens(reply, { id: user.id, role: user.role, email: user.email });
    return {
      ...tokens,
      user: { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone, role: user.role }
    };
  });

  app.get('/auth/me', { preHandler: [authGuard] }, async (request, reply) => {
    const user = await userPublicProfile((request.user as { sub: string }).sub);
    if (!user) return reply.code(404).send({ message: 'Usuario nao encontrado' });
    return { user };
  });

  app.post('/auth/refresh', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);

    let decoded: any;
    try {
      decoded = await (app.jwt as any).verify(refreshToken);
    } catch {
      return reply.code(401).send({ message: 'Refresh token invalido' });
    }

    if (decoded.type !== 'refresh') {
      return reply.code(401).send({ message: 'Token invalido' });
    }

    const exists = await redis.get(`refresh:${decoded.sub}:${refreshToken}`);
    if (!exists) return reply.code(401).send({ message: 'Sessao expirada' });

    const user = await userPublicProfile(decoded.sub);
    if (!user) return reply.code(404).send({ message: 'Usuario nao encontrado' });

    await revokeRefreshToken(decoded.sub, refreshToken);
    const tokens = await issueAuthTokens(reply, { id: user.id, role: user.role, email: user.email });
    return { ...tokens, user };
  });

  app.post('/auth/logout', async (request, reply) => {
    const { refreshToken } = refreshSchema.parse(request.body);
    try {
      const decoded: any = await (app.jwt as any).verify(refreshToken);
      if (decoded.type === 'refresh') {
        await revokeRefreshToken(decoded.sub, refreshToken);
      }
    } catch {
      return reply.code(204).send();
    }
    return reply.code(204).send();
  });
}
