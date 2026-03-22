import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing env ${name}`);
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  HOST: process.env.HOST ?? '0.0.0.0',
  APP_URL: process.env.APP_URL ?? 'http://localhost:3000',
  API_URL: process.env.API_URL ?? 'http://localhost:4000',
  JWT_SECRET: required('JWT_SECRET', 'supersecret'),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'supersecret',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  DATABASE_URL: required('DATABASE_URL'),
  DATABASE_SSL: String(process.env.DATABASE_SSL ?? 'false') === 'true',
  REDIS_URL: required('REDIS_URL'),
  MERCADO_PAGO_ACCESS_TOKEN: process.env.MERCADO_PAGO_ACCESS_TOKEN ?? '',
  MERCADO_PAGO_WEBHOOK_SECRET: process.env.MERCADO_PAGO_WEBHOOK_SECRET ?? '',
  MAP_PROVIDER: process.env.MAP_PROVIDER ?? 'osm',
  OSRM_BASE_URL: process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org',
  DEFAULT_CITY_CODE: process.env.DEFAULT_CITY_CODE ?? 'default',
  ADMIN_NAME: process.env.ADMIN_NAME ?? 'Administrador NaRotta',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? 'admin@narotta.com',
  ADMIN_PHONE: process.env.ADMIN_PHONE ?? '11999999999',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'Narotta@123'
};
