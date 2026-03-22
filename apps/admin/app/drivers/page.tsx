import { apiFetch, requireAdmin } from '../../lib/auth';

async function getDrivers() {
  const res = await apiFetch('/admin/drivers');
  if (!res.ok) throw new Error('Falha ao carregar motoristas');
  return res.json();
}

export default async function DriversPage() {
  await requireAdmin();
  const drivers = await getDrivers();
  return (
    <main style={{ padding: 32 }}>
      <h1>Motoristas</h1>
      <div style={{ background: '#121932', borderRadius: 16, overflow: 'hidden', border: '1px solid #1f2b55' }}>
        {drivers.map((driver: any) => (
          <div key={driver.id} style={{ padding: 16, borderBottom: '1px solid #1f2b55' }}>
            <strong>{driver.full_name}</strong>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>
              {driver.status} · doc {driver.document_status} · nota {driver.rating} · aceitacao {driver.acceptance_rate}% · cancelamento {driver.cancellation_rate}%
            </div>
          </div>
        ))}
        {drivers.length === 0 && <div style={{ padding: 16, color: '#94a3b8' }}>Sem motoristas carregados.</div>}
      </div>
    </main>
  );
}
