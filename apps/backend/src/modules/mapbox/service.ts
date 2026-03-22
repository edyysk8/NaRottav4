import { env } from '../../config/env.js';

type DirectionsInput = {
  pickupLat: number;
  pickupLng: number;
  destinationLat: number;
  destinationLng: number;
};

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = (bLat - aLat) * Math.PI / 180;
  const dLng = (bLng - aLng) * Math.PI / 180;
  const p1 = aLat * Math.PI / 180;
  const p2 = bLat * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fallbackRoute(input: DirectionsInput) {
  const distanceKm = Number(haversineKm(input.pickupLat, input.pickupLng, input.destinationLat, input.destinationLng).toFixed(2));
  const durationMin = Number(Math.max(4, distanceKm * 2.4).toFixed(1));
  return {
    provider: 'fallback',
    distanceKm,
    durationMin,
    geometry: {
      type: 'LineString',
      coordinates: [
        [input.pickupLng, input.pickupLat],
        [input.destinationLng, input.destinationLat]
      ]
    }
  };
}

export async function getDirections(input: DirectionsInput) {
  try {
    const baseUrl = env.OSRM_BASE_URL.replace(/\/$/, '');
    const url = new URL(`${baseUrl}/route/v1/driving/${input.pickupLng},${input.pickupLat};${input.destinationLng},${input.destinationLat}`);
    url.searchParams.set('overview', 'full');
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('steps', 'true');
    url.searchParams.set('alternatives', 'false');

    const response = await fetch(url);
    if (!response.ok) throw new Error(`OSRM directions failed with ${response.status}`);

    const data = await response.json();
    const route = data.routes?.[0];
    if (!route) throw new Error('Nenhuma rota retornada pelo OSRM');

    return {
      provider: env.MAP_PROVIDER,
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMin: Number((route.duration / 60).toFixed(1)),
      geometry: route.geometry,
      legs: route.legs ?? []
    };
  } catch {
    return fallbackRoute(input);
  }
}
