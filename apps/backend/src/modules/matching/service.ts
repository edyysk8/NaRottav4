import { pool } from '../../db/index.js';

type Candidate = {
  id: string;
  rating: number;
  acceptance_rate: number;
  cancellation_rate: number;
  distance_meters: number;
  minutes_since_update: number;
  active_rides: number;
  completed_last_24h: number;
};

function score(candidate: Candidate) {
  const distanceScore = Math.max(0, 60 - Number(candidate.distance_meters) / 100);
  const ratingScore = Number(candidate.rating ?? 5) * 7;
  const acceptanceScore = Number(candidate.acceptance_rate ?? 0) * 0.22;
  const cancellationPenalty = Number(candidate.cancellation_rate ?? 0) * 0.45;
  const freshnessPenalty = Number(candidate.minutes_since_update ?? 0) * 1.75;
  const loadPenalty = Number(candidate.active_rides ?? 0) * 20;
  const recencyBoost = Math.min(8, Number(candidate.completed_last_24h ?? 0) * 0.6);
  return Number((distanceScore + ratingScore + acceptanceScore + recencyBoost - cancellationPenalty - freshnessPenalty - loadPenalty).toFixed(2));
}

export async function findBestDrivers(pickupLng: number, pickupLat: number, limit = 12) {
  const result = await pool.query(
    `SELECT d.id, d.rating, d.acceptance_rate, d.cancellation_rate,
            ST_Distance(d.current_location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distance_meters,
            EXTRACT(EPOCH FROM (NOW() - d.updated_at))/60 AS minutes_since_update,
            COUNT(r_active.id)::int AS active_rides,
            COUNT(r_done.id)::int AS completed_last_24h
     FROM drivers d
     LEFT JOIN rides r_active ON r_active.driver_id = d.id AND r_active.status IN ('driver_assigned', 'driver_arriving', 'in_progress')
     LEFT JOIN rides r_done ON r_done.driver_id = d.id AND r_done.status = 'completed' AND r_done.completed_at >= NOW() - INTERVAL '24 hours'
     WHERE d.status = 'online' AND d.document_status = 'approved' AND d.current_location IS NOT NULL
     GROUP BY d.id, d.rating, d.acceptance_rate, d.cancellation_rate, d.current_location, d.updated_at
     ORDER BY d.current_location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
     LIMIT $3`,
    [pickupLng, pickupLat, limit]
  );

  return result.rows
    .map((row: any) => ({ ...row, dispatch_score: score(row as Candidate) }))
    .sort((a: any, b: any) => b.dispatch_score - a.dispatch_score);
}
