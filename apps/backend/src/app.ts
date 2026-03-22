import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/routes.js';
import { userRoutes } from './modules/users/routes.js';
import { driverRoutes } from './modules/drivers/routes.js';
import { rideRoutes } from './modules/rides/routes.js';
import { paymentRoutes } from './modules/payments/routes.js';
import { adminRoutes } from './modules/admin/routes.js';
import { mapboxRoutes } from './modules/mapbox/routes.js';

function allowedOrigins() {
  const defaults = [env.APP_URL, 'http://localhost:3000', 'http://localhost:8081', 'http://127.0.0.1:8081'];
  return [...new Set(defaults.filter(Boolean))];
}

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin(origin, cb) {
      if (!origin) return cb(null, true);
      if (allowedOrigins().includes(origin)) return cb(null, true);
      cb(new Error('Origin nao permitida'), false);
    },
    credentials: true
  });

  await app.register(jwt, { secret: env.JWT_SECRET });

  app.get('/', async () => ({
    ok: true,
    service: 'NaRotta API',
    status: 'online',
    mapProvider: env.MAP_PROVIDER,
    timestamp: new Date().toISOString()
  }));

  app.get('/health', async () => ({ ok: true, service: 'narotta-backend', timestamp: new Date().toISOString() }));

  await authRoutes(app);
  await userRoutes(app);
  await driverRoutes(app);
  await rideRoutes(app);
  await paymentRoutes(app);
  await adminRoutes(app);
  await mapboxRoutes(app);

  return app;
}
