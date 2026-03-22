import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireRole } from '../../middleware/auth.js';
import { pool } from '../../db/index.js';
import { createPixPreference, readPayment, validateMercadoPagoSignature } from './mercadopago.js';

export async function paymentRoutes(app: FastifyInstance) {
  app.get('/payments/:rideId', { preHandler: [requireRole(['admin', 'driver', 'passenger'])] }, async (request) => {
    const { rideId } = request.params as { rideId: string };
    const result = await pool.query('SELECT * FROM payments WHERE ride_id = $1', [rideId]);
    return result.rows[0] ?? null;
  });

  app.post('/payments/:rideId/pix', { preHandler: [requireRole(['admin', 'passenger'])] }, async (request) => {
    const { rideId } = request.params as { rideId: string };
    const rideResult = await pool.query(
      `SELECT r.id, r.estimated_price, u.email
       FROM rides r
       JOIN riders rd ON rd.id = r.rider_id
       JOIN users u ON u.id = rd.user_id
       WHERE r.id = $1`,
      [rideId]
    );

    const ride = rideResult.rows[0];
    if (!ride) return { message: 'Corrida nao encontrada' };

    const preference = await createPixPreference({
      title: `Corrida NaRotta ${ride.id}`,
      externalReference: ride.id,
      amount: Number(ride.estimated_price),
      payerEmail: ride.email
    });

    await pool.query(
      `INSERT INTO payments (ride_id, amount, platform_fee, driver_payout, method, status, provider, transaction_reference, provider_payload)
       VALUES ($1, $2, 0, 0, 'pix', 'pending', 'mercado_pago', $3, $4)
       ON CONFLICT (ride_id) DO UPDATE SET method = 'pix', provider = 'mercado_pago', transaction_reference = $3, provider_payload = $4, updated_at = NOW()`,
      [rideId, Number(ride.estimated_price), preference.id ?? `sandbox-${rideId}`, JSON.stringify(preference)]
    );

    return preference;
  });

  app.post('/payments/webhooks/mercado-pago', async (request, reply) => {
    const body = request.body as any;
    const dataId = body?.data?.id ?? body?.id;
    const signatureIsValid = validateMercadoPagoSignature({
      xSignature: request.headers['x-signature'] as string | undefined,
      xRequestId: request.headers['x-request-id'] as string | undefined,
      dataId: dataId ? String(dataId) : undefined
    });

    if (!signatureIsValid) {
      return reply.code(401).send({ ok: false, message: 'Webhook Mercado Pago invalido' });
    }

    if (!dataId) return { ok: true, ignored: true };

    const payment = await readPayment(String(dataId));
    if (!payment?.external_reference) return { ok: true, ignored: true };

    const amount = Number(payment.transaction_amount ?? 0);
    const platformFee = Number((amount * 0.2).toFixed(2));
    const driverPayout = Number((amount - platformFee).toFixed(2));

    const statusMap: Record<string, string> = {
      pending: 'pending',
      approved: 'captured',
      in_process: 'authorized',
      rejected: 'failed',
      cancelled: 'failed',
      refunded: 'refunded'
    };

    await pool.query(
      `UPDATE payments
       SET amount = $2,
           platform_fee = $3,
           driver_payout = $4,
           status = $5,
           transaction_reference = $6,
           provider_payload = $7,
           updated_at = NOW()
       WHERE ride_id = $1`,
      [
        payment.external_reference,
        amount,
        platformFee,
        driverPayout,
        statusMap[payment.status ?? 'pending'] ?? 'pending',
        String(payment.id),
        JSON.stringify(payment)
      ]
    );

    return { ok: true };
  });

  app.post('/payments/:rideId/simulate-capture', { preHandler: [requireRole(['admin'])] }, async (request) => {
    const { rideId } = request.params as { rideId: string };
    const body = z.object({ amount: z.number().positive() }).parse(request.body);
    const platformFee = Number((body.amount * 0.2).toFixed(2));
    const driverPayout = Number((body.amount - platformFee).toFixed(2));
    await pool.query(
      `INSERT INTO payments (ride_id, amount, platform_fee, driver_payout, method, status, provider, transaction_reference)
       VALUES ($1, $2, $3, $4, 'pix', 'captured', 'sandbox', $5)
       ON CONFLICT (ride_id) DO UPDATE SET amount = $2, platform_fee = $3, driver_payout = $4, status = 'captured', updated_at = NOW()`,
      [rideId, body.amount, platformFee, driverPayout, `sandbox-${rideId}`]
    );
    return { ok: true };
  });
}
