import crypto from 'node:crypto';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { env } from '../../config/env.js';

const enabled = Boolean(env.MERCADO_PAGO_ACCESS_TOKEN);
const client = enabled ? new MercadoPagoConfig({ accessToken: env.MERCADO_PAGO_ACCESS_TOKEN }) : null;

export async function createPixPreference(input: { title: string; externalReference: string; amount: number; payerEmail?: string }) {
  if (!client) {
    return {
      sandbox: true,
      method: 'pix',
      amount: input.amount,
      qrCode: '00020101021226830014br.gov.bcb.pix2561sandbox.narotta.local/pix/qr/123456520400005303986540510.005802BR5920NaRotta Sandbox6009Sao Paulo62140510NAROTTA1236304ABCD',
      qrCodeBase64: 'c2FuZGJveC1uYXJvdHRhLXBpeA==',
      id: `sandbox-${input.externalReference}`
    };
  }

  const preference = new Preference(client);
  const response = await preference.create({
    body: {
      external_reference: input.externalReference,
      items: [
        {
          id: input.externalReference,
          title: input.title,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: Number(input.amount)
        }
      ],
      payment_methods: {
        default_payment_method_id: 'pix'
      },
      payer: input.payerEmail ? { email: input.payerEmail } : undefined,
      notification_url: `${env.API_URL}/payments/webhooks/mercado-pago`
    }
  });

  return response;
}

export async function readPayment(paymentId: string) {
  if (!client) return null;
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

export function validateMercadoPagoSignature(input: {
  xSignature?: string;
  xRequestId?: string;
  dataId?: string;
}): boolean {
  if (!env.MERCADO_PAGO_WEBHOOK_SECRET) return true;
  if (!input.xSignature || !input.dataId) return false;

  const parts = Object.fromEntries(
    input.xSignature
      .split(',')
      .map((entry) => entry.trim().split('='))
      .filter((entry) => entry.length === 2)
  );

  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const manifest = `id:${input.dataId};request-id:${input.xRequestId ?? ''};ts:${ts};`;
  const digest = crypto.createHmac('sha256', env.MERCADO_PAGO_WEBHOOK_SECRET).update(manifest).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hash));
}
