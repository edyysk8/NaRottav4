import { apiFetch, requireAdmin } from '../../lib/auth';

async function getRides() {
  const res = await apiFetch('/admin/rides');
  if (!res.ok) throw new Error('Falha ao carregar corridas');
  return res.json();
}

export default async function RidesPage() {
  await requireAdmin();
  const rides = await getRides();
  return (
    <main style={{ padding: 32 }}>
      <h1>Corridas</h1>
      <div style={{ display: 'grid', gap: 14 }}>
        {rides.map((ride: any) => (
          <div key={ride.id} style={{ background: '#121932', padding: 18, borderRadius: 16, border: '1px solid #1f2b55' }}>
            <strong>{ride.rider_name}</strong>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{ride.pickup_address} → {ride.destination_address}</div>
            <div style={{ marginTop: 8 }}>{ride.status} · Estimado R$ {ride.estimated_price} · Final R$ {ride.final_price ?? '-'}</div>
          </div>
        ))}
        {rides.length === 0 && <div style={{ color: '#94a3b8' }}>Sem corridas carregadas.</div>}
      </div>
    </main>
  );
}
