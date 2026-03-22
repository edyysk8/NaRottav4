import { apiFetch, requireAdmin } from '../../lib/auth';
import { logoutAction } from '../login/actions';

async function getStats() {
  const res = await apiFetch('/admin/stats');
  if (!res.ok) throw new Error('Falha ao carregar stats');
  return res.json();
}

function card(title: string, value: string | number) {
  return (
    <div style={{ background: '#121932', padding: 20, borderRadius: 16, minWidth: 220, border: '1px solid #1f2b55' }}>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireAdmin();
  const stats = await getStats();
  const passengerCount = stats.users.find((x: any) => x.role === 'passenger')?.total ?? 0;
  const onlineDrivers = stats.drivers.find((x: any) => x.status === 'online')?.total ?? 0;
  const completedRides = stats.rides.find((x: any) => x.status === 'completed')?.total ?? 0;

  return (
    <main style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Dashboard operacional</h1>
          <p style={{ color: '#94a3b8' }}>Sessao ativa de {user.fullName}. Dados reais da API da NaRotta.</p>
        </div>
        <form action={logoutAction}><button style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid #334155', background: 'transparent', color: '#fff' }}>Sair</button></form>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 24, marginBottom: 32 }}>
        {card('Passageiros', passengerCount)}
        {card('Motoristas online', onlineDrivers)}
        {card('Corridas concluidas', completedRides)}
        {card('Receita da plataforma', `R$ ${stats.revenue.total}`)}
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#121932', padding: 20, borderRadius: 16, border: '1px solid #1f2b55' }}>
          <h2 style={{ marginTop: 0 }}>Motoristas ao vivo</h2>
          <div style={{ maxHeight: 320, overflow: 'auto' }}>
            {(stats.liveDrivers || []).map((driver: any) => (
              <div key={driver.id} style={{ padding: '12px 0', borderBottom: '1px solid #1f2b55' }}>
                <strong>{driver.full_name}</strong>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>
                  {driver.status} · nota {driver.rating} · {driver.lat}, {driver.lng}
                </div>
              </div>
            ))}
            {(!stats.liveDrivers || stats.liveDrivers.length === 0) && <div style={{ color: '#94a3b8' }}>Nenhum motorista com localizacao recente.</div>}
          </div>
        </div>

        <div style={{ background: '#121932', padding: 20, borderRadius: 16, border: '1px solid #1f2b55' }}>
          <h2 style={{ marginTop: 0 }}>Corridas por dia</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {(stats.recentRides || []).map((item: any) => (
              <div key={String(item.day)} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #1f2b55' }}>
                <span>{new Date(item.day).toLocaleDateString('pt-BR')}</span>
                <strong>{item.total}</strong>
              </div>
            ))}
            {(!stats.recentRides || stats.recentRides.length === 0) && <div style={{ color: '#94a3b8' }}>Sem dados dos ultimos 7 dias.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
