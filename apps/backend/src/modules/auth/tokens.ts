import type { FastifyReply } from 'fastify';
import { env } from '../../config/env.js';
import { pool, redis } from '../../db/index.js';

type AuthUser = {
  id: string;
  role: string;
  email: string;
};

export async function issueAuthTokens(reply: FastifyReply, user: AuthUser) {
  const accessToken = await (reply as any).jwtSign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      type: 'access'
    },
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN
    }
  );

  const refreshToken = await (reply as any).jwtSign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
      type: 'refresh'
    },
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    }
  );

  await redis.set(
    `refresh:${user.id}:${refreshToken}`,
    '1',
    'EX',
    60 * 60 * 24 * 30
  );

  return { accessToken, refreshToken };
}

export async function revokeRefreshToken(userId: string, refreshToken: string) {
  await redis.del(`refresh:${userId}:${refreshToken}`);
}

export async function userPublicProfile(userId: string) {
  const result = await pool.query(
    'SELECT id, full_name, email, phone, role, is_active FROM users WHERE id = $1',
    [userId]
  );
  const user = result.rows[0];
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.is_active
  };
}
