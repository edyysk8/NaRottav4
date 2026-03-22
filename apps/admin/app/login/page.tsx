import { loginAction } from './actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasError = Boolean(params?.error);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#020617', color: '#fff' }}>
      <form action={loginAction} style={{ width: 380, background: '#0f172a', padding: 28, borderRadius: 20, border: '1px solid #1e293b', display: 'grid', gap: 14 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>NaRotta Admin</div>
          <div style={{ color: '#94a3b8', marginTop: 6 }}>Login real com JWT + refresh token.</div>
        </div>

        <input name="email" type="email" placeholder="admin@narotta.com" required style={{ padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#020617', color: '#fff' }} />
        <input name="password" type="password" placeholder="Senha" required style={{ padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#020617', color: '#fff' }} />
        <button type="submit" style={{ padding: 14, borderRadius: 12, border: 0, background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Entrar</button>
        {hasError && <div style={{ color: '#fda4af', fontSize: 14 }}>Nao foi possivel autenticar este usuario como admin.</div>}
      </form>
    </main>
  );
}
