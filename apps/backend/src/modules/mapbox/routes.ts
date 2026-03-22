import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { getDirections } from './service.js';

const directionsSchema = z.object({
  pickupLat: z.coerce.number(),
  pickupLng: z.coerce.number(),
  destinationLat: z.coerce.number(),
  destinationLng: z.coerce.number()
});

export async function mapboxRoutes(app: FastifyInstance) {
  app.get('/config/maps', async () => ({
    provider: env.MAP_PROVIDER,
    tilesUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  }));

  app.get('/maps/directions', async (request) => {
    const query = directionsSchema.parse(request.query);
    return getDirections(query);
  });

  // compatibilidade com versões antigas do app
  app.get('/mapbox/directions', async (request) => {
    const query = directionsSchema.parse(request.query);
    return getDirections(query);
  });
}
