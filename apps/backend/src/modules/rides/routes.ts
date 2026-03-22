import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../../middleware/auth.js';
import { pool } from '../../db/index.js';
import { findBestDrivers } from '../matching/service.js';
import { getDirections } from '../mapbox/service.js';

const requestRideSchema = z.object({
  pickupAddress: z.string().min(3),
  destinationAddress: z.string().min(3),
  pickupLat: z.number(),
  pickupLng: z.number(),
  destinationLat: z.number(),
  destinationLng: z.number(),
  estimatedDistanceKm: z.number().nonnegative().optional(),
  estimatedDurationMin: z.number().nonnegative().optional(),
  cityCode: z.string().default('default')
});

async function estimatePrice(distanceKm: number, durationMin: number, cityCode: string) {
  const ruleResult = await pool.query(
    `SELECT base_fare, per_km, per_min, minimum_fare
     FROM pricing_rules
     WHERE city_code IN ($1, 'default') AND active = TRUE
     ORDER BY CASE WHEN city_code = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [cityCode]
  );
  const rule = ruleResult.rows[0] ?? { base_fare: 4.5, per_km: 2.1, per_min: 0.4, minimum_fare: 10 };
  const value = Number(rule.base_fare) + distanceKm * Number(rule.per_km) + durationMin * Number(rule.per_min);
  return Math.max(value, Number(rule.minimum_fare));
}

export async function rideRoutes(app: FastifyInstance) {
  app.post('/rides/estimate', { preHandler: [requireRole(['passenger', 'admin'])] }, async (request) => {
    const body = requestRideSchema.parse(request.body);
    const directions = await getDirections({
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      destinationLat: body.destinationLat,
      destinationLng: body.destinationLng
    });

    const estimatedDistanceKm = body.estimatedDistanceKm ?? directions.distanceKm;
    const estimatedDurationMin = body.estimatedDurationMin ?? directions.durationMin;
    const estimatedPrice = await estimatePrice(estimatedDistanceKm, estimatedDurationMin, body.cityCode);
    return { estimatedDistanceKm, estimatedDurationMin, estimatedPrice, directions };
  });

  app.post('/rides/request', { preHandler: [requireRole(['passenger'])] }, async (request) => {
    const body = requestRideSchema.parse(request.body);
    const user = request.user as { sub: string };
    const riderResult = await pool.query('SELECT id FROM riders WHERE user_id = $1', [user.sub]);
    const riderId = riderResult.rows[0]?.id;
    if (!riderId) return { message: 'Passageiro nao encontrado' };

    const directions = await getDirections({
      pickupLat: body.pickupLat,
      pickupLng: body.pickupLng,
      destinationLat: body.destinationLat,
      destinationLng: body.destinationLng
    });

    const estimatedDistanceKm = body.estimatedDistanceKm ?? directions.distanceKm;
    const estimatedDurationMin = body.estimatedDurationMin ?? directions.durationMin;
    const estimatedPrice = await estimatePrice(estimatedDistanceKm, estimatedDurationMin, body.cityCode);

    const rideResult = await pool.query(
      `INSERT INTO rides (
        rider_id, pickup_address, destination_address, pickup_location, destination_location,
        estimated_distance_km, estimated_duration_min, estimated_price, route_geometry
      ) VALUES (
        $1, $2, $3,
        ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
        ST_SetSRID(ST_MakePoint($6, $7), 4326)::geography,
        $8, $9, $10, $11::jsonb
      ) RETURNING *`,
      [
        riderId,
        body.pickupAddress,
        body.destinationAddress,
        body.pickupLng,
        body.pickupLat,
        body.destinationLng,
        body.destinationLat,
        estimatedDistanceKm,
        estimatedDurationMin,
        estimatedPrice,
        JSON.stringify(directions.geometry)
      ]
    );

    const ride = rideResult.rows[0];
    const rankedDrivers = await findBestDrivers(body.pickupLng, body.pickupLat);

    await pool.query(
      `INSERT INTO ride_events (ride_id, event_type, payload)
       VALUES ($1, 'ride.requested', $2::jsonb)`,
      [ride.id, JSON.stringify({ rankedDrivers, directionsProvider: directions.provider })]
    );

    app.io.emit('ride:requested', { rideId: ride.id, candidateDrivers: rankedDrivers, route: directions.geometry });
    return { ride, candidateDrivers: rankedDrivers, directions };
  });

  app.post('/rides/:id/accept', { preHandler: [requireRole(['driver'])] }, async (request, reply) => {
    const params = z.object({ id: z.uuid() }).parse(request.params);
    const user = request.user as { sub: string };
    const driverResult = await pool.query('SELECT id FROM drivers WHERE user_id = $1', [user.sub]);
    const driverId = driverResult.rows[0]?.id;

    const update = await pool.query(
      `UPDATE rides
       SET driver_id = $1, status = 'driver_assigned', accepted_at = NOW()
       WHERE id = $2 AND driver_id IS NULL AND status = 'searching'
       RETURNING *`,
      [driverId, params.id]
    );

    if (!update.rows[0]) return reply.code(409).send({ message: 'Corrida indisponivel' });

    await pool.query(`UPDATE drivers SET status = 'busy' WHERE id = $1`, [driverId]);
    await pool.query(
      `INSERT INTO ride_events (ride_id, event_type, payload)
       VALUES ($1, 'ride.accepted', $2::jsonb)`,
      [params.id, JSON.stringify({ driverId })]
    );
    app.io.emit('ride:accepted', update.rows[0]);
    return update.rows[0];
  });

  app.post('/rides/:id/start', { preHandler: [requireRole(['driver'])] }, async (request) => {
    const params = z.object({ id: z.uuid() }).parse(request.params);
    const result = await pool.query(
      `UPDATE rides SET status = 'in_progress', started_at = NOW() WHERE id = $1 RETURNING *`,
      [params.id]
    );
    await pool.query(`INSERT INTO ride_events (ride_id, event_type) VALUES ($1, 'ride.started')`, [params.id]);
    app.io.emit('ride:started', result.rows[0]);
    return result.rows[0];
  });

  app.post('/rides/:id/finish', { preHandler: [requireRole(['driver'])] }, async (request) => {
    const params = z.object({ id: z.uuid() }).parse(request.params);
    const body = z.object({ finalPrice: z.number().positive() }).parse(request.body);
    const result = await pool.query(
      `UPDATE rides SET status = 'completed', completed_at = NOW(), final_price = $2 WHERE id = $1 RETURNING *`,
      [params.id, body.finalPrice]
    );

    const ride = result.rows[0];
    const platformFee = Number((body.finalPrice * 0.2).toFixed(2));
    const driverPayout = Number((body.finalPrice - platformFee).toFixed(2));

    await pool.query(
      `INSERT INTO payments (ride_id, amount, platform_fee, driver_payout, status, provider, method)
       VALUES ($1, $2, $3, $4, 'captured', 'system', 'pix')
       ON CONFLICT (ride_id) DO UPDATE SET amount = EXCLUDED.amount, platform_fee = EXCLUDED.platform_fee,
         driver_payout = EXCLUDED.driver_payout, status = 'captured', updated_at = NOW()`,
      [params.id, body.finalPrice, platformFee, driverPayout]
    );

    if (ride.driver_id) {
      await pool.query(`UPDATE drivers SET status = 'online' WHERE id = $1`, [ride.driver_id]);
    }

    await pool.query(`INSERT INTO ride_events (ride_id, event_type) VALUES ($1, 'ride.completed')`, [params.id]);
    app.io.emit('ride:completed', ride);
    return ride;
  });

  app.post('/rides/:id/cancel', { preHandler: [requireRole(['passenger', 'driver', 'admin'])] }, async (request, reply) => {
    const params = z.object({ id: z.uuid() }).parse(request.params);
    const body = z.object({ reason: z.string().min(3).max(200) }).parse(request.body);

    const result = await pool.query(
      `UPDATE rides
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $2
       WHERE id = $1 AND status IN ('searching', 'driver_assigned', 'driver_arriving')
       RETURNING *`,
      [params.id, body.reason]
    );

    const ride = result.rows[0];
    if (!ride) return reply.code(409).send({ message: 'Corrida nao pode ser cancelada' });

    if (ride.driver_id) {
      await pool.query(`UPDATE drivers SET status = 'online' WHERE id = $1`, [ride.driver_id]);
    }

    await pool.query(
      `INSERT INTO ride_events (ride_id, event_type, payload) VALUES ($1, 'ride.cancelled', $2::jsonb)`,
      [params.id, JSON.stringify({ reason: body.reason })]
    );
    app.io.emit('ride:cancelled', ride);
    return ride;
  });

  app.get('/rides/:id', { preHandler: [requireRole(['passenger', 'driver', 'admin'])] }, async (request) => {
    const params = z.object({ id: z.uuid() }).parse(request.params);
    const result = await pool.query('SELECT * FROM rides WHERE id = $1', [params.id]);
    return result.rows[0];
  });
}
