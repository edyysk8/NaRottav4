import { FastifyInstance } from 'fastify';
import { requireRole } from '../../middleware/auth.js';
import { pool } from '../../db/index.js';

export async function adminRoutes(app: FastifyInstance) {
  app.get('/admin/stats', { preHandler: [requireRole(['admin'])] }, async () => {
    const [users, drivers, rides, revenue, recentRides, liveDrivers] = await Promise.all([
      pool.query('SELECT role, COUNT(*)::int AS total FROM users GROUP BY role'),
      pool.query("SELECT status, COUNT(*)::int AS total FROM drivers GROUP BY status"),
      pool.query("SELECT status, COUNT(*)::int AS total FROM rides GROUP BY status"),
      pool.query("SELECT COALESCE(SUM(platform_fee), 0)::numeric(10,2) AS total FROM payments WHERE status = 'captured'"),
      pool.query(
        `SELECT DATE_TRUNC('day', requested_at) AS day, COUNT(*)::int AS total
         FROM rides
         WHERE requested_at >= NOW() - INTERVAL '7 days'
         GROUP BY 1
         ORDER BY 1 ASC`
      ),
      pool.query(
        `SELECT d.id, u.full_name, d.status, d.rating,
                ST_Y(d.current_location::geometry) AS lat,
                ST_X(d.current_location::geometry) AS lng
         FROM drivers d
         JOIN users u ON u.id = d.user_id
         WHERE d.current_location IS NOT NULL
         ORDER BY d.updated_at DESC
         LIMIT 50`
      )
    ]);

    return {
      users: users.rows,
      drivers: drivers.rows,
      rides: rides.rows,
      revenue: revenue.rows[0],
      recentRides: recentRides.rows,
      liveDrivers: liveDrivers.rows
    };
  });

  app.get('/admin/rides', { preHandler: [requireRole(['admin'])] }, async () => {
    const result = await pool.query(
      `SELECT r.id, r.status, r.pickup_address, r.destination_address, r.estimated_price, r.final_price, r.requested_at,
              ru.full_name AS rider_name, du.full_name AS driver_name
       FROM rides r
       JOIN riders rd ON rd.id = r.rider_id
       JOIN users ru ON ru.id = rd.user_id
       LEFT JOIN drivers d ON d.id = r.driver_id
       LEFT JOIN users du ON du.id = d.user_id
       ORDER BY r.requested_at DESC
       LIMIT 100`
    );
    return result.rows;
  });

  app.get('/admin/drivers', { preHandler: [requireRole(['admin'])] }, async () => {
    const result = await pool.query(
      `SELECT d.id, u.full_name, u.phone, d.document_status, d.status, d.rating, d.acceptance_rate, d.cancellation_rate,
              ST_Y(d.current_location::geometry) AS lat,
              ST_X(d.current_location::geometry) AS lng
       FROM drivers d
       JOIN users u ON u.id = d.user_id
       ORDER BY d.created_at DESC
       LIMIT 100`
    );
    return result.rows;
  });
}
