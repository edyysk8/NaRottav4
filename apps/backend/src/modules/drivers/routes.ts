import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authGuard, requireRole } from '../../middleware/auth.js';
import { pool, redis } from '../../db/index.js';

const onlineSchema = z.object({ status: z.enum(['online', 'offline']) });
const locationSchema = z.object({ lat: z.number(), lng: z.number(), heading: z.number().optional(), speedKmh: z.number().optional() });

export async function driverRoutes(app: FastifyInstance) {
  app.post('/drivers/status', { preHandler: [requireRole(['driver'])] }, async (request) => {
    const body = onlineSchema.parse(request.body);
    const user = request.user as { sub: string };
    const driverResult = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [user.sub]);
    const driverId = driverResult.rows[0]?.id;
    await pool.query('UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2', [body.status, driverId]);
    await redis.hset(`driver:${driverId}:presence`, 'status', body.status);
    return { ok: true, status: body.status };
  });

  app.post('/drivers/location', { preHandler: [requireRole(['driver'])] }, async (request) => {
    const body = locationSchema.parse(request.body);
    const user = request.user as { sub: string };
    const driverResult = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [user.sub]);
    const driverId = driverResult.rows[0]?.id;

    await pool.query(
      `UPDATE drivers
       SET current_location = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           updated_at = NOW()
       WHERE id = $3`,
      [body.lng, body.lat, driverId]
    );

    await redis.geoadd('drivers:online', body.lng, body.lat, driverId);
    await redis.hset(
      `driver:${driverId}:presence`,
      'status', 'online',
      'lat', body.lat,
      'lng', body.lng,
      'heading', body.heading ?? 0,
      'speedKmh', body.speedKmh ?? 0
    );
    app.io.emit('driver:location', { driverId, ...body });
    return { ok: true };
  });

  app.get('/drivers/nearby', { preHandler: [authGuard] }, async (request) => {
    const query = z.object({ lat: z.coerce.number(), lng: z.coerce.number() }).parse(request.query);
    const result = await pool.query(
      `SELECT d.id, u.full_name, d.rating, d.acceptance_rate, d.cancellation_rate,
              ST_Distance(d.current_location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       WHERE d.status = 'online' AND d.current_location IS NOT NULL
       ORDER BY d.current_location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
       LIMIT 10`,
      [query.lng, query.lat]
    );
    return result.rows;
  });
}
