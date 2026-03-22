import { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/auth.js';
import { pool } from '../../db/index.js';

export async function userRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: [authGuard] }, async (request) => {
    const jwtUser = request.user as { sub: string };
    const result = await pool.query(
      'SELECT id, full_name, email, phone, role, is_active, created_at FROM users WHERE id = $1',
      [jwtUser.sub]
    );
    return result.rows[0];
  });
}
